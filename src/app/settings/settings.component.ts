import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { UserModel } from '~/app/shared/user.model';
import { PreferencesService } from '~/app/shared/preferences.service';
import { alert, confirm } from "ui/dialogs";

@Component({
  selector: "Settings",
  moduleId: module.id,
  templateUrl: "./settings.component.html",
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  public preferences: any;
  public user: UserModel;
  
  constructor(
    private _user: UserModel,
    private _pref: PreferencesService
  ) {
    this.user         = this._user;
    this.preferences  = this._pref.preferences;
  }

  ngOnInit(): void {
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
      if (err.message === 'Max_PreKeys') {
        alert("You've hit the limit for the maximum amount of one-time use Public Tokens to store on the OSM-Server. Please wait some time before attempting to add again.");
      } else {
        alert('Something unexpected occurred while publishing a new batch of one-time use Public Tokens to OSM-Server. Please check your configurations and try again.');
      }
    }
  }
}
