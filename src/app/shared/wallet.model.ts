import { Injectable } from '@angular/core';
import { Buffer } from 'buffer';
import { RouterExtensions } from 'nativescript-angular/router';
import { ElectrumxClient } from 'nativescript-electrumx-client';
import { Observable } from 'tns-core-modules/data/observable';
import { clearTimeout, setTimeout } from 'tns-core-modules/timer';
import { alert } from 'tns-core-modules/ui/dialogs';
import { ODIN } from '~/app/bundle.odin';
import { StorageService } from './index';
import { WalletClientService } from './wallet-client.service';



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
  hash: string;
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
      symbol: 'Ø',
      electrumx_host: 'electrumx.odinblockchain.org',
      electrumx_port: 50001,
      explorer_url: 'https://inspect.odinblockchain.org/api',
      chain_stats_url: 'https://inspect.odinblockchain.org/api/stats',
      icon: 'res://coin_odin'
    };
    
    this.walletData = {
      busy: false,
      loaded: false,
      enabled: false,
      subscribed: false,
      serverVersion: '',
      warning: false,
      warningText: '',
      notice: false,
      noticeText: ''
    };

    this.chainStats = {
      blockheight: 0
    };

    this.wallets = [];

    this.onHandleData = this.onHandleData.bind(this);
    this.onHandleFinished = this.onHandleFinished.bind(this);
    this.onHandleBlockchainHeaders = this.onHandleBlockchainHeaders.bind(this);
    this.onHandleError = this.onHandleError.bind(this);
    this.establishConnection = this.establishConnection.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.keepAlive = this.keepAlive.bind(this);
    
    this.initialize();
  }

  public async initialize() {
    console.log(`[WalletModel]... INITIALIZE`);

    // await this._store.setString(WalletKey, 'fefe');
    
    // this._walletClient.fetchBlockchainStats()
    // .then((statsResponse) => {
    //   console.log('get stats', statsResponse);
    //   this.chainStats = statsResponse.stats
    // })
    // .catch((err) => {
    //   console.log('Chain Stats Error');
    //   console.log(err);
    // });

    if (this._store.hasKey(WalletKey)) {
      console.log(`[WalletModel]... Restore Wallet`);
      
      try {
        await this.restoreSavedWallets();
        console.log('...done restoring', Date.now());

        let self = this;
        setTimeout(() => {
          console.log('...emit WalletReady', Date.now());

          self.notify({
            eventName: 'WalletReady',
            object: this
          });

          self.walletData.loaded      = true;
          self.walletData.notice      = false;
          self.walletData.noticeText  = '';
        }, 3000);
        
      } catch (err) {
        console.log('ERROR restoring wallet');
        console.log(err.message ? err.message : err);

        await this.createDefaultWallet(this.defaultWalletDetails);

        console.log('...done creating');
        
        let self = this;
        setTimeout(() => {
          console.log('...emit WalletReady', Date.now());

          self.notify({
            eventName: 'WalletReady',
            object: this
          });

          self.walletData.loaded      = true;
          self.walletData.notice      = false;
          self.walletData.noticeText  = '';
        }, 3000);
      }
      
    } else {
      await this.createDefaultWallet(this.defaultWalletDetails);

      console.log('...done creating');
      
      let self = this;
      setTimeout(() => {
        console.log('...emit WalletReady', Date.now());

        self.notify({
          eventName: 'WalletReady',
          object: this
        });

        self.walletData.loaded      = true;
        self.walletData.notice      = false;
        self.walletData.noticeText  = '';
      }, 3000);
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
    //     eventName: 'LoadWalletError',
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
        console.log('--- --- [Load Wallet]--- ---');
        console.log(`
          INDEX[${wallet.accountIndex}]
          BAL[${JSON.stringify(wallet.balance)}]
          TXS[${wallet.transactions.length}]
          INT[${wallet.internal.length}]
          EXT[${wallet.external.length}]
          UNSPENT[${wallet.unspent.length}]
        \n`);

        this.wallets.push(wallet);
      }

      if (this.wallets[0].coin) {
        console.log('ATTEMPTING TO CONNECT...');

        if (await this.establishConnection(this.wallets[0].coin)) {
          // await this.refreshWalletDetails();
        } else {
          console.log('CANNOT ESTABLISH CONNECTION');
        }
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

      this.walletData.loaded      = false;
      this.walletData.notice      = true;
      this.walletData.noticeText  = 'Fresh wallet detected, entering wallet discovery mode. Please wait while we create your wallet.';

      let walletAccount = await this.createWallet(coin, this);
      if (walletAccount) {
        console.log('--- --- [Create Wallet]--- ---');
        console.log(`
          INDEX[${walletAccount.accountIndex}]
          BAL[${JSON.stringify(walletAccount.balance)}]
          TXS[${walletAccount.transactions.length}]
          INT[${walletAccount.internal.length}]
          EXT[${walletAccount.external.length}]
          UNSPENT[${walletAccount.unspent.length}]
        \n`);

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

  public reconnect(coin: any): Promise<any> {
    this.walletData.notice      = true;
    this.walletData.noticeText  = 'Synchronizing wallet. Please wait.';

    return new Promise((resolve, reject) => {
      this.establishConnection(coin)
      .then(() => {
        this.walletData.loaded      = true;
        this.walletData.notice      = false;
        this.walletData.noticeText  = '';

        this.notify({
          eventName: 'WalletReady',
          object: this
        });

        return resolve(true);
      })
      .catch((err) => {
        console.log('RE-CONNECT ERROR');
        console.log(err);
  
        this.walletData.loaded      = true;
        this.walletData.warning     = true;
        this.walletData.warningText = 'Error Reconnecting.';
        return resolve(false);
      });
    });
  }

  public keepAlive(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.walletData.enabled && !this.walletData.busy) {

        this.walletData.loaded  = false;
        this.walletData.busy    = true;

        console.log(`[Wallet] keepAlive... Connection enabled...`);
  
        this._validateSessionTimer = setTimeout(this.validateSession, 1000 * 10, this);
        this._electrumxClient.server_ping()
        .then(() => {
          this.walletData.loaded        = true;
          this.walletData.enabled       = true;
          this.walletData.busy          = false;

          clearTimeout(this._validateSessionTimer);
          return resolve(true);
        })
        .catch((err) => {
          console.log(`[Wallet] keepAlive BAD`);
          console.log(err);
          return resolve(false);
        });
      } else {
        resolve(false);
      }
    }); 
  }

  private async refreshWallet(wallet): Promise<any> {
    return new Promise(async (resolve, reject) => {
      console.log('refresh Wallet');
      console.log(`
        INDEX[${wallet.accountIndex}]
        BAL[${JSON.stringify(wallet.balance)}]
        TXS[${wallet.transactions.length}]
        INT[${wallet.internal.length}]
        EXT[${wallet.external.length}]
        UNSPENT[${wallet.unspent.length}]
      \n`);

      console.log('---> INTERNAL ACCOUNTS\n' + JSON.stringify(wallet.internal.slice(0, 2), null, 2));
      console.log('---> EXTERNAL ACCOUNTS\n' + JSON.stringify(wallet.external.slice(0, 2), null, 2));

      let saveData  = JSON.parse(this._store.getString('saveData'));
      if (wallet.coin.name === 'ODIN') {
        console.log('...refreshing ODIN');
        let seed      = ODIN.bip39.mnemonicToSeed(saveData.mnemonicPhrase);
        let sroot     = ODIN.bip32.fromSeed(seed);
        let account   = await this.accountDiscovery(sroot, 0);
        account.coin  = wallet.coin;
        
        console.log(`
          DONE....

          INDEX[${account.accountIndex}]
          BAL[${JSON.stringify(account.balance)}]
          TXS[${account.transactions.length}]
          INT[${account.internal.length}]
          EXT[${account.external.length}]
          UNSPENT[${account.unspent.length}]
        \n`);
        resolve(account);
      } else {
        reject(new Error(`Unable to handle wallet refresh for wallet.coin ${JSON.stringify(wallet.coin)}`));
      }
      
      // let account = {
      //   accountIndex: accountIndex,
      //   balance: {
      //     confirmed: 0,
      //     unconfirmed: 0
      //   },
      //   lastTransaction: -1,
      //   transactions: [],
      //   unspent: [],
      //   external: [],
      //   internal: []
      // };
  
      // let refreshedExternalAddresses = wallet.external.map(address => this.updateAddress(address));
      // Promise.all(refreshedExternalAddresses)
      // .then((externalAddresses) => {
      //   let refreshedInternalAddresses = wallet.internal.map(address => this.updateAddress(address));
      //   Promise.all(refreshedInternalAddresses)
      //   .then((internalAddresses) => {

      //     let sumExternalConfirmed = externalAddresses.reduce(this.sumAddressConfirmedBalance, 0);
      //     let sumExternalUnconfirmed = externalAddresses.reduce(this.sumAddressUnconfirmedBalance, 0);

      //   }).catch(reject);
      //   console.log(`[Wallet] Refreshed Wallet#${wallet.accountIndex}`, externalAddresses);

      //   wallet.external = externalAddresses;

      //   resolve(true);
      // }).catch(reject);


      // let refreshedExternalAddresses = wallet.external.map(address => this.updateAddress(address));
      // Promise.all(refreshedExternalAddresses)
      // .then((externalAddresses) => {
      //   console.log(`[Wallet] Refreshed Wallet#${wallet.accountIndex}`, externalAddresses);

      //   wallet.external = externalAddresses;

      //   resolve(true);
      // }).catch(reject);
    });
  }

  public refreshWalletDetails(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.walletData.enabled && !this.walletData.busy) {

        this.walletData.loaded  = false;
        this.walletData.busy    = true;

        console.log(`[Wallet] refreshWalletDetails... Connection enabled...`);
        
        let refreshedWallets = this.wallets.map(wallet => this.refreshWallet(wallet));
        Promise.all(refreshedWallets)
        .then(async (wallets) => {

          wallets.forEach(wallet => {
            console.log(`[Wallet] Refreshed Wallet #${wallet.accountIndex}`);
          });

          this.wallets = wallets;
          await this._store.setString(WalletKey, JSON.stringify(this.wallets));
          console.log('SAVED', this.wallets[0]);

          this.walletData.loaded  = true;
          this.walletData.busy    = false;
          resolve(true);
        })
        .catch((err) => {
          console.log(`[Wallet] Error Refreshing Wallets`);
          console.log(err.message ? err.message : err);

          this.walletData.loaded  = true;
          this.walletData.busy    = false;
          resolve(false);
        });
      } else {
        console.log('busy?', this.walletData);
        resolve(false);
      }
    }); 
  }

  public establishConnection(coin: any): Promise<any> {
    console.log(`connect to ${coin.electrumx_host}:${coin.electrumx_port}`);
    this.walletData.busy    = true;
    this.walletData.loaded  = false;
    this.walletData.enabled = false;
    
    return new Promise((resolve, reject) => {
      this._electrumxClient = new ElectrumxClient(coin.electrumx_host, coin.electrumx_port);

      this.createSubscriptions()
      .then(() => {
        console.log('[Wallet] Subscriptions setup!');

        this._validateSessionTimer = setTimeout(this.validateSession, 1000 * 10, this);
        return this._electrumxClient.connect();
      })
      .then(() => {
        console.log('[Wallet] Connected!');
        return this._electrumxClient.blockchainHeaders_subscribe();
      })
      .then(() => {
        this.walletData.subscribed = true;
        console.log('[Wallet] Subscribed!');
        return this._electrumxClient.server_version(UserAgent, '1.4');
      })
      .then((electrumxVersion: any) => {
        this.walletData.loaded        = true;
        this.walletData.enabled       = true;
        this.walletData.busy          = false;
        this.walletData.serverVersion = Array.isArray(electrumxVersion) ? electrumxVersion[0] : 'Unknown Version';

        console.log('[Wallet] Version', electrumxVersion);
        clearTimeout(this._validateSessionTimer);
        return resolve(true);
      })
      .catch((err: any) => {
        console.log('CONNECTION ERROR');
        console.log(err);
  
        this.walletData.loaded      = true;
        this.walletData.warning     = true;

        if (err && err.message.includes('unsupported client')) {
          this.walletData.warningText = 'Wallet outdated! Please update your application to continue!';
  
          alert('You are currently using an unsupported version of this wallet. Please update your ODIN Messenger as soon as possible to continue.')
        } else {
          this.walletData.warningText = 'Unable to establish a secure connection with an available wallet relay node. Please try again later.';
  
          console.log('Connection error');
          console.log(err);
        }
  
        this.walletData.busy = false;
        return resolve(false);
      });
    });
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

  public async cancelSubscriptions() {
    await this._electrumxClient.subscribe.off('data', this.onHandleData);
    await this._electrumxClient.subscribe.off('finished', this.onHandleFinished);
    await this._electrumxClient.subscribe.off('blockchain.headers.subscribe', this.onHandleBlockchainHeaders);
    clearTimeout(this._validateSessionTimer);
    // await this._electrumxClient.close();
    this.walletData.subscribed  = false;
    this.walletData.loaded      = false;
    this.walletData.busy        = false;

    return true;
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

  public async sendTransaction(wallet, recipient, amount, coinControl, fee): Promise<any> {
    return new Promise(async (resolve, reject) => {
      console.log(`[Wallet Module] Sending [${amount}] to [${recipient}]`);

      try {
        ODIN.address.toOutputScript(recipient);
      } catch (e) {
        return reject(new Error('invalid_recipient'));
      }

      let feeSumSats = Number(fee) * 1e8;
      let inputSumSats = coinControl.reduce((sum, tx) => sum += Number(tx['value']), 0);
      let outputSumSats = Math.ceil(Number(amount) * 1e8);

      console.dir('wallet', wallet);
      console.log('control', coinControl);
      console.log('input', inputSumSats);
      console.log('output', outputSumSats);
      console.log('networks', ODIN.networks);
      console.log('networks.bitcoin', ODIN.networks.bitcoin);

      if (inputSumSats <= (outputSumSats + feeSumSats)) {
        return reject(new Error('low_balance'));
      }

      let saveData = JSON.parse(this._store.getString('saveData'));
      if (wallet.coin.name === 'ODIN') {
        coinControl = coinControl.map(tx => {
          let address = wallet.external.find(addr => addr['address'] === tx['address']);
          tx['address_index'] = address.addressIndex;
          return tx;
        });

        console.log('~~ coin control ~~');
        console.dir(coinControl);
        
        let seed = ODIN.bip39.mnemonicToSeed(saveData.mnemonicPhrase);
        let sroot = ODIN.bip32.fromSeed(seed, ODIN.networks.bitcoin);

        // const Address       = ODIN.payments.p2pkh({ pubkey: AddressPath.publicKey });

        // const script        = ODIN.address.toOutputScript(Address.address);
        // const hash          = ODIN.crypto.sha256(script);
        // const reversedHash  = new Buffer(hash.reverse()).toString('hex');

        let transaction = new ODIN.TransactionBuilder();
        transaction.setVersion(1);

        // add inputs
        for (let input of coinControl) {
          transaction.addInput(input['tx_hash'], Number(input['tx_pos']));
        }

        // add outputs
        transaction.addOutput(recipient, outputSumSats);

        // add change (if any)
        if (inputSumSats > Math.ceil(outputSumSats + feeSumSats)) {
          let changeSumSats = inputSumSats - Math.ceil(outputSumSats + feeSumSats);
          transaction.addOutput(wallet.external[0].address, changeSumSats);
        }

        // sign inputs
        coinControl.forEach((unspentTx, index) => {
          const path = `m/44'/2100'/${wallet.accountIndex}'/0/${unspentTx['address_index']}`;
          const AddressPath = sroot.derivePath(path);
          const AddressWIF = AddressPath.toWIF();
          const KeyPair = ODIN.ECPair.fromWIF(AddressWIF);
          transaction.sign(index, KeyPair);
        });

        // create signed transaction hex
        let signedTx = transaction.build().toHex();

        console.log('~~~ COMPLETE ~~~~', signedTx.length);
        console.dir(signedTx.substr(0, 1024));
        console.dir(signedTx.substr(1024, signedTx.length));

        let sent = await this._electrumxClient.blockchainTransaction_broadcast(signedTx);

        if (sent && sent.length >= 64) {
          this.notify({
            eventName: 'TransactionSent',
            object: this
          });

          return resolve(sent);
        } else {
          console.log('[Wallet] Sent?', sent);
          return reject(new Error('transaction_failed'));
        }
      } else {
        return reject(new Error('unknown_coin_type'));
      }
    });
  }

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
   * @param accountIndex The current account 'wallet' to discover.
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
      hash:           reversedHash,
      balance:        balance,
      transactions:   txHistory.map(tx => { tx['address'] = Address.address; return tx; }),
      unspent:        unspent.map(tx => { tx['address'] = Address.address; return tx; }),
    };
  }

  private async updateAddress(address: any) {
    console.log(`[Wallet] Update Address ---\nAddress:\t${address.address}\nHash:\t${address.hash}\n\n`);

    let balance   = await this._electrumxClient.blockchainScripthash_getBalance(address.hash);
    let txHistory = await this._electrumxClient.blockchainScripthash_getHistory(address.hash);
    let unspent   = await this._electrumxClient.blockchainScripthash_listunspent(address.hash);

    return {
      ...address,
      balance,
      transactions:   txHistory.map(tx => { tx['address'] = address.address; return tx; }),
      unspent:        unspent.map(tx => { tx['address'] = address.address; return tx; }),
    };
  }

  /**
   * Discovery method for external (non-change) addresses. Will loop through all potential addresses
   * associated to an `accountIndex` or 'wallet' until the agreed gap limit is reached.
   * 
   * The established 'Gap Limit' is 20 addresses. This means, 20 addresses that have no prior
   * transaction history. Internally referred to as `active` addresses. Once 20 addresses have
   * been discovered and verified to not be `active` then we can safely assume we are done with
   * this discovery.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account 'wallet' to discover.
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
        hash: addressPull.hash,
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
   * with `active` external accounts 'Addresses'. An Address is considered `active` if it has had
   * at least one transaction.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account 'wallet' to discover.
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
            hash: account.hash,
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
          tx['pending']     = false;
          tx['value']       = (received ? received.amount : sent.amount);
        } catch (err) {
          console.log(`[Wallet] Unable to handle transaction ${tx.tx_hash}`);
          tx['blockheight'] = -1;
          tx['timestamp'] = -1;
          tx['received'] = false;
          tx['sent'] = false;
          tx['pending'] = true;
          tx['value'] = '';
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
   * 
   * @param transactions List of Transactions to find the earliest timestamp
   */
  private async oldestTransaction(transactions: ITransaction[]): Promise<number> {
    console.log('OLDEST?', transactions);
    if (!transactions.length) return -1;
    let bestTimestamp = -1;
    for (let tx of transactions) {
      if (Number(tx.timestamp) > bestTimestamp) bestTimestamp = Number(tx.timestamp);
    }
    
    return bestTimestamp;
  }

  /**
   * Discovers external and internal addresses associated to an `accountIndex`. Returns a full account
   * summary.
   * 
   * @param seed The primary seed hash of which all wallets, accounts, and addresses should exist from.
   * @param accountIndex The current account 'wallet' to discover.
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

    let pendingTxs    = account.transactions.filter(tx => (tx['pending'] === true));
    let confirmedTxs  = account.transactions.filter(tx => (tx['pending'] === false)).sort((tx1, tx2) => {
      if (tx1['timestamp'] > tx2['timestamp']) return -1;
      else if (tx1['timestamp'] < tx2['timestamp']) return 1;
      return 0;
    });

    account.transactions = pendingTxs.concat(confirmedTxs);

    account.lastTransaction = await this.oldestTransaction(account.transactions);
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
  private async createSubscriptions() {
    let self = this;

    await this._electrumxClient.subscribe.on('data', this.onHandleData);
    await this._electrumxClient.subscribe.on('finished', this.onHandleFinished);
    await this._electrumxClient.subscribe.on('blockchain.headers.subscribe', this.onHandleBlockchainHeaders);
    await this._electrumxClient.subscribe.on('error', this.onHandleError);
    return true;
    // this._electrumxClient.subscribe.on('blockchain.scripthash.subscribe', (...args) => {
    //   console.log('GOT BLOCK', args);
    // });
  }

  private onHandleData(rawData: any) {
    let data = null;

    try {
      console.log('[Wallet] onElectrumxData');
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
      this.chainStats.blockheight = data.result.height;
      
      this.notify({
        eventName: 'NewBlockFound',
        object: this
      });
    }
  }

  private onHandleFinished(tcpActionId: number) { }

  private onHandleBlockchainHeaders(headers: any) {
    if (!Array.isArray(headers)) {
      console.log('[Wallet] Unable to process headers...');
      console.log(headers);
      return;
    }

    const header = headers.shift();
    if (header && header.hasOwnProperty('height')) {
      console.log(`[Wallet] New Blockheight [${header.height}]`);
      this.chainStats.blockheight = header.height;

      this.notify({
        eventName: 'NewBlockFound',
        object: this
      });
    }
  }

  /**
   * Subscribe to any errors streamed from this plugin.
   * There are two primary error types to watch out for:
   *
   * err.name === 'UnexpectedResponseError'
   * This error comes from an unexpected response from ElectrumX as
   * ElectrumX should always return a JSON.parse-able string response.
   *
   * err.name === 'TCPClientError'
   * This error comes from the base class TcpClient when a connection
   * fails.
   */
  private onHandleError(err: any) {
    console.log('ON ERROR', {
      name: err.name ? err.name : '??',
      msg: err.message ? err.message : '??'
    }, err);

    if (err.name === 'TCPClientError!') {
      this.walletData.loaded      = true;
      this.walletData.warning     = true;
      this.walletData.warningText = 'Failed to establish a connection to a Wallet Relay Node. Please try again later';
    }
  }
}
