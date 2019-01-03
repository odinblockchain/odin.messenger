import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { UserModel } from '../shared/user.model';
import { PreferencesService } from '../shared/preferences.service';
import { alert, confirm } from "ui/dialogs";

@Component({
  selector: "Settings",
  moduleId: module.id,
  templateUrl: "./settings.component.html",
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  public remoteBundles: number;
  public localBundles: number;
  public preferences: any;
  
  constructor(
    private _user: UserModel,
    private _pref: PreferencesService
  ) {
    this.remoteBundles  = 0;
    this.localBundles   = 0;
    this.preferences    = this._pref.preferences;
  }

  ngOnInit(): void {
    this.remoteBundles  = this._user.remotePreKeyBundles;
    this.localBundles   = this._user.localPreKeyBundles;
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  onUpdate() {
    this._pref.setPreferences(this.preferences);
    console.log('prefs', this.preferences);
  }

  async onClearSession() {
    let shouldClear = await confirm("Are you sure you wish to clear your local OSM session?")
    if (shouldClear) {
      console.log('>> Working to clear OSM session');
      await this._user.clearSession();
    }
  }

  async onPublishTokens() {
    console.log('>> Working to publush tokens');
    try {
      if (await this._user.onPublishNewPrekeys()) {
        alert('Successfully pushed new batch of one-time use Tokens to OSM-Server.');
      } else {
        alert('Something went wrong while publishing a new batch of one-time use Tokens to OSM-Server. Please check your configurations and try again.');
      }
    } catch (err) {
      console.log('Caught unexpected error while publishing tokens...');
      console.log(err.message ? err.message : err);
      alert('Something unexpected occurred while publishing a new batch of one-time use Tokens to OSM-Server. Please check your configurations and try again.');
    }
  }
}
