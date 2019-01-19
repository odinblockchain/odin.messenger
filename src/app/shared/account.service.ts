import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";

import { Buffer } from 'buffer';
import { Obsidian } from '~/app/bundle.obsidian.js';
// import * as Clipboard from 'nativescript-clipboard';
// import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
// import { confirm } from "tns-core-modules/ui/dialogs";
import Hashids from 'hashids';

// import { StorageService } from './storage.service';

export class User {
  mnemonicPhrase: string;
  seedHex: string;
  username: string;
  password: string;
}

import {
  getBoolean,
  setBoolean,
  getNumber,
  setNumber,
  getString,
  setString,
  hasKey,
  remove,
  clear
} from "tns-core-modules/application-settings";

// import { User } from "./user.model";
// import { BackendService } from "./backend.service";
// import { DatabaseService } from "../database/sqlite.service";

@Injectable()
export class AccountService {
  private user: User;
  public userModel: Observable;
  private hashSalt: string;
  private db;

  constructor() {
    this.hashSalt = '';
    this.user = new User();
    this.userModel = new Observable();

    // this.db = new Couchbase("test");

    // let documentId = this.db.createDocument({
    //   foo: 'bar'
    // });

    // console.log('...docID', documentId);

    // this.userModel.set('cb', this._cbService);
    // this.userModel.set('db', this.db);

    this.userModel.set("onLabelTap", (args: any) => {
      // args is of type EventData
      console.log('ONTAP', args);
      // console.log("Tapped on", args.object); // <Label>
      // console.log("Name: ", args.object.text); // The text value
    });

    let service = this;
    this.userModel.set('onSaveMasterSeed', function(masterSeed: string) {
      return new Promise((resolve, reject) => {
        console.log('[userModel] GOT SEED', masterSeed);

        console.log('---- CHECK FOR SEED STORE');
        console.log(hasKey('accountServiceId'));
        console.log(getString('accountServiceId', ''));

        if (hasKey('accountServiceId')) {
          let foo = service.db.getDocument(getString('accountServiceId', ''));
          console.dir(foo);
        }
      
        this.set('masterSeed', masterSeed);
  
        let mnemonic = Obsidian.bip39.entropyToMnemonic(masterSeed.substr(0, 32));
        this.set('mnemonic', mnemonic);
  
        let seed  = Obsidian.bip39.mnemonicToSeed(mnemonic);
        let sroot = Obsidian.bip32.fromSeed(seed);
        
        let masterRoot    = sroot.derivePath("m/0'/0'/1337'/0");
        let masterAccount = Obsidian.payments.p2pkh({ pubkey: masterRoot.publicKey });
        let masterNumeric = Number(masterAccount.address.replace(/[^\d]/ig, ''));
  
        let hashids = new Hashids('', 8);
        this.set('hashAddress', hashids.encode(masterNumeric));
        this.set('hashAccount', this.get('hashAddress') + '@' + this.get('coin'));

        // console.dir('cb', this.cb);
        // console.dir('db', this.db);
        // console.dir('service',service);

        
        // let documentId = service.db.createDocument({
        //   foo: 'bar'
        // });

        // console.log('...docID', documentId);

        // setString('accountServiceId', documentId);

        return resolve(true);
      });
    });

    this.userModel.set('seedHex', '');
    this.userModel.set('coin', 'ODN');
    this.userModel.set('hashAddress', '');
    this.userModel.set('hashAccount', '');
    this.userModel.set('masterSeed', '');
    this.userModel.set('mnemonic', '');
  }

  private getAddress(node) {
    return Obsidian.payments.p2pkh({ pubkey: node.publicKey }).address;
  }

  setSeedHex(seedHex: string) {
    let seedStr = Buffer.from(seedHex, 'hex');
    console
    this.userModel.set('seedHex', seedStr);
  }

  setMnemonicPhrase(mnemonicPhrase: string) {
    this.user.mnemonicPhrase = mnemonicPhrase;
  }

  setUsername(username: string) {
    this.user.username = username;
    this.userModel.set("username", 'xx:' + username);
  }

  setPassword(password: string) {
    this.user.password = password;
  }

  getUsername() {
    return this.user.username;
  }
}
