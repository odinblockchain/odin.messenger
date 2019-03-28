import { Injectable } from '@angular/core';
import { Account } from '~/app/shared/models/identity';
import { StorageService } from '../storage.service';

import { ODIN } from '~/app/bundle.odin';
import Hashids from 'hashids';
import { OSMClientService } from '../osm-client.service';
import { Client } from '../models/messenger/client.model';
import { PreferencesService } from '../preferences.service';
import { LogService } from './log.service';

/**
 * Manages many `Accounts`. Will load `Accounts` from the database on initialization (`init()`)
 * 
 */
@Injectable({
  providedIn: 'root'
})
export class AccountService extends StorageService {
  accounts: Account[];

  constructor(
    private osmClient: OSMClientService,
    private _Preferences: PreferencesService,
    private _Log: LogService
  ) {
    super('AccountService');
    this.accounts = [];

    this.init = this.init.bind(this);
    // this.initDb = this.initDb.bind(this);
    this.createAccountFromMnemonic = this.createAccountFromMnemonic.bind(this);
    this.loadAccounts = this.loadAccounts.bind(this);
    this.fetchMessages = this.fetchMessages.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadAccounts)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Attempts to load all accounts available from the table `accounts`
   * and creates an internal list of active accounts.
   */
  private async loadAccounts() {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const accounts: Account[] = await this.odb.all('SELECT * FROM accounts');
        this.accounts = accounts.map(account => {
          this.log(`Load Account [${account.username}]
          index:        ${account.bip44_index}
          client_id:    ${account.client_id}
          registered:   ${account.registered}`);

          account = new Account(account);
          account.fetchMessages = this.fetchMessages;
          account.db = this.odb;
          account.preferences = this._Preferences.preferences;
          account.logger = this._Log.logger;
          return account;
        });

        this.log(`accounts loaded...${this.accounts.length}`);
        return resolve(this.accounts);
      } catch (err) {
        this.log('Unable to load accounts...');
        console.log(err);
        return reject(err);
      }
    });
  }

  /**
   * Searches the internal list of `accounts` for a given `username`.
   * 
   * @param username The username of the account
   */
  public findAccount(username: string) {
    return this.accounts.find((a: Account) => a.username === username);
  }

  /**
   * Inserts an `account` into the database for storage and returns an active account.
   * Will first search locally to verify the given account exists.
   * 
   * @param account The account with a username and index
   */
  public async createAccount(account: Account): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    return new Promise((resolve, reject) => {
      if (this.accounts.find(a => a.username === account.username)) {
        return reject(new Error(`Account (${account.username}) already exists`));
      }

      this.odb.execSQL(`INSERT INTO accounts (bip44_index, username, registered) values (?, ?, ?)`, [
        account.bip44_index,
        account.username,
        (account.registered) ? 1 : 0
      ])
      .then((id: number) => {
        account.db = this.odb;
        this.log(`added account:${account.username} id:${id}`);
        this.accounts.push(account);

        return resolve(account);
      })
      .catch(reject);
    });
  }

  /**
   * Creates an Account based on a given `mnemonic` and `bip44_index` combination.
   * It first determines the seed, then path root to generate the P2PKH Address.
   * 
   * Afterwards it uses `Hashids` with a specific salt and alphanumeric dataset (base58)
   * to generate a unique account hash which will become their username.
   * 
   * @param mnemonic Mnemonic phrase/seed
   * @param bip44_index Index for account deriviation
   */
  public async createAccountFromMnemonic(mnemonic: string, bip44_index: number): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    this.log('Creating from mnemonic...');
    const seed  = ODIN.bip39.mnemonicToSeed(mnemonic);
    const sroot = ODIN.bip32.fromSeed(seed, ODIN.networks.bitcoin);
      
    const masterRoot    = sroot.derivePath(`m/2100'/0'/0'/${bip44_index}`);
    const masterAccount = ODIN.payments.p2pkh({ pubkey: masterRoot.publicKey });
    const masterNumeric = Number(masterAccount.address.replace(/[^\d]/ig, ''));

    // set custom alphabet to reflect base58 charset... removes 0, O, I, l
    const hashids = new Hashids(masterAccount, 8, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
    const hashAddress = hashids.encode(masterNumeric);

    this.log(`account numeric – ${masterNumeric}`);
    this.log(`account hash – ${hashAddress}`);

    return this.createAccount(new Account({
      bip44_index,
      username: hashAddress + '@' + 'ODIN',
      client_id: -1
    }));
  }

  /**
   * Makes an attempt to register an `account` with a remote communication server.
   * 
   * @param account The account to register
   */
  public async registerAccount(account: Account, client: Client): Promise<any> {
    this.log(`Attempt to register ${account.username}`);

    if (!account || !client) return false;
    if (!account.username.length) return false;
    if (account.registered) return true;

    return new Promise(async (resolve, reject) => {
      account.registered = true;
      client.remote_key_total = 123;

      // Fake a successful registration
      // account.save()
      // .then(client.save)
      // .then(() => {
      //   this.log('emitting....');
      //   account.emit('registered');
      //   return resolve(true)
      // })
      // .catch(reject);

      try {
        let registeredKeys = await this.osmClient.registerClient(client.signalClient.exportRegistrationObj());
        if (registeredKeys.count) {
          account.registered = true;
          client.remote_key_total = Number(registeredKeys.count);
          this.log(`Registration success – Registered Keys (${registeredKeys.count})`);
        }

        account.save()
        .then(client.save)
        .then(() => {
          account.emit('registered');
          return resolve(true)
        })
        .catch(reject);
      } catch (err) {
        if (err.message && err.message === 'Max_PreKeys') {
          account.registered = true;
          client.remote_key_total = 100;
          this.log(`Registration "success" – Registered Keys (100)`);

          account.save()
          .then(client.save)
          .then(() => {
            account.emit('registered');
            return resolve(true)
          })
          .catch(reject);
        } else {
          this.log(`Account [${account.username}] failed to register`);
          console.log(err);
          alert('Your account coult not be registered at this time. Please try again later.');
        }
      }
    });
  }

  public fetchMessages(client: Client) {
    this.log(`Fetch messages for ${client.device_id} (DEPRECATED)`);

    return new Promise((resolve, reject) => {
      resolve(true);
      // this.osmClient.getMessages(client.registration_id, client.device_id)
      // .then((res: any) => {
      //   if (res.status && res.status === 'ok') {
      //     this.log(`total messages for user ${res.messages.length}`);
      //     console.log(res.messages);
      //     resolve(res.messages);
      //   } else {
      //     this.log('Bad response for pulling messages');
      //     console.log(res);
      //     resolve([]);
      //   }
      // })
      // .catch(reject);
    });

    //   if (response.status && response.status === 'ok') {
    //     console.log(`UserModel... FETCH Messages >> OK... Total:${response.messages.length}...`);
    //     if (response.messages && response.messages.length > 0) {
    //       try {
    //         for (let message of response.messages) {
    //           console.log(`WORK MESSAGE: ${message.key}`);
    //           await this.handleNewMessage(message);
    //         }
    //       } catch (err) {
    //         console.log('Unable to parse one message, will likely try again later');
    //         console.log(err.message ? err.message : err);
    //       }
    //     }
    //   } else {
    //     alert('Unable to fetch messages from server. Please try again later.');
    //   }
    //   return response;
    // } catch (err) {
    //   console.log('Unable to pull messages');
    //   console.log(err.message ? err.message : err);
    //   alert('Unable to pull messages');
    //   return false;
    // }
  }
}
