import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { StorageService } from './index';
import { OSMClientService } from './osm-client.service';
import { RouterExtensions } from "nativescript-angular/router";
import { ObservableArray, ChangedData } from "tns-core-modules/data/observable-array";

import { ODIN } from '~/app/bundle.odin';

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

export interface IRemoteMessage {
  key: string;
  value: {
    destinationDeviceId: number;
    destinationRegistrationId: number;
    deviceId: number;
    registrationId: number;
    accountHash: string;
    ciphertextMessage: string;
    timestamp: number;
  }
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
  private _signalClient: LibsignalProtocol.Client;

  public saveData: UserSaveData;
  public COIN: string;
  public friends: ISignalAddress[];
  public messages: any;
  public remotePreKeyBundles: number;
  public localPreKeyBundles: number;
  
  public osmConnected: boolean;

  constructor(
    private _router: RouterExtensions,
    private _osmClient: OSMClientService,
    private _store: StorageService
  ) {
    super();

    this.COIN             = 'ODIN';
    this._signalClient    = null;
    this.osmConnected     = false;
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
    
    this.remotePreKeyBundles  = 0;
    this.localPreKeyBundles   = 0;

    this.initialize();
  }

  async initialize() {
    console.log(`UserModel... INITIALIZE`);
  }

  /**
   * @deprecated
   * @todo remove reference from Settings Component
   */
  public async onPublishNewPrekeys(): Promise<boolean> {
    let preKeyBatch = this._signalClient.generatePreKeyBatch();
    let registerPackage = this._signalClient.exportRegistrationObj();
    registerPackage.preKeys = preKeyBatch.map((key) => {
      return {
        id: key.id,
        pubKey: key.pubKey
      }
    });

    try {
      let registeredKeys = await this._osmClient.registerClient(registerPackage);
      if (registeredKeys.count && registeredKeys.count > 0) {
        await this._store.setString('signalClient', JSON.stringify(this._signalClient));
        console.log(`UserModel... PUBLIST new prekeys... Saved Client`);
        this.set('remotePreKeyBundles', registeredKeys.count);
        return true;
      } else {
        throw new Error('BadPreKeyUpload');
      }
    } catch (err) {
      console.log('Unable to store prekey batch');
      console.log(err.message ? err.message : err);
      throw err;
    }
    // if (registeredKeys.count) {
    //   console.log('--- Account Update Successful ---');
    // }
    // throw new Error('Method not implemented');
  }

  /**
   * @deprecated This is old
   * @todo Remove reference from Settings Component
   */
  public async clearSession() {
    if (this.saveData.hashAccount === '') return true;

    await this._store.clearStorage();
    await this.clearSaveData();
    this._router.navigate(["/splashscreen"], { clearHistory: true });

    this.notify({
      eventName: "ClearSession",
      object: this
    });

    return true;
  }

  /**
   * @deprecated this is old af
   * @todo remove with `clearSession()`
   */
  private async clearSaveData() {
    this._signalClient        = null;
    this.remotePreKeyBundles  = 0;
    this.localPreKeyBundles   = 0;
    this.friends              = [];
    this.messages             = [];

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
    };
    
    this.notify({
      eventName: "SaveDataPurged",
      object: this
    });

    return true;
  }
}
