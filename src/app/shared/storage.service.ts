import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";

import { getNativeApplication } from "tns-core-modules/application";
import { isAndroid, isIOS } from "tns-core-modules/platform";
import * as utils from "tns-core-modules/utils/utils";

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
export class StorageService {
  private db;

  public fudge;

  constructor() {
    // this.db = new Couchbase("test-database");
    this.fudge = 'packer';
  }

  public hasKey(key: string) {
    return hasKey(key);
  }

  public getString(key: string, defaultString?: any) {
    if (typeof defaultString === 'undefined') defaultString = '';

    return getString(key, defaultString);
  }

  public setString(key: string, defaultString?: any) {
    if (typeof defaultString === 'undefined') defaultString = '';

    return setString(key, defaultString);
  }

  public clearStorage() {
    return clear();
  }

  // public fetchStorageKeys() {
  //   if (isAndroid) {
  //     const sharedPreferences = getNativeApplication().getApplicationContext().getSharedPreferences("prefs.db", 0);
  //     const mappedPreferences = sharedPreferences.getAll();
  //     const iterator = mappedPreferences.keySet().iterator();

  //     while (iterator.hasNext()) {
  //       const key = iterator.next();
  //       console.log(key); // myString, myNumbver, isReal
  //       const value = mappedPreferences.get(key);
  //       console.log(value); // "John Doe", 42, true
  //     }

  //   } else if (isIOS) {
  //     // tslint:disable-next-line
  //     // Note: If using TypeScript you will need tns-platform-declarations plugin to access the native APIs like NSUserDefaults
  //     const userDefaults = utils.ios.getter(NSUserDefaults, NSUserDefaults.standardUserDefaults);
  //     const dictionaryUserDefaults = userDefaults.dictionaryRepresentation();

  //     const allKeys = dictionaryUserDefaults.allKeys;
  //     console.log(allKeys);
  //     const allValues = dictionaryUserDefaults.allValues;
  //     console.log(allValues);
  //   }
  // }
}
