import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { StorageService } from './index';
import { RouterExtensions } from "nativescript-angular/router";

import { alert } from "ui/dialogs";

import { LibsignalProtocol } from 'nativescript-libsignal-protocol';
import { WalletClientService } from "./wallet-client.service";
import { ElectrumxClient } from 'nativescript-electrumx-client';
import { setTimeout, clearTimeout } from "tns-core-modules/timer";
import { ODIN } from '~/app/bundle.odin';
import { Buffer } from 'buffer';

const WalletKey = 'app_wallets';
const UserAgent = 'ODINX 0.2.6';

  /**
   * Account Discovery
   * 1 get first account node
   * 2 loop through external chain
   * 3 loop through address index
   * 4 repeat #2 and increment external chain + address index until 20 unused addresses discovered
   */

  
  /**
    * Wallet
    *   accountIndex: 0,1,2...,
    *   balance: {
    *     confirmed: 0000.0000,
    *     unconfirmed: 0000.0000
    *   },
    *   lastTransaction: 0000,
    *   transactions: [
    *     {
    *       blockHeight: 0000,
    *       toAddress: 'xyz',
    *       fromAddress: 'xyz',
    *       type: incoming|outgoing|pending,
    *       amount: 0000.0000,
    *       timestamp: 0000,
    *       txHash: 'xyz'
    *     },
    *     ...
    *   ],
    *   unspent: [
    *     {
    *       blockHeight: 0000,
    *       toAddress: 'xyz',
    *       fromAddress: 'xyz',
    *       type: incoming|outgoing|pending,
    *       amount: 0000.0000,
    *       timestamp: 0000
    *     },
    *     ...
    *   ],
    *   external: [
    *     {
    *       addressIndex: 0,1,2...
    *       address: 'xyz',
    *       balance: {
    *         confirmed: 0000.0000,
    *         unconfirmed: 0000.0000
    *       },
    *     },
    *     ...
    *   ],
    *   internal: [
    *     {
    *       addressIndex: 0,1,2...
    *       address: 'xyz',
    *       balance: {
    *         confirmed: 0000.0000,
    *         unconfirmed: 0000.0000
    *       }
    *     },
    *     ...
    *   ]
    */

/**
 * default chain is ODIN
 * 
 * 
 */

export interface IBalance {
  confirmed: number;
  unconfirmed: number;
}

export interface ITransactionReceived {
  addresses: string;
  amount: number;
  hex: string[];
}

export interface ITransactionSent {
  addresses: string;
  amount: number;
}

export interface ITransaction {
  tx_hash: string;
  height: string;
  address: string;
  blockheight: number;
  timestamp: number;
  value: number;
  received?: ITransactionReceived;
  sent?: ITransactionSent;
}

export interface IUnspent {

}

export interface IExternalAddress {

}

export interface IElectrumxTransaction {
  tx_hash: string;
  height: string;
  address?: string;
}



export interface IElectrumxUnspent {
  tx_hash: string;
  tx_pos: string;
  height: string;
  value: number;
  address?: string;
}

export interface IElectrumxAddress {
  index: number;
  address: string;
  balance: number;
  transactions: IElectrumxTransaction[];
  unspent: IElectrumxUnspent[];
}

export interface IAddress {
  addressIndex: number;
  address: string;
  balance: IBalance;
  transactions: string[];
}

export interface IAddressDiscovery {
  addresses: IAddress[];
  transactions: IElectrumxTransaction[];
  unspent: IElectrumxUnspent[];
}

export interface IInternalAddress {

}

export interface ICoin {
  name: string;
  coin: string;
  electrumx_host: string;
  electrumx_port: number;
  explorer_url: string;
  icon: string;
}



export interface IWallet {
  accountIndex: number;
  coin?: ICoin;
  balance: IBalance;
  lastTransaction: number;
  transactions: ITransaction[];
  unspent: IUnspent[];
  external: IExternalAddress[];
  internal: IInternalAddress[];
}


@Injectable()
export class WalletModel extends Observable {
  private _electrumxClient: ElectrumxClient;
  private _validateSessionTimer: any;
  public walletData: any;
  public wallets: any[];
  public chainStats: any;
  private defaultWalletDetails: any;

  constructor(
    private _router: RouterExtensions,
    private _walletClient: WalletClientService,
    private _store: StorageService
  ) {
    super();

    this.defaultWalletDetails = {
      name: 'ODIN',
      coin: 'ODIN',
      electrumx_host: 'electrumx.odinblockchain.org',
      electrumx_port: 50001,
      explorer_url: 'https://inspect.odinblockchain.org/api',
      icon: 'res://coin_odin'
    };
    
    this.walletData = {
      loaded: false,
      enabled: false,
      serverVersion: '',
      warning: false,
      warningText: '',
      notice: false,
      noticeText: ''
    };

    this.wallets = [];
    this.initialize();
  }

  public async initialize() {
    console.log(`[WalletModel]... INITIALIZE`);

    // await this._store.setString(WalletKey, 'fefe');
    
    this._walletClient.fetchBlockchainStats()
    .then((statsResponse) => {
      console.log('get stats', statsResponse);
      this.chainStats = statsResponse.stats
    })
    .catch((err) => {
      console.log('Chain Stats Error');
      console.log(err);
    });

    if (this._store.hasKey(WalletKey)) {
      console.log(`[WalletModel]... Restore Wallet`);
      
      try {
        await this.restoreSavedWallets();
        console.log('...done restoring');

        let self = this;
        setTimeout(() => {
          console.log('total wallets?', this.wallets.length);

          this.notify({
            eventName: "WalletReady",
            object: this
          });

          this.walletData.loaded      = true;
          this.walletData.notice      = false;
          this.walletData.noticeText  = '';
        }, 3000);
      } catch (err) {
        console.log('ERROR restoring wallet');
        console.log(err.message ? err.message : err);

        await this.createDefaultWallet(this.defaultWalletDetails);

        console.log('...done creating');
        this.walletData.loaded = true;
        
        this.notify({
          eventName: "WalletReady",
          object: this
        });
      }
      
    } else {
      await this.createDefaultWallet(this.defaultWalletDetails);

      console.log('...done creating');
      this.walletData.loaded = true;
      
      this.notify({
        eventName: "WalletReady",
        object: this
      });
    }

    // this.restoreWallet(coin, this)
    // .then(complete => {
      
    // })
    // .catch(err => {
    //   console.log('[Wallet] ValidateSession Error', (err.message) ? err.message : err);

    //   this.walletData.loaded       = true;
    //   this.walletData.notice       = false;
    //   this.walletData.noticeText   = '';
    //   this.walletData.warning      = true;
    //   this.walletData.warningText  = `Error loading wallet... [${(err.message) ? err.message : err}]`;

    //   alert('We were unable to load your wallet at this time. Please try again later.');

    //   this.notify({
    //     eventName: "LoadWalletError",
    //     object: this
    //   });
    // });

    // this.walletData.loaded      = false;
    // this.walletData.notice      = true;
    // this.walletData.noticeText  = 'Synchronizing wallet. Please wait.';
  }

  public async restoreSavedWallets() {
    this.walletData.loaded      = false;
    this.walletData.notice      = true;
    this.walletData.noticeText  = 'Synchronizing wallet. Please wait.';

    try {
      let wallets = JSON.parse(this._store.getString(WalletKey));
      console.log('got wallets!', wallets.length);

      while (wallets.length > 0) {
        const wallet = wallets.shift();
        console.log('--- --- --- ---');
        console.log('GOT Account');

        console.log('index', wallet.accountIndex);
        console.log('coin', wallet.coin);
        console.log('balance', wallet.balance);
        console.log('transactions', wallet.transactions.slice(0, 2));
        console.log('unspent', wallet.unspent.slice(0, 2));
        console.log('external', wallet.external.slice(0, 3));
        console.log('internal', wallet.internal.slice(0, 3));

        console.log('TOTAL external accounts', wallet.external.length);
        console.log('TOTAL internal accounts', wallet.internal.length);

        this.wallets.push(wallet);
      }

      return true;
    } catch (err) {
      console.log('Restore error');
      console.log(err);

      alert('Stored wallet details seem to be corrupted or missing. Will attempt to restore wallet information.');
      throw new Error('Wallet data corrupted');
    }
  }

  public async createDefaultWallet(coin: any) {
    if (await this.establishConnection(coin)) {
      console.log('[Wallet] RESTORE COMPLETE?');

      this.walletData.loaded      = false;
      this.walletData.notice      = true;
      this.walletData.noticeText  = 'Fresh wallet detected, entering wallet discovery mode. Please wait while we create your wallet.';

      let walletAccount = await this.createWallet(coin, this);
      if (walletAccount) {
        console.log('--- --- --- ---');
        console.log('GOT Account');

        console.log('index', walletAccount.accountIndex);
        console.log('coin', walletAccount.coin);
        console.log('balance', walletAccount.balance);
        console.log('transactions', walletAccount.transactions.slice(0, 2));
        console.log('unspent', walletAccount.unspent.slice(0, 2));
        console.log('external', walletAccount.external.slice(0, 3));
        console.log('internal', walletAccount.internal.slice(0, 3));

        console.log('TOTAL external accounts', walletAccount.external.length);
        console.log('TOTAL internal accounts', walletAccount.internal.length);

        this.walletData.notice     = false;
        this.walletData.noticeText = '';
        this.wallets.push(walletAccount);

        await this._store.setString(WalletKey, JSON.stringify(this.wallets));
        console.log('SAVED');
      }

      
    } else {
      console.log('nope');
    }
  }

  public async establishConnection(coin: any): Promise<any> {
    console.log(`connect to ${coin.electrumx_host}:${coin.electrumx_port}`);
    
    try {
      this._electrumxClient = new ElectrumxClient(coin.electrumx_host, coin.electrumx_port);
      this.createSubscriptions();
      this._validateSessionTimer = setTimeout(this.validateSession, 1000 * 10, this);

      await this._electrumxClient.connect();
      console.log('...connected');
    } catch (err) {
      console.log('CONNECTION ERROR');
      console.log(err);

      this.walletData.loaded      = true;
      this.walletData.warning     = true;
      this.walletData.warningText = 'CONNECTION FAILURE';

      return false;
    }

    try {
      console.log('check version');

      let electrumxVersion          = await this._electrumxClient.server_version(UserAgent, '1.4');
      this.walletData.loaded        = true;
      this.walletData.enabled       = true;
      this.walletData.serverVersion = Array.isArray(electrumxVersion) ? electrumxVersion[0] : 'Unknown Version';
      
      console.log('got version', electrumxVersion);
      clearTimeout(this._validateSessionTimer);

      return true;
    } catch (err) {
      this.walletData.loaded  = true;
      this.walletData.warning = true;

      if (err && err.message.includes('unsupported client')) {
        this.walletData.warningText = 'Wallet outdated! Please update your application to continue!';

        alert('You are currently using an unsupported version of this wallet. Please update your ODIN Messenger as soon as possible to continue.')
      } else {
        this.walletData.warningText = 'Unable to establish a secure connection with an available wallet relay node. Please try again later.';

        console.log('Connection error');
        console.log(err);
      }

      return false;
    }
  }

  /**
   * Validates the current ElectrumX session after 10 seconds to ensure the user
   * is not left hanging.
   * 
   * @param thisRef Reference to the WalletModule instance
   */
  public async validateSession(thisRef: any): Promise<any> {
    console.log('VALIDATE');

    if (!thisRef.walletData.loaded) {
      thisRef.walletData.loaded       = true;
      thisRef.walletData.warning      = true;
      thisRef.walletData.warningText  = 'Unable to establish a connection to a Wallet Relay Node. Please try again later';
    }
  }

  // private async restoreWallet(coin: any, thisRef: any): Promise<any> {
  //   thisRef.walletData.loaded = false;

  //   return new Promise(async (resolve, reject) => {
  //     if (thisRef._store.hasKey(WalletKey)) {
  //       thisRef.walletData.notice      = true;
  //       thisRef.walletData.noticeText  = 'Synchronizing wallet. Please wait.';

  //       thisRef.loadWallet()
  //       .then(resolve)
  //       .catch(reject);
  //     } else {
  //       thisRef.walletData.notice      = true;
  //       thisRef.walletData.noticeText  = 'Fresh wallet detected, entering wallet discovery mode. Please wait while we create your wallet.';
        
  //       thisRef.xcreateDefaultWallet()
  //       .then(resolve)
  //       .catch(reject);
  //     }
  //   });
  // }

  private async loadWallet(): Promise<any> {
    console.log(`[Wallet] LOAD WALLET`);

    let savedWallet   = JSON.parse(this._store.getString(WalletKey));
    let storedWallets = savedWallet;

    if (!Array.isArray(storedWallets)) throw new Error('Stored wallet is corrupted.');

    console.log('DEFAULT WALLETS');
    console.dir(storedWallets);
    // return storedWallets;
    return true;
  }

  /**
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account "wallet" to discover.
   * @param addressIndex The current address to fetch details for.
   * @param isExternal Determines if the details should be for the external or internal (change) address.
   */
  private async fetchAddressDetails(seed: any, accountIndex: number, addressIndex: number, isExternal: boolean): Promise<any> {
    let change = (isExternal) ? 0 : 1;

    const AddressPath   = seed.derivePath(`m/44'/2100'/${accountIndex}'/${change}/${addressIndex}`);
    const Address       = ODIN.payments.p2pkh({ pubkey: AddressPath.publicKey });

    const script        = ODIN.address.toOutputScript(Address.address);
    const hash          = ODIN.crypto.sha256(script);
    const reversedHash  = new Buffer(hash.reverse()).toString('hex');
      
    let balance   = await this._electrumxClient.blockchainScripthash_getBalance(reversedHash);
    let txHistory = await this._electrumxClient.blockchainScripthash_getHistory(reversedHash);
    let unspent   = await this._electrumxClient.blockchainScripthash_listunspent(reversedHash);

    return {
      index:          addressIndex,
      address:        Address.address,
      balance:        balance,
      transactions:   txHistory.map(tx => { tx['address'] = Address.address; return tx; }),
      unspent:        unspent.map(tx => { tx['address'] = Address.address; return tx; }),
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
  private async externalAddressDiscovery(seed: any, accountIndex: number): Promise<IAddressDiscovery> {
    let addressIndex: number                  = 0;
    let addressGapCounter: number             = 19;
    let externalAddresses: IAddress[]         = [];
    let transactions: IElectrumxTransaction[] = [];
    let unspent: IElectrumxUnspent[]          = [];

    while (addressGapCounter >= 0) {
      let addressPull = await this.fetchAddressDetails(seed, accountIndex, addressIndex, true);

      let externalAddress: IAddress = {
        addressIndex: addressIndex,
        address: addressPull.address,
        balance: {
          confirmed: addressPull.balance.confirmed,
          unconfirmed: addressPull.balance.unconfirmed
        },
        transactions: addressPull.transactions.map((tx: any) => tx.tx_hash)
      };

      externalAddresses.push(externalAddress);
      transactions = transactions.concat(addressPull.transactions);
      unspent = unspent.concat(addressPull.unspent);

      addressIndex++;

      // only decrement if current externalAccount has transactions (unused)
      if (addressPull.transactions.length === 0) addressGapCounter--;
    }

    return {
      addresses: externalAddresses,
      transactions: transactions,
      unspent: unspent
    };
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
  private async internalAddressDiscovery(seed: any, accountIndex: number, activeExternalAddresses: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      let internalAddresses: IAddress[]           = [];
      let transactions: IElectrumxTransaction[]   = [];
      let unspent: IElectrumxUnspent[]            = [];

      let addressPulls$ = activeExternalAddresses.map(account => this.fetchAddressDetails(seed, accountIndex, account.addressIndex, false));

      Promise.all(addressPulls$)
      .then((accounts) => {
        accounts.forEach(account => {
          let internalAddress: IAddress = {
            addressIndex: account.addressIndex,
            address: account.address,
            balance: {
              confirmed: account.balance.confirmed,
              unconfirmed: account.balance.unconfirmed
            },
            transactions: transactions.map(tx => tx.tx_hash)
          };
  
          internalAddresses.push(internalAddress);
          transactions = transactions.concat(account.transactions);
          unspent = unspent.concat(account.unspent);
        });

        resolve({
          addresses: internalAddresses,
          transactions: transactions,
          unspent: unspent
        });
      })
      .catch(reject);
    });
  }

  /**
   * Runs through an given set of Transactions and discovers metadata for each. Returns the
   * original array with additional details.
   * 
   * @param transactions Transactions to discover
   */
  private async transactionDiscovery(transactions: IElectrumxTransaction[]): Promise<any> {
    return new Promise(async (resolve, reject) => {

      for (const tx of transactions) {
        try {
          const txData    = await this._walletClient.fetchTransaction(tx.tx_hash);
          const sent      = txData.tx.vin.find((vin: any) => vin.addresses === tx.address);
          const received  = txData.tx.vout.find((vout: any) => vout.addresses === tx.address);

          tx['blockheight'] = txData.tx.blockheight;
          tx['timestamp']   = txData.tx.timestamp;
          tx['received']    = (received ? received : false);
          tx['sent']        = (sent ? sent : false);
          tx['value']       = (received ? received.amount : sent.amount);
        } catch (err) {
          console.log(`[Wallet] Unable to handle transaction ${tx.tx_hash}`);
        }
      }

      return resolve(transactions);
    });
  }

  /**
   * Used in `Array.reduce`, returns the total sum of all `confirmed` balances
   * through the associated array of Addresses.
   * 
   * @param sum The accumulator that is passed through the reduction
   * @param address The blockchain Address
   */
  private sumAddressConfirmedBalance(sum: number, address: IAddress): number {
    return sum = sum + address.balance.confirmed;
  }

  /**
   * Used in `Array.reduce`, returns the total sum of all `unconfirmed` balances
   * through the associated array of Addresses.
   * 
   * @param sum The accumulator that is passed through the reduction
   * @param address The blockchain Address
   */
  private sumAddressUnconfirmedBalance(sum: number, address: IAddress): number {
    return sum = sum + address.balance.unconfirmed;
  }
  
  /**
   * Filters a given array of Addresses and returns only Addresses that
   * have had previous transaction history.
   * 
   * @param address A ElectrumX Address
   * @param index The index of the filter
   * @param addressArray The array being filtered
   */
  private activeAddresses(address: IAddress, index: number, addressArray: IAddress[]): boolean {
    if (!address.transactions || address.transactions.length === 0) return false;
    return true;
  }

  /**
   * Discovers external and internal addresses associated to an `accountIndex`. Returns a full account
   * summary.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account "wallet" to discover.
   */
  private async accountDiscovery(seed: any, accountIndex: number): Promise<IWallet> {
    let account = {
      accountIndex: accountIndex,
      balance: {
        confirmed: 0,
        unconfirmed: 0
      },
      lastTransaction: -1,
      transactions: [],
      unspent: [],
      external: [],
      internal: []
    };

    let pulledExternal = await this.externalAddressDiscovery(seed, accountIndex);
    let sumExternalConfirmed = pulledExternal.addresses.reduce(this.sumAddressConfirmedBalance, 0);
    let sumExternalUnconfirmed = pulledExternal.addresses.reduce(this.sumAddressUnconfirmedBalance, 0);

    let pulledInternal = await this.internalAddressDiscovery(seed, accountIndex, pulledExternal.addresses.filter(this.activeAddresses));
    let sumInternalConfirmed = pulledInternal.addresses.reduce(this.sumAddressConfirmedBalance, 0);
    let sumInternalUnconfirmed = pulledInternal.addresses.reduce(this.sumAddressUnconfirmedBalance, 0);
    
    account.balance.confirmed   = sumExternalConfirmed + sumInternalConfirmed;
    account.balance.unconfirmed = sumExternalUnconfirmed + sumInternalUnconfirmed;

    account.external = pulledExternal.addresses;
    account.internal = pulledInternal.addresses;

    account.transactions  = account.transactions.concat(pulledExternal.transactions, pulledInternal.transactions);
    account.unspent       = account.unspent.concat(pulledExternal.unspent, pulledInternal.unspent);

    await this.transactionDiscovery(account.transactions);
    return account;
  }

  private async createWallet(coin: ICoin, self: any): Promise<any> {
    let saveData  = JSON.parse(this._store.getString('saveData'));

    if (coin.name === 'ODIN') {
      let seed      = ODIN.bip39.mnemonicToSeed(saveData.mnemonicPhrase);
      let sroot     = ODIN.bip32.fromSeed(seed);
      let account   = await this.accountDiscovery(sroot, 0);
      account.coin  = coin;
      return account;
    } else {
      throw new Error(`Unable to handle wallet creation for coin ${coin.name}`);
    }
  }

  /**
   * Create handlers for certain ElectrumX event streams
   */
  private createSubscriptions() {
    // this._electrumxClient.subscribe.on('data', (rawData: string) => {
    //   console.log('ON DATA', rawData);
    // });

    this._electrumxClient.subscribe.on('finished', (tcpActionId: number) => {
      console.log('ON FINISHED', tcpActionId);
    });

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
    this._electrumxClient.subscribe.on('error', async (err) => {
      console.log('ON ERROR', {
        name: err.name ? err.name : '??',
        msg: err.message ? err.message : '??'
      }, err);

      if (err.name === 'TCPClientError!') {
        this.walletData.loaded      = true;
        this.walletData.warning     = true;
        this.walletData.warningText = 'Failed to establish a connection to a Wallet Relay Node. Please try again later';
      }
    });
    
    // this._electrumxClient.subscribe.on('blockchain.scripthash.subscribe', (...args) => {
    //   console.log('GOT BLOCK', args);
    // });
  }
}
