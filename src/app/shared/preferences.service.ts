import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { StorageService } from "./storage.service";
import { alert } from "ui/dialogs";

@Injectable()
export class PreferencesService {
  public preferences: any;

  constructor(
    private _store: StorageService
  ) {
    try {
      this.preferences = JSON.parse(this._store.getString('preferences'));
    } catch (err) {
      console.log('Unable to load preferences, resetting to default variables');
      this.preferences = this.defaultPreferences();
    }

    this._store.setString('preferences', JSON.stringify(this.preferences));
    console.log('Preferences... UPDATED');
  }

  public setPreferences(preferences: any) {
    this.preferences = preferences;
    this._store.setString('preferences', JSON.stringify(this.preferences));
    alert('Updated application preferences.');
  }

  private defaultPreferences(): any {
    return {
      api_url: 'http://c94577f6.ngrok.io'
    };
  }
}
