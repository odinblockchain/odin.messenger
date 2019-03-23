import { Injectable } from '@angular/core';
import { StorageService } from '../storage.service';
import { Identity } from '../models/identity/identity.model';
import { ODIN } from '~/app/bundle.odin';
import Hashids from 'hashids';
import { LibsignalProtocol } from 'nativescript-libsignal-protocol';

@Injectable({
  providedIn: 'root'
})
export class IdentityService extends StorageService {
  identity: Identity;

  constructor() {
    super('IdentityService');

    this.clearStorage();
    this.init = this.init.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      try {
        this.identity = new Identity(JSON.parse(this.getString('identity')));
        this.log('loaded identity');
        this.dir(this.identity);
      } catch(err) {
        console.log(err);
        this.log('No identity found or error loading');
        this.identity = new Identity();
      }

      resolve(this.identity);
    });
  }

  async saveMasterseed(masterSeed: any) {
    this.log('save masterseed');

    return new Promise((resolve, reject) => {
      if (this.identity.masterSeed.length) {
        this.log('masterseed already exists');
        return resolve(this.identity);
      }
  
      this.identity.masterSeed = masterSeed;
      this.identity.registered = false;
  
      let mnemonic = ODIN.bip39.entropyToMnemonic(masterSeed.substr(0, 32));
      // let mnemonic = 'cool cool cool cool cool cool cool cool cool cool cool cool';
      this.identity.mnemonicPhrase = mnemonic;
  
      // let seed  = ODIN.bip39.mnemonicToSeed(mnemonic);
      // let sroot = ODIN.bip32.fromSeed(seed, ODIN.networks.bitcoin);
        
      // let masterRoot    = sroot.derivePath("m/0'/0'/1337'/0");
      // let masterAccount = ODIN.payments.p2pkh({ pubkey: masterRoot.publicKey });
      // let masterNumeric = Number(masterAccount.address.replace(/[^\d]/ig, ''));
  
      // set custom alphabet to reflect base58 charset... removes 0, O, I, l
      // let hashids = new Hashids('', 8, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
      // this.identity.hashAddress = hashids.encode(masterNumeric);
      // this.saveData.hashAccount = this.saveData.hashAddress + '@' + this.COIN;
  
      this.identity.registrationId = Number(LibsignalProtocol.KeyHelper.generateRegistrationId());
      this.identity.deviceId = Number(LibsignalProtocol.KeyHelper.generateRegistrationId());
  
      this.setString('identity', JSON.stringify(this.identity));
  
      this.log(`STORED SAVE DATA... ${this.hasKey('identity')}`);
      this.log(this.getString('identity'));
      this.dir(JSON.parse(this.getString('identity')));
  
      // await this.createSignalClient();
      return resolve(this.identity);
    });
  }

  async onRegisterUser() {
    this.log('onregister not implemented');
    // if (this.saveData.hashAccount === '') return false;
    // if (this.saveData.registered) return true;
    // if (!this._signalClient || this._signalClient === null) await this.loadSignalClient();

    // console.log('client', this._signalClient);

    // try {
    //   let registeredKeys = await this._osmClient.registerClient(this._signalClient.exportRegistrationObj());
    //   if (registeredKeys.count) {
    //     this.saveData.registered = true;
    //     this.remotePreKeyBundles = 100;
    //     this.osmConnected = true;
    //     console.log('--- Account Creation Successful ---');
    //   }

    //   this._store.setString('saveData', JSON.stringify(this.saveData));

    //   let eventData = {
    //     eventName: "IdentityRegistered",
    //     object: this
    //   };
    //   this.notify(eventData);
    // } catch (err) {
    //   if (err.message && err.message === 'Max_PreKeys') {
    //     this.saveData.registered = true;
    //     this.remotePreKeyBundles = 100;
    //     this.osmConnected = true;
    //     console.log('--- Account Creation Successful ---');

    //     this._store.setString('saveData', JSON.stringify(this.saveData));

    //     let eventData = {
    //       eventName: "IdentityRegistered",
    //       object: this
    //     };
    //     this.notify(eventData);
    //   } else {
    //     console.log('Unable to registration account');
    //     console.log('Error', {
    //       message: err.message ? err.message : err
    //     });

    //     alert('Your account coult not be registered at this time. Please try again later.');
    //   }
    // }
  }
}
