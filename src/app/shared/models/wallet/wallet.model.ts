import { Database } from '../database.model';
import { Unspent } from './unspent.model';
import { Coin } from '../identity';
import { ReplaySubject } from 'rxjs';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Transaction } from './transaction.model';
import { fromObjectRecursive, Observable, fromObject } from 'tns-core-modules/data/observable/observable';

export class Wallet extends Database {
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
  public transactions$: ObservableArray<Observable>;
  private transactionStream: ReplaySubject<Transaction>;
  private transactionTableIds: any[];

  constructor(props?: any) {
    super('Wallet');
    this.account_bip44 = -1;
    this.bip44_index = -1;
    this.balance_conf = 0;
    this.balance_unconf = 0;
    this.last_updated = 0;
    this.last_tx_timestamp = 0;

    this.transactionStream = new ReplaySubject();
    this.transactions$ = new ObservableArray();
    this.transactionTableIds = [];

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
      coin: (this.coin)
              ? new Coin(this.coin).serialize()
              : {}
    };
  }

  public async upsertUnspent(unspent: Unspent) {
    if (!this.db || !this.db.isOpen()) {
      return false;
    }

    const exists = await this.db.get('SELECT id FROM unspent WHERE wallet_id=? AND txid=?', [
      this.id, unspent.txid
    ]);

    if (!exists) {
      try {
        return await this.db.execSQL(`INSERT INTO unspent (wallet_id, address_id, txid, height, txid_pos, value) values (?, ?, ?, ?, ?, ?)`, [
          this.id,
          unspent.address_id,
          unspent.txid,
          unspent.height,
          unspent.txid_pos,
          unspent.value
        ]);
      } catch (err) {
        console.log(`Unable to insert unspent txid(${unspent.txid}) into wallet(${this.id})`);
        console.log(err);
        return false;
      }
    } else {
      try {
        if (await this.db.execSQL(`UPDATE unspent SET wallet_id=?, address_id=?, txid=?, height=?, txid_pos=?, value=? WHERE wallet_id=? AND txid=?`, [
          this.id,
          unspent.address_id,
          unspent.txid,
          unspent.height,
          unspent.txid_pos,
          unspent.value,
  
          this.id,
          unspent.txid
        ])) {
          return true;
        } else {
          throw new Error(`unspent txid(${unspent.txid}) NOT UPDATED`);
        }
      } catch (err) {
        this.log(`Unable to update txid(${unspent.txid}) for wallet(${this.id})`);
        console.log(err);
        return false;
      }
    }
  }

  public async getUnspent() {
    if (!this.db || !this.db.isOpen()) {
      return [];
    }
    
    return await this.db.all(`SELECT unspent.height, unspent.txid, unspent.txid_pos, unspent.value, addresses.address, addresses.hash FROM unspent INNER JOIN wallets ON unspent.wallet_id = wallets.id INNER JOIN addresses ON unspent.address_id = addresses.id WHERE unspent.wallet_id = ?`, this.id);
  }

  public async loadCoinDetails() {
    if (!await this.dbReady()) {
      this.log(`wallet [${this.id}] – db not active`);
      return false;
    }

    this.coin = await this.db.get(`SELECT * FROM coins WHERE name=?`, [this.coin_name]);
  }

  public async loadTransactions() {
    this.transactionStream = new ReplaySubject();
    this.transactions$ = new ObservableArray();
    this.transactionTableIds = [];

    const transactions = await this.getTransactions();
    while (transactions.length > 0) {
      const transaction = transactions.shift();
      this.log(`added transaction – ${transaction.txid}`);
      this.transactionStream.next(new Transaction(transaction));
      this.transactions$.push(fromObject(transaction));
      this.transactionTableIds.push(transaction.id);
    }

    this.log(`loaded transactions for wallet#${this.id}`);
    return this;
  }

  public async getTransactions() {
    if (!await this.dbReady()) {
      this.log(`failed to pull transactions for wallet#${this.id} – db not active`);
      return [];
    }

    // return await this.db.all(`SELECT messages.account_bip44, messages.id, key, name, contact_username, owner_username, message, timestamp, messages.unread, favorite, delivered, status FROM messages INNER JOIN contacts ON messages.contact_username = contacts.username WHERE contacts.username = ?`, this.username);

    return await this.db.all(`SELECT transactions.address_id, transactions.type, transactions.txid, transactions.height, transactions.vin_addresses, transactions.vout_addresses, transactions.value, transactions.timestamp FROM transactions INNER JOIN wallets ON transactions.wallet_id = wallets.id WHERE transactions.wallet_id = ?`, this.id);
  }

  // public async getUnspent() {
  //   if (!this.db || !this.db.isOpen()) {
  //     return [];
  //   }
    
  //   return await this.db.all(`SELECT unspent.height, unspent.txid, unspent.txid_pos, unspent.value, addresses.address, addresses.hash FROM unspent INNER JOIN wallets ON unspent.wallet_id = wallets.id INNER JOIN addresses ON unspent.address_id = addresses.id WHERE unspent.wallet_id = ?`, this.id);
  // }

  /**
   * Executes a SQL `UPDATE` on the current Account user saving the current account back to the table.
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
