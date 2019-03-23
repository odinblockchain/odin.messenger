import { Injectable } from '@angular/core';
import { Account } from '~/app/shared/models/identity';
import { StorageService } from '../storage.service';

import { ODIN } from '~/app/bundle.odin';
import Hashids from 'hashids';

@Injectable({
  providedIn: 'root'
})
export class AccountService extends StorageService {
  accounts: Account[];

  constructor() {
    super('AccountService');
    this.accounts = [];

    this.init = this.init.bind(this);
    // this.initDb = this.initDb.bind(this);
    this.createAccountFromMnemonic = this.createAccountFromMnemonic.bind(this);
    this.loadAccounts = this.loadAccounts.bind(this);
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

  private async loadAccounts() {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const accounts: Account[] = await this.odb.all('SELECT * FROM accounts');
        this.accounts = accounts.map(account => {
          account = new Account(account);
          account.db = this.odb;
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

  public async createAccount(account: Account): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    return new Promise((resolve, reject) => {
      if (this.accounts.find(a => a.username === account.username)) {
        return reject(new Error(`Account (${account.username}) already exists`));
      }

      this.odb.execSQL(`INSERT INTO accounts (bip44_index, username) values (?, ?)`, [
        account.bip44_index,
        account.username
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
   * Loads an Account based on a given `mnemonic` and `bip44_index` combination.
   * It first determines the seed, then path root to generate the P2PKH Address.
   * 
   * Afterwards it uses `Hashids` with a specific salt and alphanumeric dataset (base58)
   * to generate a unique account hash which will become their username.
   * 
   * @param mnemonic Mnemonic phrase/seed
   * @param bip44_index Index for account deriviation
   */
  public async createAccountFromMnemonic(mnemonic, bip44_index): Promise<any> {
    if (!this.dbReady()) {
      return false;
    }

    console.log('createAccountFromMnemonic', mnemonic, bip44_index);
    let seed  = ODIN.bip39.mnemonicToSeed(mnemonic);
    let sroot = ODIN.bip32.fromSeed(seed, ODIN.networks.bitcoin);
      
    let masterRoot    = sroot.derivePath(`m/2100'/0'/0'/${bip44_index}`);
    let masterAccount = ODIN.payments.p2pkh({ pubkey: masterRoot.publicKey });
    let masterNumeric = Number(masterAccount.address.replace(/[^\d]/ig, ''));

    // console.log('address', masterAccount);
    console.log('createAccountFromMnemonic:numeric', masterNumeric);

    // set custom alphabet to reflect base58 charset... removes 0, O, I, l
    let hashids = new Hashids(masterAccount, 8, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
    let hashAddress = hashids.encode(masterNumeric);

    console.log('createAccountFromMnemonic:hash.address', hashAddress);
    const username = hashAddress + '@' + 'ODIN';

    return this.createAccount(new Account({
      bip44_index,
      username,
      client_id: -1
    }));
  }

  public findAccount(username: string) {
    return this.accounts.find((a: Account) => a.username === username);
  }
}
