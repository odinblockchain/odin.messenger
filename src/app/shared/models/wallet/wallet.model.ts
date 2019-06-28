import { Database } from '../database.model';
import { Unspent } from './unspent.model';
import { Coin } from '../identity';
import { ReplaySubject } from 'rxjs';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Transaction } from './transaction.model';
import { fromObjectRecursive, Observable, fromObject } from 'tns-core-modules/data/observable/observable';
import { Address } from './address.model';
import { ElectrumxUnspent } from '../electrumx';

import { ODIN } from '~/app/bundle.odin';
import { Identity } from '../identity/identity.model';

class InvalidAddress extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidAddress';
  }
}

class BalanceLow extends Error {
  constructor(message) {
    super(message);
    this.name = 'BalanceLow';
  }
}

class TransactionFailed extends Error {
  constructor(message) {
    super(message);
    this.name = 'TransactionFailed';
  }
}

export class Wallet extends Database {
  // static
  static TX_FEE = 0.0001;

  // database
  public id: number;
  public coin_name: string;
  public account_bip44: number;
  public bip44_index: number;
  public balance_conf: number;
  public balance_unconf: number;
  public last_updated: number;
  public last_tx_timestamp: number;

  // runtime
  public electrumXClient: any;
  public coin: Coin;
  public blockheight: number;
  private transactionStream: ReplaySubject<Transaction>;
  public observableIndex: number;

  public addresses$: ObservableArray<Address>;
  private addressIds: any[];

  public transactions$: ObservableArray<Transaction>;
  private transactionTableIds: any[];

  public unspent$: ObservableArray<Unspent>;
  private unspentTableIds: any[];

  constructor(props?: any) {
    super('Wallet');
    this.account_bip44 = -1;
    this.bip44_index = -1;
    this.balance_conf = 0;
    this.balance_unconf = 0;
    this.last_updated = 0;
    this.last_tx_timestamp = 0;

    this.transactionStream = new ReplaySubject();

    this.addresses$ = new ObservableArray();
    this.addressIds = [];
    
    this.transactions$ = new ObservableArray();
    this.transactionTableIds = [];

    this.unspent$ = new ObservableArray();
    this.unspentTableIds = [];

    this.loadTransactions = this.loadTransactions.bind(this);
    this.loadAddresses = this.loadAddresses.bind(this);
    this.appendMatchingWIF = this.appendMatchingWIF.bind(this);

    this.deserialize(props);
  }

  deserialize(input?: any) {
    Object.assign(this, input);
    return this;
  }

  public get transactionsStream$() {
    return this.transactionStream.asObservable();
  }

  public serialize() {
    return {
      id: this.id,
      coin_name: this.coin_name,
      account_bip44: this.account_bip44,
      bip44_index: this.bip44_index,
      balance_conf: this.balance_conf,
      balance_unconf: this.balance_unconf,
      last_updated: this.last_updated,
      last_tx_timestamp: this.last_tx_timestamp,
      blockheight: (this.blockheight) ? this.blockheight : 0,
      observableIndex: this.observableIndex,
      coin: (this.coin)
              ? new Coin(this.coin).serialize()
              : {}
    };
  }

  public async storeUnspentArr(input: Unspent[]): Promise<Unspent[]> {
    if (!await this.dbReady()) {
      this.log(`failed to store unspent transactions for wallet#${this.id} – db not active`);
      return input;
    }

    try {
      let unspentArr: Unspent[] = [];
      while (input.length) {
        unspentArr.push(await this.upsertUnspent(input.shift()));
      }

      return unspentArr;
    } catch (err) {
      console.log(err);
      return input;
    }
  }

  public async upsertUnspent(unspent: Unspent): Promise<Unspent> {
    if (!await this.dbReady()) {
      this.log(`failed to upsert unspent for wallet#${this.id} – db not active`);
      return unspent;
    }

    this.log('UPSERT UNSPENT');
    console.log(unspent);

    const exists = await this.db.get('SELECT id FROM unspent WHERE wallet_id=? AND txid=?', [
      this.id,
      unspent.txid
    ]);

    try {
      if (exists) {
        const updated = await this.db.execSQL(`UPDATE unspent SET wallet_id=?, address_id=?, address=?, txid=?, height=?, txid_pos=?, value=? WHERE wallet_id=? AND txid=?`, [
          this.id,
          unspent.address_id,
          unspent.address,
          unspent.txid,
          unspent.height,
          unspent.txid_pos,
          `${unspent.value}`,
  
          this.id,
          unspent.txid
        ]);

        if (!updated) this.log(`failed to update unspent: ${unspent.txid}`);
        else this.log(`updated unspent ${unspent.txid}`);        
        return unspent;
      } else {
        const unspentId = await this.db.execSQL(`INSERT INTO unspent (wallet_id, address_id, address, txid, height, txid_pos, value) values (?, ?, ?, ?, ?, ?, ?)`, [
          this.id,
          unspent.address_id,
          unspent.address,
          unspent.txid,
          unspent.height,
          unspent.txid_pos,
          `${unspent.value}`
        ]);

        unspent.id = unspentId;
        this.log(`inserted unspent @${unspentId} ${unspent.txid}`);
        return unspent;
      }
    } catch (err) {
      console.log(`Unable to upsert unspent txid(${unspent.txid}) into wallet(${this.id})`);
      console.log(err);
      return unspent;
    }
  }

  public async loadCoinDetails() {
    if (!await this.dbReady()) {
      this.log(`wallet [${this.id}] – db not active`);
      return false;
    }

    this.coin = await this.db.get(`SELECT * FROM coins WHERE name=?`, [this.coin_name]);
  }

  public async loadTransactions() {
    this.log('LOADING TRANSACTIONS');
    this.transactionStream = new ReplaySubject();
    this.transactions$ = new ObservableArray();
    this.transactionTableIds = [];

    const transactions = await this.getTransactions();
    while (transactions.length > 0) {
      const transaction = new Transaction(transactions.shift());
      this.log(`added transaction – ${transaction.txid}`);
      this.transactionStream.next(transaction);
      // this.transactions$.push(fromObject(transaction));
      this.transactions$.push(transaction);
      this.transactionTableIds.push(transaction.id);
    }

    this.log('LoadedTransactions');
    this.log(`loaded transactions for wallet#${this.id}`);
    return this;
  }

  public async getTransactions() {
    if (!await this.dbReady()) {
      this.log(`failed to pull transactions for wallet#${this.id} – db not active`);
      return [];
    }

    // return await this.db.all(`SELECT messages.account_bip44, messages.id, key, name, contact_username, owner_username, message, timestamp, messages.unread, favorite, delivered, status FROM messages INNER JOIN contacts ON messages.contact_username = contacts.username WHERE contacts.username = ?`, this.username);

    return await this.db.all(`SELECT transactions.address_id, transactions.type, transactions.txid, transactions.height, transactions.vin_addresses, transactions.vout_addresses, transactions.value, transactions.timestamp
    FROM transactions INNER JOIN wallets ON transactions.wallet_id = wallets.id WHERE transactions.wallet_id = ?
    ORDER BY (
      CASE transactions.type
        WHEN 'pending'
        THEN 1

        WHEN 'received'
        THEN 2

        WHEN 'sent'
        THEN 2

        WHEN 'self'
        THEN 2

        WHEN 'unknown'
        THEN 3

      END
    ) ASC,
    transactions.timestamp DESC`, this.id);
  }

  public async getUnspent() {
    if (!await this.dbReady()) {
      this.log(`failed to pull transactions for wallet#${this.id} – db not active`);
      return [];
    }
    
    return await this.db.all(`SELECT unspent.id, unspent.wallet_id, unspent.address_id, unspent.height, unspent.txid, unspent.txid_pos, unspent.value, addresses.address, addresses.hash FROM unspent INNER JOIN wallets ON unspent.wallet_id = wallets.id INNER JOIN addresses ON unspent.address_id = addresses.id WHERE unspent.wallet_id = ?`, this.id);
  }

  public async loadUnspent() {
    this.log('LOADING UNSPENT');

    this.unspent$ = new ObservableArray();
    this.unspentTableIds = [];

    const unspentArr = await this.getUnspent();
    console.log('UNSPENT');
    console.log(unspentArr);
    while (unspentArr.length > 0) {
      const unspent = new Unspent(unspentArr.shift());
      this.log(`added unspent - ${unspent.txid}`);
      
      this.unspent$.push(unspent);
      this.unspentTableIds.push(unspent.id);
    }

    this.emit('LoadedUnspent');
    this.log(`loaded unspent for wallet#${this.id}`);
    return this;
  }

  public async removeUnspent(id: number) {
    if (!await this.dbReady()) {
      this.log(`failed to remove unspent id#${id} for wallet#${this.id} – db not active`);
      return false;
    }

    const deleted = await this.db.execSQL(`DELETE FROM unspent WHERE id=?`, id);
    this.log(`Deleted Unspent ID#${id} (${deleted})`);
    return deleted;
  }

  public async loadAddresses() {
    this.log('LOADING ADDRESSES');
    // this.transactionStream = new ReplaySubject();
    this.addresses$ = new ObservableArray();
    this.addressIds = [];

    const addresses = await this.getAddresses();
    while (addresses.length > 0) {
      const address = new Address(addresses.shift());
      this.log(`added address – ${address.address}`);
      // this.transactionStream.next(transaction);
      // this.transactions$.push(fromObject(transaction));
      this.addresses$.push(address);
      this.addressIds.push(address.address);
    }

    this.emit('LoadedAddresses');
    this.log(`loaded addresses for wallet#${this.id}`);
    return this;
  }

  public async getAddresses() {
    if (!await this.dbReady()) {
      this.log(`failed to pull transactions for wallet#${this.id} – db not active`);
      return [];
    }

    return await this.db.all(`SELECT addresses.id, addresses.wallet_id, addresses.bip44_index, addresses.address, addresses.hash, addresses.balance_conf, addresses.balance_unconf, addresses.external, addresses.used, addresses.last_updated, addresses.last_tx_timestamp FROM addresses INNER JOIN wallets ON addresses.wallet_id = wallets.id WHERE addresses.wallet_id = ?`, this.id);
  }

  public async fetchLastAddress() {
    if (!await this.dbReady()) {
      this.log(`failed to pull transactions for wallet#${this.id} – db not active`);
      return [];
    }

    return await this.db.get(`SELECT bip44_index FROM addresses WHERE wallet_id=? AND external=? ORDER BY addresses.bip44_index DESC LIMIT 1`, [this.id, true]);
  }

  /**
   * Executes a SQL `UPDATE` on the current Wallet saving the current wallet state
   */
  public async save(): Promise<any> {
    if (!await this.dbReady()) {
      this.log(`wallet [${this.id}] for [${this.coin_name}] not saved – db not active`);
      return false;
    }

    // this.log('ATTEMPTING TO SAVE');
    // this.dir(this.serialize());
    this.log(`saving wallet#${this.id}...`);

    const updated = await this.db.execSQL(`UPDATE wallets SET coin_name=?, account_bip44=?, balance_conf=?, balance_unconf=?, last_updated=?, last_tx_timestamp=? WHERE id=?`, [
      this.coin_name,
      this.account_bip44,
      this.balance_conf,
      this.balance_unconf,
      Date.now(),
      this.last_tx_timestamp,

      this.id
    ]);

    this.log(`wallet [${this.id}] updated (${updated})`);
    return updated;
  }

  /**
   * Returns the internal "change" address for a given `Address.id`.
   * @param addressId 
   */
  public async getChangeAddress(addressId: number) {
    if (!await this.dbReady()) {
      this.log(`failed to get change address for ${addressId} – db not active`);
      throw new Error('bad_connection');
    }

    console.log(`GET CHANGE ADDRESS FOR ID#${addressId}`);

    const externalAddress = await this.db.get(`SELECT bip44_index, addresses.address FROM addresses INNER JOIN unspent ON addresses.id = unspent.address_id WHERE addresses.id = ?`, addressId);
    // console.log('external...', externalAddress);

    const internalAddress = await this.db.get(`SELECT id, wallet_id, bip44_index, address FROM addresses WHERE external=? AND bip44_index=?`, [false, externalAddress.bip44_index]);
    // console.log('internal...', internalAddress);

    return internalAddress.address;
  }

  /**
   * Inserts a new transaction marked as "Pending" and associates it to this wallet.
   * @param addressId 
   * @param txid 
   * @param value 
   */
  public async insertPendingTransaction(addressId: number, txid: string, value?: number) {
    if (!await this.dbReady()) {
      this.log(`failed to insert pending tx for ${addressId} – db not active`);
      throw new Error('bad_connection');
    }

    const transaction = await Transaction.Create({
      wallet_id: this.id,
      address_id: addressId,
      type: Transaction.TRANSACTION_PENDING,
      txid,
      value,
      timestamp: Date.now()
    });

    return transaction;
  }

  public async sendTransaction(electrumXClient: any, address: string, amount: number) {
    console.log(`[Wallet Module] Sending [${amount}] to [${address}]`);

    try {
      address = address.trim();
      ODIN.address.toOutputScript(address);
    } catch (e) {
      this.emit('TransactionFailed');
      throw new InvalidAddress('failed to build script');
    }

    // make sure known spendables are loaded
    await this.loadUnspent();

    const fee     = (Wallet.TX_FEE * 1e8);
    const value   = parseInt((amount * 1e8).toFixed(0));
    const inputs  = await this.findInputs(value);

    const inputSum    = inputs.reduce((sum, tx) => sum += Number(tx.value), 0);
    const valueTotal  = (fee + value);

    console.log(`sentTransaction –
    Fee:      ${fee}
    Value:    ${value}
    Total:    ${valueTotal}
    ---
    Inputs:   ${inputs.length}
    InputSum: ${inputSum}
    Change:   ${inputSum - valueTotal}\n`);

    inputs.forEach(input => console.log('UNSPENT Input:', JSON.stringify(input)));

    if (inputSum < valueTotal) {
      this.emit('TransactionFailed');
      throw new BalanceLow(`Wallet balance does not cover total amount to send, balance is short ${(valueTotal- inputSum)/1e8}`);
    }

    const transaction = new ODIN.TransactionBuilder();
    transaction.setVersion(1);

    // add inputs
    for (let input of inputs) {
      transaction.addInput(input.txid, Number(input.txid_pos));
      console.log(`...added input:${input.txid}`);
    }

    // add outputs
    transaction.addOutput(address, value);
    console.log(`...added output:${address}`);

    // add change (if any)
    if (inputSum > valueTotal) {
      const changeSum = inputSum - valueTotal;
      const changeAddress = await this.getChangeAddress(inputs[0].address_id);
      transaction.addOutput(changeAddress, changeSum);
      console.log(`...added change:${changeAddress}`);
    }

    // sign inputs
    inputs.forEach((tx, index) => {
      const KeyPair = ODIN.ECPair.fromWIF(tx.wif);
      transaction.sign(index, KeyPair);
      console.log(`...signed tx:${tx.txid}`);
    });

    // // create signed transaction hex
    let signedTx = transaction.build().toHex();

    console.log('~~~ COMPLETE ~~~~', signedTx.length);
    console.dir(signedTx.substr(0, 1024));
    console.dir(signedTx.substr(1024, signedTx.length));

    const sent = await electrumXClient.blockchainTransaction_broadcast(signedTx);
    // const sent = '123456_0f5a686fb288c3352784501ec980be9386379fc98b34d91ea68b81ee0';
    if (sent && sent.length >= 64) {
      console.log(`Transaction ID: ${sent}`);
      this.emit('TransactionSent');

      // Set new balance
      console.log('current balance:', this.balance_conf);

      const balance = parseInt(this.balance_conf.toFixed(0));
      this.balance_conf = parseInt((balance - valueTotal).toFixed(0));
      console.log('set balance to', this.balance_conf);

      await this.save();

      // const txid = `1234x${Math.floor(Math.random() * 10000)}`;
      const txid = sent;

      console.log(`Before Unspent=${this.unspent$.length}`);
      console.log(`Before Transactions=${this.transactions$.length}`);

      await this.insertPendingTransaction(inputs[0].address_id, txid, (valueTotal / 1e8));

      while (inputs.length) {
        const unspentInput = inputs.shift();
        await this.removeUnspent(unspentInput.id);
        const address = await Address.FindByAddress(unspentInput.address, this.id);
        address.balance_conf -= unspentInput.value;
        await address.save();
        console.log(`updated address ${address.address} (${address.balance_conf})`);
      }
      
      await this.loadTransactions();
      await this.loadUnspent();
      await this.loadAddresses();

      console.log(`After Unspent=${this.unspent$.length}`);
      console.log(`After Transactions=${this.transactions$.length}`);

      this.addresses$.forEach(address => {
        console.log(`loaded address (${address.address}) balance (${address.balance_conf})`);
      });

      return txid;
    } else {
      console.log('Transaction failed');
      console.log(sent);
      this.emit('TransactionFailed');
      throw new TransactionFailed('Unable to deliver transaction');
    }
  }

  public refreshWallet() {
    this.log('Refresh Wallet');
    
  }

  /**
   * Private methods
   */

  /**
   * Used to sort an array of Unspent Transactions by their height from oldest
   * to newest first, and then by their value if they both are from the same height
   * @param txA 
   * @param txB 
   */
  private unspentPreferredSort(txA: Unspent, txB: Unspent) {
    if (txA.height < txB.height) return -1;
    if (txA.height > txB.height) return 1;

    if (txA.value > txB.value) return -1;
    if (txA.value < txB.value) return 1;
    return 0;
  };

  /**
   * Given an `Unspent` object, this method will search the `Addresses` table for a matching
   * address based on `address_id` and append the `WIF` that has been stored with the address.
   * @param unspent 
   */
  private async appendMatchingWIF(unspent: Unspent): Promise<Unspent> {
    if (!await this.dbReady()) {
      this.log(`failed to build input package for ${unspent.txid} – db not active`);
      throw new Error('bad_connection');
    }

    const address = await this.db.get(`SELECT addresses.wif FROM addresses INNER JOIN unspent ON addresses.id = unspent.address_id WHERE addresses.id = ?`, unspent.address_id);

    return (unspent.wif = address.wif) && unspent;
  }

  /**
   * Used for reducing an array of `Unspent` objects to determine the sum
   * of their `value`.
   * @param sum 
   * @param tx 
   */
  private sumUnspentValue(sum: number, tx: Unspent) {
    return sum += tx.value
  }


  /**
   * This will return an array of `Unspent` objects associated to this wallet that
   * is equal to or greater than the provided `amount`.
   * 
   * The `amount` provided should be a "high precision whole number" meaning a value
   * of 1.5 would equal 150000000. (1.5 * 1e8);
   * 
   * @param amount
   */
  private findInputs = async (amount: number) => {
    return await Promise.all(this.unspent$.slice(0)
                              .sort(this.unspentPreferredSort)
                              .reduce((txArr: Unspent[], tx: Unspent) => {
                                const sum = txArr.reduce(this.sumUnspentValue, 0);
                                if (sum <= amount) txArr.push(tx);
                                return txArr;
                              }, [])
                              .map(this.appendMatchingWIF)
    );
  }

  /**
   * Static methods
   */

  /**
   * Searches internally for a matching wallet and returns it as a new `Wallet` instance.
   * Returns `null` otherwise.
   * 
   * @param id The wallet internal id
   */
  static async FindById(id: number = 0): Promise<Wallet|null> {
    let wallet = new Wallet();
    if (!await wallet.dbReady()) {
      throw new Error('Unable to connect to db');
    }
    
    const matchingWallet = await wallet.db.get('SELECT * FROM wallets WHERE id=?', [
      id
    ]);

    if (!matchingWallet) return null;

    wallet.log(`FindById – Found match id:[${matchingWallet.id}] bip44:[${matchingWallet.bip44_index}]`);
    wallet.deserialize(matchingWallet);
    return wallet;
  }

  /**
   * Searches internally for a matching wallet and returns it as a new `Wallet` instance.
   * Returns `null` otherwise.
   * 
   * @param bip44 The wallet BIP44 Path
   * @param account_bip44 (optional) An account BIP44 Path
   */
  static async FindByBip44(bip44: number = 0, account_bip44?: number): Promise<Wallet|null> {
    let wallet = new Wallet();
    if (!await wallet.dbReady()) {
      throw new Error('Unable to connect to db');
    }
    
    const sql = (!isNaN(account_bip44))
                  ? 'SELECT * FROM wallets WHERE bip44_index=? AND account_bip44=?'
                  : 'SELECT * FROM wallets WHERE bip44_index=?';
                  
    const matchingWallet = await wallet.db.get(sql, (!isNaN(account_bip44)) ? [bip44, account_bip44] : [bip44]);
    if (!matchingWallet) return null;

    wallet.log(`FindByBip44 – Found match id:[${matchingWallet.id}] bip44:[${matchingWallet.bip44_index}]`);
    wallet.deserialize(matchingWallet);
    return wallet;
  }

  /**
   * Attempts to insert a new `Wallet` internally. Requires `input` have at least a `coin_name`, `account_bip44`,
   * and `bip44_index`.
   * 
   * After validation, it will check if the provided wallet already exists. If it does,
   * it will merge the existing wallet with the provided `input` and then execute a `save()`.
   * 
   * If it does not exist, a new one will be inserted.
   * 
   * @async
   * @function Create
   * @static
   * @param input (optional) The wallet input, should match properties of a `Wallet`
   * @returns {Promise<Wallet>}
   */
  static async Create(input?: any): Promise<Wallet> {
    const wallet = new Wallet(input);
    if (!await wallet.dbReady()) {
      throw new Error('Unable to connect to db');
    }

    const matchingWallet = await Wallet.FindByBip44(wallet.bip44_index, wallet.account_bip44);
    if (matchingWallet) {
      wallet.log(`id:[${matchingWallet.id}] b:[${wallet.bip44_index}] already saved... merging`);
      matchingWallet.deserialize(wallet);
      await matchingWallet.save();
      return matchingWallet;
    }
    else {
      const walletId = await wallet.db.execSQL(`INSERT INTO wallets (coin_name, account_bip44, bip44_index) values (?, ?, ?)`, [
        wallet.coin_name,
        wallet.account_bip44,
        wallet.bip44_index
      ]);

      wallet.id = walletId;
      wallet.log(`Stored b[${wallet.bip44_index}] with id:${wallet.id}`);
    }

    return wallet;
  }
}
