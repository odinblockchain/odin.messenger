import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { UserModel } from '~/app/shared/user.model';
import { PreferencesService } from '~/app/shared/preferences.service';
import { alert, confirm } from "ui/dialogs";
import { isAndroid, isIOS, device } from "platform";
import { Page } from "ui/page";

declare var android: any;
declare var java: any;

@Component({
  selector: "Settings",
  moduleId: module.id,
  templateUrl: "./settings.component.html",
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  public preferences: any;
  public user: UserModel;
  public darkMode: boolean;
  
  constructor(
    private _page: Page,
    private _user: UserModel,
    private _pref: PreferencesService
  ) {
    this.darkMode     = true;
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
    let shouldClear = await confirm("Are you sure you wish to clear your local ODIN session?")
    if (shouldClear) {
      console.log('>> Working to clear ODIN session');
      await this._user.clearSession();
    }
  }

  async onPublishTokens() {
    console.log('>> Working to publush tokens');
    try {
      if (await this._user.onPublishNewPrekeys()) {
        alert('Successfully pushed new batch of one-time use Tokens to ODIN-Server.');
      } else {
        alert('Something went wrong while publishing a new batch of one-time use Tokens to ODIN-Server. Please check your configurations and try again.');
      }
    } catch (err) {
      console.log('Caught unexpected error while publishing tokens...');
      console.log(err.message ? err.message : err);
      if (err.message === 'Max_PreKeys') {
        alert("You've hit the limit for the maximum amount of one-time use Public Tokens to store on the ODIN-Server. Please wait some time before attempting to add again.");
      } else {
        alert('Something unexpected occurred while publishing a new batch of one-time use Public Tokens to ODIN-Server. Please check your configurations and try again.');
      }
    }
  }

  toggleUITheme() {
    if (isAndroid && device.sdkVersion >= "21") {
      let windowView = app.android.startActivity.getWindow();
      let decorView = windowView.getDecorView();
      console.log('>= 21', device.sdkVersion);

      if (!this.darkMode) {
        let colorHex = '#1b1b1b';

        let colorInt = android.graphics.Color.parseColor(colorHex);
        this._page.backgroundColor = colorHex;

        console.log('colorInt', colorInt);
        windowView.setStatusBarColor(colorInt);
        decorView.setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE);
      } else {
        let colorHex = '#AAAAAA';

        let colorInt = android.graphics.Color.parseColor(colorHex);
        this._page.backgroundColor = colorHex;
        
        console.log('colorInt', colorInt);
        windowView.setStatusBarColor(colorInt);
        decorView.setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
      }

      this.darkMode= !this.darkMode;
    } else {
      console.log('not supported');
    }
  }
}
