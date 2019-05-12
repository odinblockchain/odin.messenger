import { Injectable } from '@angular/core';
import { StorageService } from '../storage.service';
import { Identity } from '../models/identity/identity.model';
import { ODIN } from '~/app/bundle.odin';
import { identity } from 'rxjs';
import { AccountService } from './account.service';
import { Account } from '../models/identity';
import { environment } from '~/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IdentityService extends StorageService {
  public identity: Identity;
  
  private activeAccount: Account;

  constructor(
    private Account: AccountService
  ) {
    super('IdentityService');

    this.init = this.init.bind(this);
    this.loadIdentity = this.loadIdentity.bind(this);
    this.getActiveAccount = this.getActiveAccount.bind(this);
    this.setActiveAccount = this.setActiveAccount.bind(this);
    this.storeIdentity = this.storeIdentity.bind(this);
    this.fetchIdentity = this.fetchIdentity.bind(this);
  }

  /**
   * Initializes the `IdentityService` singleton by loading
   * the application identity stored within ApplicationSettings.
   */
  public async init() {
    return new Promise((resolve, reject) => {
      this.loadIdentity()
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Loads the identity returned from `fetchIdentity()`. Attaches `storeIdentity() => store()`
   * and `fetchIdentity() => fetch()` to the `Identity` reference.
   */
  private async loadIdentity() {
    return new Promise(async (resolve, reject) => {
      this.identity = new Identity(this.fetchIdentity());
      this.log('View Identity');
      this.dir(this.identity.serialize());

      this.identity.store = this.storeIdentity;
      this.identity.fetch = this.fetchIdentity;

      // this.registered.next(this.identity.registered);
      return resolve(this.identity);
    });
  }

  /**
   * Sets the internal account. Defaults to the last saved account index if none are
   * provided.
   * 
   * @param accountIndex The account index to set as active within the application
   */
  public async setActiveAccount(accountIndex?: number) {
    if (typeof accountIndex === 'undefined' || isNaN(Number(accountIndex))) {
      accountIndex = this.identity.activeAccountIndex;
    } else {
      accountIndex = Number(accountIndex);
    }

    this.log(`setActiveAccount (${accountIndex})`);
    console.log(typeof accountIndex, accountIndex, this.identity.activeAccountIndex);
    
    if (this.Account.accounts[accountIndex]) {
      this.identity.activeAccountIndex = accountIndex;
      this.identity.save();
      this.activeAccount = this.Account.accounts[accountIndex];
      this.log(`Set activeAccount to [${this.activeAccount.username}]`);
    } else {
      this.log(`Account #${accountIndex} not found, activeAccount not set`);
    }
  }

  public getActiveAccount(): Account {
    if (!this.activeAccount) {
      this.setActiveAccount(0);
    }

    return this.activeAccount;
  }

  /**
   * Attempts to stringify a passed `identity` reference and store it within ApplicationSettings
   * as a string.
   * 
   * @param identity 
   */
  storeIdentity(identity: Identity) {
    try {
      this.setString('identity', JSON.stringify(identity));
      this.log('saved identity');
    } catch (err) {
      this.log('error saving identity');
      console.log(err);
    }
  }

  /**
   * Attempts to parse a stored `identity` string from ApplicationSettings
   */
  fetchIdentity() {
    try {
      return JSON.parse(this.getString('identity'));
    } catch (err) {
      this.log('Unable to load identity...');
      console.log(err);
      return {};
    }
  }

  /**
   * Uses a provided `masterSeed` to generate the `mnemonicPhrase` and create the localized
   * identity.
   * 
   * @param masterSeed The full masterseed which is used to generate the mnemonic phrase
   */
  async saveMasterseed(masterSeed: any) {
    this.log('save masterseed');

    return new Promise((resolve, reject) => {
      if (this.identity.masterSeed.length) {
        this.log('masterseed already exists');
        return resolve(this.identity);
      }

      this.identity.masterSeed = masterSeed;
      if (environment.mockIdentity === true) {
        this.log(`@@@ MockIdentity Active — Mocking mnemonic phrase`);
        this.identity.mnemonicPhrase = 'pixel pixel pixel pixel pixel pixel pixel pixel pixel pixel pixel pixel';
      } else {
        this.identity.mnemonicPhrase = ODIN.bip39.entropyToMnemonic(masterSeed.substr(0, 32));
      }
      
      this.identity.save();
      return resolve(this.identity);
    });
  }

  public async ___purge() {
    delete this.identity;
  }
}
