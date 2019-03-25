import { Injectable } from '@angular/core';
import { StorageService } from '../storage.service';
import { Identity } from '../models/identity/identity.model';
import { ODIN } from '~/app/bundle.odin';
import { identity } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IdentityService extends StorageService {
  identity: Identity;

  constructor() {
    super('IdentityService');

    this.init = this.init.bind(this);
    this.loadIdentity = this.loadIdentity.bind(this);
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
  
      const mnemonic = ODIN.bip39.entropyToMnemonic(masterSeed.substr(0, 32));
      // const mnemonic = 'cool cool cool cool cool cool cool cool cool cool cool cool';

      this.identity.masterSeed = masterSeed;
      this.identity.mnemonicPhrase = mnemonic;
      this.identity.save();
      return resolve(this.identity);
    });
  }
}
