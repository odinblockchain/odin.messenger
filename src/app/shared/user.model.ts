import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
// import {Router} from "@angular/router";
import { StorageService } from './index';
import { OSMClientService } from './osm-client.service';
import { RouterExtensions } from "nativescript-angular/router";
import { setInterval, clearInterval } from "tns-core-modules/timer";
import { ObservableArray, ChangedData } from "tns-core-modules/data/observable-array";

import { Buffer } from 'buffer';
import { Obsidian } from '../bundle.obsidian.js';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { confirm } from "tns-core-modules/ui/dialogs";
import Hashids from 'hashids';
import { alert } from "ui/dialogs";

import { LibsignalProtocol } from 'nativescript-libsignal-protocol';
import { timestamp } from "rxjs/operators";

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

export interface IPublicPreKey {
  id: number;
  pubKey: string;
}

export interface ISignedPreKey {
  id: number;
  pubKey: string;
  signature: string;
}

export interface IRemoteContact {
  address: ISignalAddress;
  displayName?: string;
  identityPubKey: string;
  signedPreKey: ISignedPreKey;
  publicPreKey: IPublicPreKey;
} 

export interface ISignalClient {
  store: any; //LibsignalProtocol.Interface.ISignalProtocolStore;
  registrationId: number;
  username: string;
  deviceId: number;
}

export interface ISignalAddress {
  name: string,
  registrationId: number,
  deviceId: number
}

export interface IPreKeyBundle {
  registrationId: number,
  deviceId: number,
  preKeyPublic: string,
  preKeyRecordId: number,
  signedPreKeyPublic: string,
  signedPreKeyRecordId: number,
  signature: string,
  identityPubKey: string
}

export interface ISignalClientContact {
  address: ISignalAddress;
  preKeyBundle: IPreKeyBundle;
}

export interface ILocalContact {
  address: ISignalAddress;
  displayName: string;
  preKeyBundle: IPreKeyBundle;
}

export interface ISignalClientPreKey {
  id: number;
  pubKey: string;
  serialized: string;
}

export interface ISignalClientSerialized {
  username: string;
  deviceId: number;
  registrationId: number;
  address: {
    name: string,
    deviceId: number
  };
  identityKeyPair: string;
  signedPreKey: string;
  contacts: ISignalClientContact[];
  preKeys: ISignalClientPreKey[];
}

export interface IMessage {
  senderIdentity: string;
  recipientIdentity: string;
  message: string;
}

export interface IStoredMessage {
  key: string;
  value: {
    destinationDeviceId: number, // recipient
    destinationRegistrationId: number, // recipient
    deviceId: number, // sender
    registrationId: number, // sender
    ciphertextMessage: string,
    timestamp: number
  };
}

@Injectable()
export class UserModel extends Observable {
  private _store: StorageService;
  private _osmClient: OSMClientService;
  private _signalClient: LibsignalProtocol.Client;

  public saveData: UserSaveData;
  public COIN: string;
  public friends: ISignalAddress[];
  public messages: any;

  constructor(
    private _router: RouterExtensions
  ) {
    super();

    this.COIN             = 'ODN';
    this._store           = new StorageService();
    this._osmClient       = new OSMClientService();
    this._signalClient    = null;
    this.friends          = [];
    this.messages         = [];
    this.saveData         = {
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
    console.log(`UserModel... INITIALIZE`);

    if (this._store.hasKey('saveData')) {
      console.log(`UserModel... Restore SaveData`);
      await this.loadOSMIdentity();

      if (this._store.hasKey('signalClient')) {
        console.log(`UserModel... Restore SignalClient`);
        await this.loadSignalClient();
      }
    } else {
      await this.clearSession();
    }
  }

  /**
   * Creates a new LibsignalProtocol Client. Uses `saveData` to preload the 
   * `hashAccount`, `registrationId`, and `deviceId`.
   * 
   * Additionally, you can pass three optional parameters to restore a previously
   * used Client instance.
   * 
   * @param identityKeyPair 
   * @param signedPreKey 
   * @param preKeys 
   */
  async createSignalClient(identityKeyPair?: string, signedPreKey?: string, preKeys?: any[]): Promise<boolean> {
    console.log(`UserModel... CREATE Signal Client`);
    console.log({
      account:    this.saveData.hashAccount,
      regId:      this.saveData.registrationId,
      devId:      this.saveData.deviceId,
      idKeyPair:  identityKeyPair,
      signedPre:  signedPreKey,
      preKeys:    preKeys ? preKeys.length : 0,
      preKey0:    preKeys ? preKeys[0] : ''
    });

    this._signalClient = await new LibsignalProtocol.Client(
      this.saveData.hashAccount, this.saveData.registrationId,
      this.saveData.deviceId, identityKeyPair, signedPreKey,
      preKeys);

    let foo = JSON.parse(JSON.stringify(this._signalClient));

    console.log(`UserModel... Sanity Check`);
    console.log({
      account:      this._signalClient.username,
      regId:        this._signalClient.registrationId,
      devId:        this._signalClient.deviceId,
      idpair:       foo.identityKeyPair,
      signedPreKey: foo.signedPreKey,
      preKeys:      foo.preKeys ? foo.preKeys.length : 0,
      preKey0:      foo.preKeys ? foo.preKeys[0] : ''
    });

    await this._store.setString('signalClient', JSON.stringify(this._signalClient));
    console.log(`UserModel... STORED Signal Client`);

    return true;
  }

  /**
   * Loads previously stored OSM Identity information within `saveData`.
   * Makes a call to the OSM-Server to verify account still exists.
   */
  async loadOSMIdentity(): Promise<boolean> {
    try {
      console.log(`UserModel... LOAD OSM Identity SaveData`);

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

  /**
   * Returns an `ObservableArray` of messages stored under the passed `contactIdentity`.
   * Will create a new `ObservableArray` and prefill it with saved messages if one has
   * not been loaded into the current session already.
   * 
   * Messages are stored under the key: `messages_<CONTACT_IDENTITY>`.
   * 
   * @param contactIdentity 
   */
  loadLocalContact(contactIdentity: string): ObservableArray<any> {
    console.log(`UserModel... LOAD Local Messages (${contactIdentity})`);
    if (!this.messages.hasOwnProperty(contactIdentity)) {
      console.log('...create new session cache');

      this.messages[contactIdentity] = new ObservableArray();
      let messages, savedMessages = this._store.getString(`messages_${contactIdentity}`);
      try {
        messages = JSON.parse(savedMessages);
        this.messages[contactIdentity].push(messages);
      } catch (err) {
        console.log(`UserModel... Unable to load previous messages; Might be clean slate`);
      };
    }
    
    return this.messages[contactIdentity];
  }

  /**
   * Loads a previously stored SignalClient instance into the current session.
   * Will create a Signal Client with the previously created `IdentityKeyPair`,
   * `SignedPreKey`, and `PreKeys`.
   * 
   */
  async loadSignalClient() {
    console.log(`UserModel... LOAD Signal Client`);

    try {
      let savedClient: string = this._store.getString('signalClient');
      let restoredClient: ISignalClientSerialized = JSON.parse(savedClient);

      console.log('attempting to restore...', {
        client:           restoredClient.address,
        contacts:         restoredClient.contacts,
        identityKeyPair:  restoredClient.identityKeyPair,
        signedPreKey:     restoredClient.signedPreKey,
        preKeys:          restoredClient.preKeys.length,
        preKey0:          restoredClient.preKeys[0]
      });

      await this.createSignalClient(
        restoredClient.identityKeyPair,
        restoredClient.signedPreKey,
        restoredClient.preKeys);
      console.log(`UserModel... LOAD Signal Client [1/3]`);

      let importContactSessions = [];
      restoredClient.contacts.forEach((contact) => {
        importContactSessions.push(this.storeContact(contact.address, contact.preKeyBundle));
      });

      await Promise.all(importContactSessions);
      console.log(`UserModel... LOAD Signal Client [2/3]`);
      
      this.notify({
        eventName: "ContactsRestored",
        object: this
      });

      await this._store.setString('signalClient', JSON.stringify(this._signalClient));
      console.log(`UserModel... LOAD Signal Client [3/3]`);
    } catch (err) {
      console.log(`UserModel... UNABLE to restore client`);
      console.log(err.message ? err.message : err);
      
      alert("We were unable to restore your previous OSM Session. We'll generate a new one for you and reuse your pre-existing OSM Identity. There may be some data corruption due to this.");

      await this.createSignalClient();
    }

    this.notify({
      eventName: "SessionRestored",
      object: this
    });

    return this._signalClient;
  }

  /**
   * Converts a RemoteContact package into a `PreKeyBundle` which will be used
   * throughout the `SignalClient` session.
   * 
   * @param remoteContact 
   */
  private buildBundlePackage(remoteContact: IRemoteContact): IPreKeyBundle {
    return {
      registrationId:       remoteContact.address.registrationId,
      deviceId:             remoteContact.address.deviceId,
      preKeyPublic:         remoteContact.publicPreKey.pubKey,
      preKeyRecordId:       remoteContact.publicPreKey.id,
      signedPreKeyPublic:   remoteContact.signedPreKey.pubKey,
      signedPreKeyRecordId: remoteContact.signedPreKey.id,
      signature:            remoteContact.signedPreKey.signature,
      identityPubKey:       remoteContact.identityPubKey
    }
  }

  /**
   * Adds a `remoteContact` to the local client's friend list. Will check if contact
   * exists already.
   * 
   * @param remoteContact 
   * @param displayName 
   */
  async addFriend(remoteContact: IRemoteContact, displayName?: string): Promise<boolean> {
    console.log(`UserModel... ADD FRIEND ${remoteContact.address.name}`);
    if (this.hasFriend(remoteContact.address.name)) {
      throw new Error('ContactExists');
    }

    if (typeof displayName === 'undefined') displayName = '';

    let preKeyBundle = this.buildBundlePackage(remoteContact);
    let contact: ISignalClientContact = {
      address: {
        name: remoteContact.address.name,
        registrationId: remoteContact.address.registrationId,
        deviceId: remoteContact.address.deviceId
      },
      preKeyBundle: preKeyBundle
    };

    try {
      await this.storeContact(contact.address, contact.preKeyBundle);

      if (this._signalClient.hasSession(contact.address.name)) {
        await this._store.setString('signalClient', JSON.stringify(this._signalClient));
        console.log(`UserModel... UPDATED SignalClient with new friend details`);
        return true;
      } else {
        console.log(`UserModel... ERROR Failed Client.hasSession Check!`);
        return false;
      }
    } catch (err) {
      console.log(`UserModel... ERROR Failed to store contac!`);
      console.log(err.message ? err.message : err);
      return false;
    }
  }

  /**
   * Checks for the existence of `contactIdentity` within locally stored friend cache.
   * 
   * @param contactIdentity 
   */
  hasFriend(contactIdentity: string): boolean {
    let index = this.friends.findIndex((friend) => friend.name === contactIdentity);
    return !!(index >= 0);
  }

  /**
   * Fetches a `contactIdentity` from the locally cached object of friends.
   * 
   * @param contactIdentity 
   */
  async getFriend(contactIdentity: string): Promise<ISignalAddress> {
    let friend = this.friends.find((friend) => friend.name === contactIdentity);
    if (typeof friend !== 'undefined') return friend;
    throw new Error('Missing Friend');
  }


  /**
   * Send a message to an added contact.
   * Must first prefetch a fresh bundle from the server
   * Message is encrypted with a fresh cipher and delivered
   * 
   * @param toIdentity 
   * @param message 
   */
  async sendMessage(toIdentity: string, message: string): Promise<boolean> {
    console.log(`UserModel... SEND MESSAGE ${toIdentity}`);

    let contact: ISignalAddress = await this.getFriend(toIdentity);
    let contactBundle: IRemoteContact = await this._osmClient.fetchContact(toIdentity);

    console.log(`UserModel... Fetched fresh contact bundle`, {
      contact: contact,
      bundle: contactBundle
    });

    if (!contactBundle.publicPreKey) {
      console.log(`UserModel... ERROR! Remote Contact has no more prekeys! (${toIdentity})`);
      alert('Recipient has ran out of message tokens, please try again later when they have refreshed.');
      return false;
    }

    let preKeyBundle = this.buildBundlePackage(contactBundle);
    await this.storeContact(contact, preKeyBundle);

    let encodedMessage = await this._signalClient.prepareMessage(toIdentity, message)
    .then(this._signalClient.encodeMessage);

    let putMessageBody = {
      destinationDeviceId: contact.deviceId,
      destinationRegistrationId: contact.registrationId,
      deviceId: this.saveData.deviceId,
      registrationId: this.saveData.registrationId,
      ciphertextMessage: encodedMessage
    };

    try {
      let response: any = await this._osmClient.putMessage(putMessageBody);
      if (response.status && response.status === 'ok') {
        return await this.storeMessage('me', contact.name, message);
      } else {
        console.log(`UserModel... ERROR! Bad response from OSM-Server for sending message`);
        console.log(response);

        alert('Unable to deliver message to recipient. Please try again later.');
        return false;
      }
    } catch (err) {
      console.log(`UserModel... ERROR! Was unable to deliver message`);
      console.log(err.message ? err.message : err);

      alert('Unable to deliver message to recipient. Please try again later.');
      return false;
    }
  }


  /**
   * Stores a contact locally by adding a session to the `SignalClient` instance
   * and adding them to the local cache of friends (it non-existent).
   * 
   * @param contact 
   * @param preKeyBundle 
   */
  async storeContact(contact: ISignalAddress, preKeyBundle: IPreKeyBundle): Promise<ISignalAddress> {
    console.log(`UserModel... Storing Contact ${contact.name}`);

    await this._signalClient.addSession(contact, preKeyBundle);
    if (!this.hasFriend(contact.name)) this.friends.push(contact);

    return contact;
  }

  /**
   * Middleware for sending and receiving messages. Will append the new message to the local store
   * and push a new message element to the local message ObservableArray cache or create one if
   * non existent.
   * 
   * @param sender 
   * @param recipient 
   * @param message 
   */
  async storeMessage(sender: string, recipient: string, message: string): Promise<boolean> {
    console.log(`UserModel... Storing Message (${sender})>>(${recipient}) "${message}"`);

    let contactName;
    if (sender === 'me') contactName = recipient;
    else contactName = sender;

    let messages = [];
    try {
      messages = JSON.parse(this._store.getString(`messages_${contactName}`));
    } catch (err) {
      console.log(`UserModel... Previous messages corrupted (empty?)`, {
        previous: this._store.getString(`messages_${contactName}`)
      });
    }

    let newMessage = {
      to:       recipient,
      from:     sender,
      date:     (new Date()).getTime(),
      message:  message
    };

    messages.push(newMessage);

    this._store.setString(`messages_${contactName}`, JSON.stringify(messages));
    console.log(`UserModel... SAVED Message Storage: messages_${contactName}`);

    if (this.messages.hasOwnProperty(contactName)) this.messages[contactName].push(newMessage);
    else {
      this.messages[contactName] = new ObservableArray();
      this.messages[contactName].push(newMessage);
    }

    this.notify({
      eventName: `NewMessage_${contactName}`,
      object: this
    });

    return true;
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

    // set custom alphabet to reflect base58 charset... removes 0, O, I, l
    let hashids = new Hashids('', 8, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
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

  async fetchMessages() {
    try {
      let response: any = await this._osmClient.getMessages(this.saveData.registrationId, this.saveData.deviceId);
      console.log('GET response', response);
      if (response.status && response.status === 'ok') {
        if (response.messages && response.messages.length > 0) {
          this.parseMessages(response.messages);
        }
      } else {
        alert('Unable to fetch messages from server. Please try again later.');
      }
      return response;
    } catch (err) {
      console.log('Unable to pull messages');
      console.log(err.message ? err.message : err);
      alert('Unable to pull messages');
      return false;
    }
  }
  
  async parseMessages(messages: IStoredMessage[]) {
    // let message = messages[0];

    // console.log(`...working message: ${message.key}`);

    // let friend = this.friends.find((friend: IRemoteContact) => {
    //   return !!(friend.address.registrationId === message.value.registrationId &&
    //   friend.address.deviceId === message.value.deviceId);
    // });

    // console.log('matched friend', friend);

    // if (!this._signalClient.hasContact(`${friend.address.name}`)) {
    //   console.log('Friend session not added yet, import!', friend);
    // }

    // let foo = JSON.parse(this._signalClient.serialize());
    // delete foo.preKeys;

    // console.log(foo);

    // try {
    //   console.log('attempting to decrypt :: ', message.value.ciphertextMessage);
    //   let plainTextMessage = await this._signalClient.decryptEncodedMessage(friend.address.name, message.value.ciphertextMessage);

    //   console.log('plainTextMessage', plainTextMessage);

    //   this.messages.push({
    //     senderIdentity: friend.address.name,
    //     recipientIdentity: this.saveData.hashAccount,
    //     message: plainTextMessage
    //   });
    // } catch (err) {
    //   console.log('Unable to import message');
    //   console.log(err.message ? err.message : err);
    //   // alert('Unable to parse message');
    // }
    
    // messages.forEach(async (message: IStoredMessage) => {
    //   console.log(`...working message: ${message.key}`);

    //   let friend = this.friends.find((friend: IRemoteContact) => {
    //     return !!(friend.address.registrationId === message.value.registrationId &&
    //     friend.address.deviceId === message.value.deviceId);
    //   });

    //   console.log('matched friend', friend);

    //   if (!this._signalClient.hasContact(`${friend.address.name}`)) {
    //     console.log('Friend session not added yet, import!', friend);
    //   }

    //   try {
    //     let plainTextMessage = await this._signalClient.decryptEncodedMessage(friend.address.name, message.value.ciphertextMessage);

    //     console.log('plainTextMessage', plainTextMessage);

    //     this.messages.push({
    //       senderIdentity: friend.address.name,
    //       recipientIdentity: this.saveData.hashAccount,
    //       message: plainTextMessage
    //     });
    //   } catch (err) {
    //     console.log('Unable to import message');
    //     console.log(err.message ? err.message : err);
    //     // alert('Unable to parse message');
    //   }
    // });
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
    this._store           = new StorageService();
    this._osmClient       = new OSMClientService();
    this._signalClient    = null;
    this.friends          = [];
    this.messages         = [];
    this.saveData         = {
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
    
    return true;
  }
}
