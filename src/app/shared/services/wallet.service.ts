import { Injectable } from '@angular/core';
import { Wallet, Address, Transaction, Unspent } from '~/app/shared/models/wallet';
import { StorageService } from '../storage.service';
import { CoinService } from './coin.service';
import { Coin } from '../models/identity';
const SqlLite = require('nativescript-sqlite');
import { ElectrumxClient } from 'nativescript-electrumx-client';

import { ODIN } from '~/app/bundle.odin';
import { Buffer } from 'buffer';
import { IdentityService } from './identity.service';
import { InspectTransaction, InspectAPIFetchTransaction, InspectAPITransactionVIN, InspectAPITransactionVOUT } from '../models/inspect-api';
import { ElectrumxTransaction, ElectrumxUnspent, ElectrumxAddress, ElectrumxAddressDiscovery, ElectrumxBalance } from '../models/electrumx';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
// import { Observable } from 'tns-core-modules/ui/page/page';
import { fromObject, Observable, fromObjectRecursive } from 'tns-core-modules/data/observable/observable';
import { HttpResponse, request } from 'tns-core-modules/http/http';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
// import { Observable } from 'rxjs';

const WalletKey = 'app_wallets';
const UserAgent = 'ODINX 0.2.6';

const MockInspectFetchTX = {
  "status": "ok",
  "tx": {
    "vin": [
      {
        "addresses": "oK32gxSDw2T7KpwFA1C4U5hR53QfquJEDH",
        "amount": 0.01004883
      },
      {
        "addresses": "oHe5FSnZxgs81dyiot1FuSJNuc1mYWYd1Z",
        "amount": 1
      }
    ],
    "vout": [
      {
        "addresses": "oKrvbm836FVPcaKMxQn7JbFVVo53P9rMBG",
        "amount": 1,
        "hex": [
          ""
        ]
      },
      {
        "addresses": "oLunpiEPBmrB5ujhgoKP86TvpJYtGo63B2",
        "amount": 0.01000165,
        "hex": [
          ""
        ]
      }
    ],
    "total": 1.01000165,
    "timestamp": 1554203640,
    "blockheight": 269318,
    "blockhash": "7724377865b92351d3909465f81d817bbcd1e472bf732d557b3211fbc13dc97a"
  }
};

const MockBlockheight = {
  "jsonrpc": "2.0",
  "result": {
    "hex": "04000000b7ab174d3ec5d3dd385e234a18c9f0d67ac8957c80ae68942072c92f10b6ad9487edd97a2b4c3abd971f5a4fa293dff5405effd40d31f364b86b26b6289684f9c840a35c602b251a000000000000000000000000000000000000000000000000000000000000000000000000",
    "height": 269301
  },
  "id": "1"
};

const MockNewBlockSubscription = {
  "jsonrpc": "2.0",
  "method": "blockchain.headers.subscribe",
  "params": [{
    "hex": "040000007f6d074125dca37d6d2f22f3507a4ee7c2aebdd100f26194160e116511897a31ab3ff76d908d63fee36c46a76fe5c0031d5025c83b24e8d4ae2134e814acb1593041a35c47d6241a000000000000000000000000000000000000000000000000000000000000000000000000",
    "height": 269302
  }]
};

const MockVersion = {
  "jsonrpc": "2.0",
  "result": ["ElectrumX 1.9.1", "1.4"],
  "id": "2"
}

const MockBalanceEmpty = {
  "jsonrpc": "2.0",
  "result": {
    "confirmed": 0,
    "unconfirmed": 0
  },
  "id": "3"
};

const MockBalanceFilled = {
  "jsonrpc": "2.0",
  "result": {
    "confirmed": 135000000,
    "unconfirmed": 0
  },
  "id": "3"
};

const MockTxEmpty = {
  "jsonrpc": "2.0",
  "result": [],
  "id": "4"
};

const MockTxFilled = {
  "jsonrpc": "2.0",
  "result": [{
    "tx_hash": "8bea60e0f5a686fb288c3352784501ec980be9386379fc98b34d91ea68b81ee0",
    "height": 269318
  }, {
    "tx_hash": "f1fe9e390776af9524038b933527a3f1484d4cf361c2c976f1ca33352f15653c",
    "height": 269319
  }, {
    "tx_hash": "12ef743b9c99132bb89d9aab631ab18475f89dd305042204f2d05d0c1aba0e52",
    "height": 269319
  }],
  "id": "4"
};

const MockUnspentEmpty = {
  "jsonrpc": "2.0",
  "result": [],
  "id": "5"
};

const MockUnspentFilled = {
  "jsonrpc": "2.0",
  "result": [{
    "tx_hash": "8bea60e0f5a686fb288c3352784501ec980be9386379fc98b34d91ea68b81ee0",
    "tx_pos": 0,
    "height": 269318,
    "value": 100000000
  }, {
    "tx_hash": "f1fe9e390776af9524038b933527a3f1484d4cf361c2c976f1ca33352f15653c",
    "tx_pos": 0,
    "height": 269319,
    "value": 30000000
  }, {
    "tx_hash": "12ef743b9c99132bb89d9aab631ab18475f89dd305042204f2d05d0c1aba0e52",
    "tx_pos": 1,
    "height": 269319,
    "value": 5000000
  }],
  "id": "5"
}

class AddressBundle {
  index: number;
  address: string;
  hash: string;
  wif: string;
  balance: ElectrumxBalance;
  transactions: ElectrumxTransaction[];
  unspent: ElectrumxUnspent[];
};

class AddressDiscovery {
  addresses: Address[];
  transactions: Transaction[];
  unspent: ElectrumxUnspent[];
}

@Injectable({
  providedIn: 'root'
})
export class WalletService extends StorageService {
  public wallets: Wallet[];
  public wallets$: ObservableArray<Wallet>;
  private walletStream: ReplaySubject<Wallet>;

  public electrumxConnected: boolean;
  public electrumxClient: any;
  private _electrumxTimer: any;

  public activeWalletIndex: number;
  public activeWallet: Wallet;
  public serverVersion: any;

  public trackedBlockheight: BehaviorSubject<number>;

  private blockStream: BehaviorSubject<number>;

  constructor(
    private _CoinServ: CoinService,
    private _IdentityServ: IdentityService
  ) {
    super('WalletService');
    this.wallets = [];
    this.wallets$ = new ObservableArray();
    this.walletStream = new ReplaySubject();
    this.trackedBlockheight = new BehaviorSubject(0);
    this.blockStream = new BehaviorSubject(0);
    this.electrumxConnected = false;
    this.activeWalletIndex = null;
    this.activeWallet = null;

    this.init = this.init.bind(this);
    this.loadWallets = this.loadWallets.bind(this);

    this.onHandleData = this.onHandleData.bind(this);
    this.onHandleBlockchainHeaders = this.onHandleBlockchainHeaders.bind(this);
    this.onHandleError = this.onHandleError.bind(this);
    this.validateSession = this.validateSession.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadWallets)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  public get blockStream$() {
    return this.blockStream.asObservable();
  }

  public get walletStream$() {
    return this.walletStream.asObservable();
  }

  private async loadWallets() {
    if (!await this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const wallets: Wallet[] = await this.odb.all('SELECT * FROM wallets');
        while (wallets.length > 0) {
          let wallet = new Wallet(wallets.shift());
          wallet.db = this.odb;
          wallet.observableIndex = this.wallets$.length;
          this.log(`SETTING INDEX TO ${wallet.observableIndex}`);
          await wallet.loadCoinDetails();

          this.log(`added wallet – ${wallet.id}`);
          this.wallets.push(wallet);
          // this.wallets$.push(fromObjectRecursive(wallet));
          this.wallets$.push(wallet);
          this.walletStream.next(wallet);
        }

        this.log(`wallets loaded...${this.wallets.length}`);
        return resolve(this.wallets);
      } catch (err) {
        this.log('Unable to load wallets...');
        console.log(err);
        return reject(err);
      }
    });
  }

  public keepAlive() {
    this.log('--- KeepAlive');
  }

  public async createDefaultWallet(): Promise<Wallet> {
    this.emit('CreateDefaultWallet');
    this.log('[Wallet Default Creation Start]');

    const defaultCoin = this._CoinServ.defaultCoinDetails();
    try {
      const wallet = await this.createWallet(defaultCoin, 0);
      this.emit('FinishDefaultWallet');
      this.log('[Wallet Default Creation Finished]');

      console.log(wallet.serialize());
      return wallet;
    } catch (err) {
      this.log('ERR – Unable to create default wallet!');
      console.log(err.message ? err.message : err);
      console.log(err.stack);
      throw new Error('WalletCreationFailed');
    }
  }

  private async createWallet(coin: Coin, walletAccountPath: number): Promise<any> {
    this.emit('CreateWallet');
    this.log('[Wallet Creation Start]');

    const phrase = this._IdentityServ.identity.mnemonicPhrase;

    if (coin.name === 'ODIN') {
      let seed  = ODIN.bip39.mnemonicToSeed(phrase);
      let sroot = ODIN.bip32.fromSeed(seed, ODIN.networks.bitcoin);

      let wallet = await Wallet.Create({
        coin_name: coin.name,
        account_bip44: this._IdentityServ.getActiveAccount().bip44_index,
        bip44_index: walletAccountPath
      });

      wallet.db   = this.odb;
      wallet.coin = coin;
      wallet.observableIndex = this.wallets$.length;

      this.wallets.push(wallet);
      // this.wallets$.push(fromObjectRecursive(wallet));
      this.wallets$.push(wallet);
      this.walletStream.next(wallet);
      
      await this.establishConnection(wallet);
      this.log('Done with connection');
      this.emit('ElectrumxConnectionEstablished');

      await this.walletDiscovery(wallet, sroot, walletAccountPath);
      this.emit('FinishCreateWallet');
      this.log('[Wallet Creation Finished]');

      return wallet;
    } else {
      throw new Error(`Unable to handle wallet creation for coin ${coin.name}`);
    }
  }

  public async refreshWallet(wallet: Wallet): Promise<any> {
    this.log(`Refreshing wallet #${wallet.id}`);
    this.emit(`RefreshWalletStart`);

    const phrase = this._IdentityServ.identity.mnemonicPhrase;

    if (wallet.coin.name === 'ODIN') {
      let seed  = ODIN.bip39.mnemonicToSeed(phrase);
      let sroot = ODIN.bip32.fromSeed(seed, ODIN.networks.bitcoin);
      
      await this.establishConnection(wallet);
      this.log('Done with connection');
      this.emit('ElectrumxConnectionEstablished');

      await this.walletDiscovery(wallet, sroot, wallet.bip44_index);
      this.emit('RefreshWalletEnd');
      this.log('[Wallet Refresh Finished]');

      return wallet;
    } else {
      this.emit('RefreshWalletEnd');
      throw new Error(`Unable to refresh wallet #${wallet.id}`);
    }
  }

  /**
   * @todo cleanup
   * Discovers external and internal addresses associated to an `accountIndex`. Returns a full account
   * summary.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account "wallet" to discover.
   */
  private async walletDiscovery(wallet: Wallet, pathRoot: any, accountPath: any): Promise<Wallet> {
    this.emit('StartWalletDiscovery');
    this.log('[Discover Wallet Start]');

    // discover external/internal addresses
    let externalDiscovery = await this.externalAddressDiscovery(wallet, pathRoot, accountPath);
    let internalDiscovery = await this.internalAddressDiscovery(
      wallet, pathRoot, accountPath, externalDiscovery.addresses.filter(this.usedAddress)
    );

    // console.log('array1?', externalDiscovery.unspent[0] instanceof Array);
    // console.log('unspent1a?', externalDiscovery.unspent[0] instanceof Unspent);
    // console.log('unspent1b?', externalDiscovery.unspent[0] instanceof ElectrumxUnspent);
    // console.log('array2?', externalDiscovery.unspent instanceof Array);
    // console.log('unspent2?', externalDiscovery.unspent instanceof Unspent);

    // save external unspent transactions
    const externalUnspentArr = await wallet.storeUnspentArr(externalDiscovery.unspent.map(item => {
      // console.log('ITEM???', item);
      return new Unspent({
        wallet_id: wallet.id,
        address_id: (externalDiscovery.addresses.find((address) => address.address === item.address) || {id: ''}).id,
        address: item.address,
        height: item.height,
        txid: item.tx_hash,
        txid_pos: item.tx_pos,
        value: item.value
      });
    }));

    const internalUnspentArr = await wallet.storeUnspentArr(internalDiscovery.unspent.map(item => {
      // console.log('ITEM???', item);
      return new Unspent({
        wallet_id: wallet.id,
        address_id: (internalDiscovery.addresses.find((address) => address.address === item.address) || {id: ''}).id,
        address: item.address,
        height: item.height,
        txid: item.tx_hash,
        txid_pos: item.tx_pos,
        value: item.value
      });
    }));

    // console.log('UNSPENT');
    // console.log(externalUnspentArr);
    // console.log(internalUnspentArr);

    // sum confirmed balances (external/internal)
    let sumExternalConfirmed = externalDiscovery.addresses.reduce(this.sumAddressConfirmedBalance, 0);
    let sumInternalConfirmed = internalDiscovery.addresses.reduce(this.sumAddressConfirmedBalance, 0);

    // sum unconfirmed balances (external/internal)
    let sumExternalUnconfirmed = externalDiscovery.addresses.reduce(this.sumAddressUnconfirmedBalance, 0);
    let sumInternalUnconfirmed = internalDiscovery.addresses.reduce(this.sumAddressUnconfirmedBalance, 0);

    // console.log('ext', externalDiscovery.transactions);
    // console.log('int', internalDiscovery.transactions);

    // set wallet conf/unconf balances
    wallet.balance_conf       = Number(sumExternalConfirmed + sumInternalConfirmed);
    wallet.balance_unconf     = Number(sumExternalUnconfirmed + sumInternalUnconfirmed);
    
    const last_tx_timestamp   = this.findMostRecentTimestamp(externalDiscovery.transactions.concat(internalDiscovery.transactions));
    if (last_tx_timestamp > wallet.last_tx_timestamp) wallet.last_tx_timestamp = last_tx_timestamp;

    await this.updateWallet(wallet);

    // console.log('External', externalDiscovery.addresses[0]);
    // console.log('Internal', internalDiscovery.addresses[0]);
    // console.log('Wallet', wallet.serialize());

    this.emit('FinishWalletDiscovery');
    this.log('[Discover Wallet Finish]');
    return wallet;
  }

  private async updateWallet(wallet: Wallet): Promise<Wallet> {
    this.log(`Updating wallet – id:${wallet.id} index:${wallet.observableIndex}`);
    if (!isNaN(wallet.observableIndex)) {
      // this.wallets$.setItem(wallet.observableIndex, fromObjectRecursive(wallet));
      this.wallets$.setItem(wallet.observableIndex, wallet);
    } else {
      this.log(`Internal wallet array not updated, missing observableIndex`);
    }

    await wallet.save();
    return wallet;
  }

  private findMostRecentTimestamp(transactions: Transaction[]): number {
    if (!transactions || !transactions.length) return 0;
    return transactions.reduce((timestamp: number, tx: Transaction) => {
      if (!tx || isNaN(tx.timestamp)) return timestamp;
      if (timestamp === 0 || tx.timestamp > timestamp) timestamp = tx.timestamp;
      return timestamp;
    }, 0);
  }

  /**
   * Used in `Array.reduce`, returns the total sum of all `confirmed` balances
   * through the associated array of Addresses.
   * 
   * @param sum The accumulator that is passed through the reduction
   * @param address The blockchain Address
   */
  private sumAddressConfirmedBalance(sum: number, address: Address): number {
    return sum = sum + Number(address.balance_conf);
  }

  /**
   * Used in `Array.reduce`, returns the total sum of all `unconfirmed` balances
   * through the associated array of Addresses.
   * 
   * @param sum The accumulator that is passed through the reduction
   * @param address The blockchain Address
   */
  private sumAddressUnconfirmedBalance(sum: number, address: Address): number {
    return sum = sum + Number(address.balance_unconf);
  }

  /**
   * Filters a given array of Addresses and returns only Addresses that
   * have had previous transaction history.
   * 
   * @param address A ElectrumX Address
   * @param index The index of the filter
   * @param addressArray The array being filtered
   */
  private usedAddress(address: Address, index: number, addressArray: Address[]): boolean {
    if (!address) return false;
    return address.used;
  }

  /**
   * Discovery method for internal (change-only) addresses which should have a 1:1 association
   * with `active` external accounts "Addresses". An Address is considered `active` if it has had
   * at least one transaction.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account "wallet" to discover.
   * @param activeExternalAddresses An array of active external Addresses.
   */
  private async internalAddressDiscovery(wallet: Wallet, seed: any, accountIndex: number, addresses: Address[]): Promise<AddressDiscovery> {
    this.emit('StartDiscoverInternal');
    this.log('[Discover Internal]');

    // make shallow copy of addresses
    let externalAddresses: Address[] = addresses.slice(0);

    let internalAddresses: Address[]  = [];
    let transactions: Transaction[]   = [];
    let unspent: ElectrumxUnspent[]   = [];

    while (externalAddresses.length) {
      const externalAddress = externalAddresses.shift();

      let addressPull: AddressBundle = await this.fetchAddressDetails(wallet, seed, accountIndex, externalAddress.bip44_index, false);
      if (externalAddress.bip44_index === 0) this.logAddressBundle(addressPull);

      const address = await Address.Create({
        wallet_id: wallet.id,
        bip44_index: addressPull.index,
        address: addressPull.address,
        hash: addressPull.hash,
        wif: addressPull.wif,
        balance_conf: addressPull.balance.confirmed,
        balance_unconf: addressPull.balance.unconfirmed,
        external: false,
        last_tx_timestamp: 0,
        used: (addressPull.transactions.length) ? true : false
      });

      const addressTransactions = await this.transactionDiscovery(wallet, address, addressPull.transactions);
      if (addressTransactions && addressTransactions.length) {
        address.used = true;
        address.last_tx_timestamp = this.findMostRecentTimestamp(addressTransactions);
        await address.save();
      }

      internalAddresses.push(address);
      transactions = transactions.concat(addressTransactions);
      unspent = unspent.concat(addressPull.unspent);
    }

    this.emit('FinishDiscoverInternal');
    this.log('[Discover Internal Finished]');

    return {
      addresses:    internalAddresses,
      transactions: transactions,
      unspent:      unspent
    };
  }

  /**
   * Discovery method for external (non-change) addresses. Will loop through all potential addresses
   * associated to an `accountIndex` or "wallet" until the agreed gap limit is reached.
   * 
   * The established "Gap Limit" is 20 addresses. This means, 20 addresses that have no prior
   * transaction history. Internally referred to as `active` addresses. Once 20 addresses have
   * been discovered and verified to not be `active` then we can safely assume we are done with
   * this discovery.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account "wallet" to discover.
   */
  private async externalAddressDiscovery(wallet: Wallet, seed: any, accountIndex: number): Promise<AddressDiscovery> {
    this.emit('StartDiscoverExternal');
    this.log('[Discover External]');
    
    // path for address, starts at 0
    let addressIndex: number = 0;

    // number of "gaps" to establish end of discovery, excludes starting index of 0
    let addressGapCounter: number = 2;

    let externalAddresses: Address[]  = [];
    let transactions: Transaction[]   = [];
    let unspent: ElectrumxUnspent[]   = [];

    while (addressGapCounter >= 0) {

      let addressPull: AddressBundle = await this.fetchAddressDetails(wallet, seed, accountIndex, addressIndex, true);
      // if (addressIndex === 0) this.logAddressBundle(addressPull);

      const address = await Address.Create({
        wallet_id: wallet.id,
        bip44_index: addressPull.index,
        address: addressPull.address,
        hash: addressPull.hash,
        wif: addressPull.wif,
        balance_conf: addressPull.balance.confirmed,
        balance_unconf: addressPull.balance.unconfirmed,
        external: true,
        last_tx_timestamp: 0,
        used: (addressPull.transactions.length) ? true : false
      });

      this.log(`external address ${address.address} transactions ${addressPull.transactions.length} used?${address.used}`);

      const addressTransactions = await this.transactionDiscovery(wallet, address, addressPull.transactions);
      if (addressTransactions && addressTransactions.length) {
        address.used = true;
        address.last_tx_timestamp = this.findMostRecentTimestamp(addressTransactions);
        await address.save();
      }

      externalAddresses.push(address);
      transactions = transactions.concat(addressTransactions);
      unspent = unspent.concat(addressPull.unspent);

      addressIndex++;

      // only decrement if current externalAccount has transactions (unused)
      if (addressPull.transactions.length === 0) addressGapCounter--;
    }

    this.emit('FinishDiscoverExternal');
    this.log('[Discover External Finished]');

    return {
      addresses:    externalAddresses,
      transactions: transactions,
      unspent:      unspent
    };
  }

  /**
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account "wallet" to discover.
   * @param addressIndex The current address to fetch details for.
   * @param isExternal Determines if the details should be for the external or internal (change) address.
   */
  private async fetchAddressDetails(wallet: Wallet, seed: any, accountIndex: number, addressIndex: number, isExternal: boolean): Promise<AddressBundle> {
    const change        = (isExternal) ? 0 : 1;
    const AddressPath   = seed.derivePath(`m/44'/${wallet.coin.bip44}'/${accountIndex}'/${change}/${addressIndex}`);
    const Address       = ODIN.payments.p2pkh({ pubkey: AddressPath.publicKey });

    const script        = ODIN.address.toOutputScript(Address.address);
    const hash          = ODIN.crypto.sha256(script);
    const reversedHash  = new Buffer(hash.reverse()).toString('hex');
      
    // let balance   = { confirmed: 0, unconfirmed: 0 };
    // let txHistory = [];
    // let unspent   = [];
    
    const balance   = await this.electrumxClient.blockchainScripthash_getBalance(reversedHash);
    const txHistory = await this.electrumxClient.blockchainScripthash_getHistory(reversedHash);
    const unspent   = await this.electrumxClient.blockchainScripthash_listunspent(reversedHash);

    return {
      index:          addressIndex,
      address:        Address.address,
      hash:           reversedHash,
      wif:            AddressPath.toWIF(),
      balance:        balance,
      transactions:   txHistory.map((tx: ElectrumxTransaction) => Object.assign(tx, { address: Address.address })),
      unspent:        unspent.map((tx: ElectrumxUnspent) => Object.assign(tx, { address: Address.address }))
    };
  }

  private logAddressBundle(address: AddressBundle) {
    try {
      console.log(`
[LogAddressbundle]
      Address:        ${address.address}
      reverseHash:    ${address.hash}
      
      BALANCE_CONF:   ${JSON.stringify(address.balance.confirmed)}
      BALANCE_UNCONF: ${JSON.stringify(address.balance.unconfirmed)}\n`);
      console.log(`
      TX:             ${JSON.stringify(address.transactions)}
      UNSPENT:        ${JSON.stringify(address.unspent)}\n\n`);
    } catch (err) { }
  }

  /**
   * Runs through an given set of Transactions and discovers metadata for each. Returns the
   * original array with additional details.
   * 
   * @param transactions Transactions to discover
   */
  private async transactionDiscovery(wallet: Wallet, address: Address, transactions: ElectrumxTransaction[]): Promise<Transaction[]> {
    if (!transactions || !transactions.length) return [];

    const completedTransactions = [];
    while (transactions.length > 0) {
      const txMeta = transactions.shift();
      const storedTransaction = await Transaction.Find(txMeta.tx_hash, address.id);

      if (storedTransaction && storedTransaction.type !== Transaction.TRANSACTION_PENDING) {
        this.log(`Already saved tx [${storedTransaction.txid}] and not pending (${storedTransaction.type})`);
        // completedTransactions.push(storedTransaction);
        continue;
      }

      try {
        const res: HttpResponse = await request({
          url: `${wallet.coin.explorer_api_host}/tx/${txMeta.tx_hash}`,
          method: "GET",
        });

        if (res.statusCode !== 200) throw new Error(`API Threw error – ${res.statusCode}`);

        const txDetails: InspectAPIFetchTransaction = res.content.toJSON();
        if (txDetails.status !== 'ok') throw new Error('TX not found');

        const received  = txDetails.tx.vout.find(vout => vout.addresses === txMeta.address);
        const sent      = txDetails.tx.vin.find(vin => vin.addresses === txMeta.address);

        if (sent && received) {
          console.log(txDetails);

          console.log(`SELFIE
          received: ${sent.amount}
                    ${Math.max(0, sent.amount)}

          sent:     ${received.amount}
                    ${Math.max(0, received.amount)}

          diff:     ${sent.amount - received.amount}
                    ${(sent.amount - received.amount).toFixed(8)}
          `);
        }

        const transaction = await Transaction.Create({
          wallet_id:  wallet.id,
          address_id: address.id,
          type: (sent && received)
                  ? Transaction.TRANSACTION_SELF
                  : (sent)
                      ? Transaction.TRANSACTION_SENT 
                      : (received)
                          ? Transaction.TRANSACTION_RECEIVED
                          : Transaction.TRANSACTION_UNKNOWN,
          txid: txMeta.tx_hash,
          height: txMeta.height,
          vin_addresses: txDetails.tx.vin.length ? txDetails.tx.vin : '',
          vout_addresses: txDetails.tx.vout.length ? txDetails.tx.vout : '',
          // in the case that this transaction had both a VIN and VOUT with a matching address,
          // calculate the "net" value (received - sent)
          value: (sent && received)
                  ? Number((Math.max(0, sent.amount) - Math.max(0, received.amount)).toFixed(8))
                  : (sent)
                      ? Number(sent.amount.toFixed(8))
                      : (received)
                          ? Number(received.amount.toFixed(8))
                          : 0,
          timestamp: txDetails.tx.timestamp
        });

        completedTransactions.push(transaction);
      } catch (err) {
        this.log(`Unable to fetch transaction [${txMeta.tx_hash}]... Storing as Pending`);
        console.log(err.message ? err.message : err);

        const transaction = await Transaction.Create({
          wallet_id:  wallet.id,
          address_id: address.id,
          type:       Transaction.TRANSACTION_PENDING,
          txid:       txMeta.tx_hash,
          height:     txMeta.height,
          value:      0,
          timestamp:  0
        });

        completedTransactions.push(transaction);
      }
    }

    return completedTransactions;
  }

  public async establishConnection(wallet: Wallet|any): Promise<any> {
    this.log(`connect to ${wallet.coin.electrumx_host}:${wallet.coin.electrumx_port}`);

    // this.walletData.busy    = true;
    // this.walletData.loaded  = false;
    // this.walletData.enabled = false;

    this.electrumxConnected = false;
    this.trackedBlockheight.next(0);
    this.blockStream.next(0);
    this.emit('EstablishConnection')
    
    try {
      this.electrumxClient = new ElectrumxClient(wallet.coin.electrumx_host, Number(wallet.coin.electrumx_port));

      await this.createSubscriptions();
      this.log('Electrumx listeners setup');
      this.emit('ElectrumxListening');

      this._electrumxTimer = setTimeout(this.validateSession, 1000 * 15);

      await this.electrumxClient.connect();
      await this.electrumxClient.blockchainHeaders_subscribe();

      this.log('Electrumx subscribed to headers');
      this.emit('ElectrumxBlockchainHeaderSubscribed');
      
      const electrumxVersion = await this.electrumxClient.server_version(UserAgent, '1.4');

      clearTimeout(this._electrumxTimer);
      this.log('Electrumx connected!');
      this.emit('ElectrumxConnected');
      
      this.serverVersion = Array.isArray(electrumxVersion) ? electrumxVersion[0] : 'Unknown Version';

      this.log(`Electrumx handshake successful – Remote Server Version: ${this.serverVersion}`);
      this.emit('ElectrumxAccepted');

      this.electrumxConnected = true;
      return true;
    } catch (err) {
      this.log('Unable to connect with Electrumx');
      console.log(err);

      this.electrumxConnected = false;
      if (err && err.message.includes('unsupported client')) {
        this.emit('ElectrumxError_UnsupportedClient');
        // this.walletData.warningText = 'Wallet outdated! Please update your application to continue!';
        alert('You are currently using an unsupported version of this wallet. Please update ODIN.Chat as soon as possible to continue.')
      } else {
        this.emit('ElectrumxError');
        // this.walletData.warningText = 'Unable to establish a secure connection with an available wallet relay node. Please try again later.';
        // console.log(err);
      }
      // this.walletData.busy = false;
      return false;
    }
  }

  /**
   * Validates the current ElectrumX session after 10 seconds to ensure the user
   * is not left hanging.
   * 
   * @param thisRef Reference to the WalletModule instance
   */
  private async validateSession(): Promise<any> {
    this.log('Validate Electrumx Session');
    clearTimeout(this._electrumxTimer);

    if (!this.electrumxConnected) {
      this.emit('ElectrumxConnectionTimeout');
      this.emit('ElectrumxConnectionInvalid');
      return false;
      // thisRef.walletData.loaded       = true;
      // thisRef.walletData.warning      = true;
      // thisRef.walletData.warningText  = 'Unable to establish a connection to a Wallet Relay Node. Please try again later';
    } else {
      this.emit('ElectrumxConnectionValid');
      return true;
    }
  }

  /**
   * Create handlers for certain ElectrumX event streams
   */
  private async createSubscriptions() {
    let self = this;

    await this.electrumxClient.subscribe.on('data', this.onHandleData);
    await this.electrumxClient.subscribe.on('finished', this.onHandleFinished);
    await this.electrumxClient.subscribe.on('blockchain.headers.subscribe', this.onHandleBlockchainHeaders);
    await this.electrumxClient.subscribe.on('error', this.onHandleError);
    return true;
    // this._electrumxClient.subscribe.on('blockchain.scripthash.subscribe', (...args) => {
    //   console.log('GOT BLOCK', args);
    // });
  }

  private onHandleData(rawData: any) {
    let data = null;

    try {
      this.log('[Electrumx onHandleData]');
      data = JSON.parse(rawData);
      console.dir(data);
    } catch (err) {
      console.log('[Wallet] onElectrumxData... RAW', rawData);
    }

    if (!data ||
        !data.hasOwnProperty('result') ||
        (data.result === null)) {
      return true;
    }

    if (data.result.hasOwnProperty('height') && data.result.hasOwnProperty('hex')) {
      this.log(`New blockheight discoverd: ${data.result.height}`);
      this.emit('NewBlockFound');
      this.trackedBlockheight.next(data.result.height);
      this.blockStream.next(data.result.height);

      if (this.activeWallet) {
        this.activeWallet.blockheight = data.result.height;
      }
    }
  }

  private onHandleFinished(tcpActionId: number) { }

  private onHandleBlockchainHeaders(headers: any) {
    if (!Array.isArray(headers)) {
      this.log('Unable to process headers...');
      console.log(headers);
      return;
    }

    const header = headers.shift();
    if (header && header.hasOwnProperty('height')) {
      this.log(`New blockheight discoverd: ${header.height}`);
      this.emit('NewBlockFound');
      this.trackedBlockheight.next(header.height);
      this.blockStream.next(header.height);
      
      if (this.activeWallet) {
        this.activeWallet.blockheight = header.height;
      }
    }
  }

  /**
   * Subscribe to any errors streamed from this plugin.
   * There are two primary error types to watch out for:
   *
   * err.name === "UnexpectedResponseError"
   * This error comes from an unexpected response from ElectrumX as
   * ElectrumX should always return a JSON.parse-able string response.
   *
   * err.name === "TCPClientError"
   * This error comes from the base class TcpClient when a connection
   * fails.
   */
  private onHandleError(err: any) {
    console.log('ON ERROR', {
      name: err.name ? err.name : '??',
      msg: err.message ? err.message : '??'
    }, err);

    if (err.name === 'TCPClientError') {
      this.electrumxConnected = false;
      this.emit('TCPClientError');
      
      clearTimeout(this._electrumxTimer);
      this.validateSession();
    }
  }
}
