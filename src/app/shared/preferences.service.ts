import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
// import { StorageService } from "./storage.service";
import { alert } from "ui/dialogs";

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


@Injectable()
export class PreferencesService {
  public preferences: any;
  private defaultPreferences: any;

  constructor() {
    this.log('[Init]');
    this.defaultPreferences = this._defaultPreferences();

    this.loadPreferences = this.loadPreferences.bind(this);
    this.savePreferences = this.savePreferences.bind(this);
  }

  /**
   * (protected) Logs `entry` to the console via `console.log`. Will prefix the log with
   * `serviceId` to namespace the log output.
   * 
   * @param entry The string to output to the console
   */
  protected log(entry: string): void {
    console.log(`[PreferencesService] ${entry}`);
  }

  public async loadPreferences(): Promise<any> {
    try {
      this.preferences = JSON.parse(getString('preferences'));
      if (typeof this.preferences !== 'object') {
        this.preferences = this.defaultPreferences;
      }

    } catch (err) {
      this.log('Trouble loading preferences, applying default...');
      this.preferences = this.defaultPreferences;
    }

    return this.preferences;
  }

  public async savePreferences(preferences?: any): Promise<any> {
    if (typeof preferences !== 'object') {
      preferences = null;
    }

    try {
      if (preferences) {
        this.preferences = preferences;
        setString('preferences', JSON.stringify(preferences));
      } else {
        setString('preferences', JSON.stringify(this.preferences));
      }
    } catch (err) {
      this.log('Trouble saving preferences, applying default...');
      this.preferences = this.defaultPreferences;
      setString('preferences', JSON.stringify(this.preferences));
    }

    return this.preferences;
  }

  private _defaultPreferences(): any {
    return {
      api_url: 'https://osm-testnet.obsidianplatform.com',
      explorer_url: 'https://inspect.odinblockchain.org/api'
    };
  }
}
