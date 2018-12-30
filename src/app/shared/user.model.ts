import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
// import {Router} from "@angular/router";
import { StorageService } from './index';
import { OSMClientService } from './osm-client.service';
import { RouterExtensions } from "nativescript-angular/router";

import { Buffer } from 'buffer';
import { Obsidian } from '../bundle.obsidian.js';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { confirm } from "tns-core-modules/ui/dialogs";
import Hashids from 'hashids';
import { alert } from "ui/dialogs";

import { LibsignalProtocol } from 'nativescript-libsignal-protocol';

export class UserSaveData {
  masterSeed: string;
  mnemonicPhrase: string;
  seedHex: string;
  username: string;
  password: string;
  hashAddress: string;
  hashAccount: string;
  registrationId: number;
  deviceId: number;
  registered: boolean;
}

export interface IRemoteContact {
  address: {
    name: string
  };
  displayName?: string;
  identityPubKey: string;
  signedPreKey: {
    id: number,
    pubKey: string,
    signature: string
  };
  publicPreKey: {
    id: number,
    pubKey: string
  };
}

export interface ISignalClient {
  client: {
    username: string,
    deviceId: number,
    registrationId: number
  };
  contacts: any[];
  preKeys: any[];
  signedPreKey: string;
  identityKeyPair: string;
}

@Injectable()
export class UserModel extends Observable {
  private _store: StorageService;
  private _osmClient: OSMClientService;
  private _signalClient: LibsignalProtocol.Client;

  public saveData: UserSaveData;
  public COIN: string;
  public friends: IRemoteContact[];

  constructor(
    private _router: RouterExtensions
  ) {
    super();

    this.COIN           = 'ODN';
    this._store         = new StorageService();
    this._osmClient     = new OSMClientService();
    this._signalClient  = null;
    this.friends        = [];
    this.saveData       = {
      masterSeed: '',
      mnemonicPhrase: '',
      seedHex: '',
      username: '',
      password: '',
      hashAddress: '',
      hashAccount: '',
      registrationId: 0,
      deviceId: 0,
      registered: false
    };

    this.initialize();
  }

  async initialize() {
    console.log('>> CHECK FOR USER <<');
    if (this._store.hasKey('saveData')) {
      console.log('>> ATTEMPT RESTORE SAVEDATA');
      await this.loadOSMIdentity();

      if (this._store.hasKey('signalClient')) {
        console.log('>> ATTEMPT RESTORE CLIENT');
        await this.loadSignalClient();
      }

      if (this._store.hasKey('contactList')) {
        console.log('>> ATTEMPT RESTORE FRIENDS');
        await this.loadContacts();
      }
    } else {
      await this.clearSession();
    }
  }

  async createSignalClient() {
    this._signalClient = new LibsignalProtocol.Client(
      this.saveData.hashAccount,
      this.saveData.registrationId,
      this.saveData.deviceId);

    console.log('Created Signal Client', {
      account: this.saveData.hashAccount,
      regId: this.saveData.registrationId,
      devId: this.saveData.deviceId
    });

    await this._store.setString('signalClient', this._signalClient.serialize());
    console.log('STORED SIGNAL CLIENT');

    return true;
  }

  async loadOSMIdentity() {
    console.log('...loading SaveData');
    try {
      this.saveData = JSON.parse(this._store.getString('saveData'));
      let storedPreKeys = await this._osmClient.checkRegistration(this.saveData.hashAccount);
      
      if (storedPreKeys.count) {
        console.log('--- Remote Session Restored ---');
        return true;
      }
      return false;
    } catch (err) {
      console.log('Unable to check registration status');
      console.log(err.message ? err.message : err);
      return false;
    }
  }

  async loadSignalClient() {
    console.log('...loading SignalClient');

    await this.createSignalClient();

    try {
      let savedClient: string = this._store.getString('signalClient');
      let restoredClient: ISignalClient = JSON.parse(savedClient);
      console.log('attempting to restore...', {
        client: restoredClient.client,
        contacts: restoredClient.contacts,
        identityKeyPair: restoredClient.identityKeyPair,
        signedPreKey: restoredClient.signedPreKey,
        preKeys: restoredClient.preKeys.length
      });

      await this._signalClient.importPrivatePreKeys(restoredClient.preKeys);
    } catch (err) {
      console.log('UNABLE TO RESTORE CLIENT');
      console.log(err.message ? err.message : err);
      
      alert("We were unable to restore your previous OSM Session. We'll generate a new one for you and reuse your pre-existing OSM Identity.");
    }

    let eventData = {
      eventName: "SessionRestored",
      object: this
    };
    this.notify(eventData);

    return this._signalClient;
  }

  async loadContacts() {
    console.log('...loading Contacts');
    this.friends = [];

    try {
      let savedContacts: string = this._store.getString('contactList');
      let restoredContacts: IRemoteContact[] = JSON.parse(savedContacts);
      console.log('attempting to restore...', {
        total: restoredContacts.length,
        example: restoredContacts[0]
      });

      this.friends = restoredContacts;
    } catch (err) {
      console.log('UNABLE TO RESTORE FRIENDS');
      console.log(err.message ? err.message : err);
      
      alert("We were unable to restore your saved contacts. You'll need to initiate new sessions to continue conversations.");
    }

    let eventData = {
      eventName: "ContactsRestored",
      object: this
    };
    this.notify(eventData);

    return this.friends;
  }

  async addFriend(remoteContact: IRemoteContact, displayName?: string): Promise<boolean> {
    console.log('>>> ADD REMOTE FRIEND');
    if (typeof displayName === 'undefined') displayName = '';
    remoteContact.displayName = displayName;

    if (await this.hasFriend(remoteContact.address.name)) {
      throw new Error('ContactExists');
    } else {
      console.log('ADD');
      this.friends.push(remoteContact);
      
      this._store.setString('contactList', JSON.stringify(this.friends));
      console.log('STORED CONTACT LIST', this._store.hasKey('contactList'));

      return this._store.hasKey('contactList');
    }
  }

  async hasFriend(contactIdentity: string): Promise<boolean> {
    let contactIndex = this.friends.findIndex((_friend) => {
      return !!(_friend.address.name === contactIdentity)
    });

    return !!(contactIndex >= 0);
  }

  async onSaveMasterSeed(masterSeed: any) {
    console.log('>>> ONSAVE MASTERSEED');

    if (this._store.hasKey('saveData')) {
      console.log('REJECT, ALREADY EXISTS');
      return false;
    }

    this.saveData.masterSeed = masterSeed;
    this.saveData.registered = false;

    let mnemonic = Obsidian.bip39.entropyToMnemonic(masterSeed.substr(0, 32));
    this.saveData.mnemonicPhrase = mnemonic;

    let seed  = Obsidian.bip39.mnemonicToSeed(mnemonic);
    let sroot = Obsidian.bip32.fromSeed(seed);
      
    let masterRoot    = sroot.derivePath("m/0'/0'/1337'/0");
    let masterAccount = Obsidian.payments.p2pkh({ pubkey: masterRoot.publicKey });
    let masterNumeric = Number(masterAccount.address.replace(/[^\d]/ig, ''));

    let hashids = new Hashids('', 8);
    this.saveData.hashAddress = hashids.encode(masterNumeric);
    this.saveData.hashAccount = this.saveData.hashAddress + '@' + this.COIN;

    this.saveData.registrationId = Number(LibsignalProtocol.KeyHelper.generateRegistrationId());
    this.saveData.deviceId = Number(LibsignalProtocol.KeyHelper.generateRegistrationId());

    this._store.setString('saveData', JSON.stringify(this.saveData));
    console.log('STORED SAVE DATA', this._store.hasKey('saveData'));
    console.log(this._store.getString('saveData'));
    console.dir(JSON.parse(this._store.getString('saveData')));

    await this.createSignalClient();
    return true;
  }

  async onRegisterUser() {
    if (this.saveData.hashAccount === '') return false;
    if (this.saveData.registered) return true;
    if (!this._signalClient || this._signalClient === null) await this.loadSignalClient();

    console.log('client', this._signalClient);

    try {
      let registeredKeys = await this._osmClient.registerClient(this._signalClient.exportRegistrationObj());
      if (registeredKeys.count) {
        this.saveData.registered = true;
        console.log('--- Account Creation Successful ---');
      }

      this._store.setString('saveData', JSON.stringify(this.saveData));

      let eventData = {
        eventName: "IdentityRegistered",
        object: this
      };
      this.notify(eventData);
    } catch (err) {
      console.log('Unable to registration account');
      console.log(err.message ? err.message : err);
    }
  }

  async clearSession() {
    if (this.saveData.hashAccount === '') return true;

    await this._store.clearStorage();
    await this.clearSaveData();
    this._router.navigate(["/splashscreen"], { clearHistory: true });

    let eventData = {
      eventName: "ClearSession",
      object: this
    };
    this.notify(eventData);

    return true;
  }

  private async clearSaveData() {
    this._signalClient = null;
    this.saveData = {
      masterSeed: '',
      mnemonicPhrase: '',
      seedHex: '',
      username: '',
      password: '',
      hashAddress: '',
      hashAccount: '',
      registrationId: 0,
      deviceId: 0,
      registered: false
    }
    return true;
  }
}
