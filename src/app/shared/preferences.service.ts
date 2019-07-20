import { Injectable } from '@angular/core';
import { environment } from '~/environments/environment';
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
} from 'tns-core-modules/application-settings';


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

  public isNotificationEnabled(groupKey: string, prefKey: string) {
    const { notifications } = this.preferences;
    if (!notifications) return false;
    if (!notifications.hasOwnProperty(groupKey)) return false;
    if (!notifications[groupKey].hasOwnProperty(prefKey)) return false;
    return !!notifications[groupKey][prefKey];
  }

  public async loadPreferences(): Promise<any> {
    try {
      this.preferences = JSON.parse(getString('preferences'));
      if (!this.preferences ||
          typeof this.preferences !== 'object' ||
          !this.preferences.api_url || this.preferences.api_url === ''
      ) {
        this.preferences = this.defaultPreferences;
      }
    } catch (err) {
      this.log('Trouble loading preferences, applying default...');
      this.preferences = this.defaultPreferences;
    }

    this.preferences.api_url = 'https://osm-testnet.obsidianplatform.com';

    return this.preferences;
  }

  public async savePreferences(preferences?: any): Promise<any> {
    if (typeof preferences !== 'object') {
      preferences = null;
    }

    try {      
      if (preferences && typeof preferences === 'object') {
        this.preferences = preferences;
      }
      
      setString('preferences', JSON.stringify(this.preferences));
      this.log('Preferences updated');
    } catch (err) {
      this.log('Trouble saving preferences, applying default...');
      this.preferences = this.defaultPreferences;
      setString('preferences', JSON.stringify(this.preferences));
    }

    return this.preferences;
  }

  private _defaultPreferences(): any {
    return {
      migration: '0001',
      api_url: (environment.osmServerUrl || 'https://osm-testnet.obsidianplatform.com'),
      explorer_url: 'https://inspect.odinblockchain.org/api',
      metrics: {
        analytics: true
      },
      notifications: {
        chat: {
          push: true,
          display: true
        }
      },
      developer: false
    };
  }
}
