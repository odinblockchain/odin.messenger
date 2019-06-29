import { Component, OnInit } from '@angular/core';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import * as app from 'tns-core-modules/application';
import { UserModel } from '~/app/shared/user.model';
import { PreferencesService } from '~/app/shared/preferences.service';
import { alert, confirm } from 'tns-core-modules/ui/dialogs';
import { isAndroid, device } from 'tns-core-modules/platform';
import { Page } from 'tns-core-modules/ui/page';
import { Account } from '~/app/shared/models/identity';
import { IdentityService } from '~/app/shared/services/identity.service';
import { StorageService } from '~/app/shared';
import { RouterExtensions } from 'nativescript-angular/router';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar } from 'nativescript-snackbar';

const firebase = require('nativescript-plugin-firebase');
declare var android: any;
declare var java: any;

@Component({
  selector: 'SettingsIndex',
  moduleId: module.id,
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  public preferences: any;
  public user: UserModel;
  public darkMode: boolean;
  public activeAccount: Account;
  
  constructor(
    private _page: Page,
    private _user: UserModel,
    private _pref: PreferencesService,
    private _IdentityServ: IdentityService,
    private _StorageServ: StorageService,
    private _router: RouterExtensions,
    private _snack: SnackBar
  ) {
    this.darkMode     = true;
    this.user         = this._user;
    this.preferences  = this._pref.preferences;

    firebase.analytics.setScreenName({
      screenName: 'Settings Home'
    }).then(() => {});
  }

  ngOnInit(): void {
    this.activeAccount  = this._IdentityServ.getActiveAccount();
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  onUpdate() {
    this._pref.savePreferences(this.preferences);
    console.log('prefs', this.preferences);
  }

  public remoteKeyCountLabel() {
    if (!this.activeAccount || typeof this.activeAccount.remoteKeyCount === 'undefined') {
      return '...';
    }
    return this.activeAccount.remoteKeyCount;
  }

  public async onPurgeApplication() {
    console.log('>> Working to clear session');
    const shouldClear = await confirm('Are you sure you want to purge your locally saved ODIN identity? You will lose access to all saved contacts, messages, and funds within your wallet. It is recommended you backup your identity before purging.');
    if (!shouldClear) return console.log('Canceled purge');
    this._capturePurgeAttempt();

    const finalConfirm = await confirm('YOU ARE ABOUT TO PURGE YOUR IDENTITY. THIS ACTION CANNOT BE UNDONE. YOU WILL BE UNABLE TO RESTORE INFORMATION WITHOUT YOUR IDENTITY BACKUP.\n\nARE YOU SURE YOU WISH TO PROCEED?');
    if (!finalConfirm) return console.log('Canceled purge');
    this._capturePurgeConfirm();

    this._StorageServ.___order66()
    .then(() => {
      console.log('Action complete');
      alert('Local storage has been purged. Redirecting back to the splashscreen.');
      this._router.navigate(['/home'], { clearHistory: true });
    }).catch(() => {
      console.log('Action Failed');
      alert('FAILED TO PURGE LOCAL STORAGE. An error occurred in the process.');
    });
  }

  /**
   * Publish more chat tokens to the remote server
   */
  public async onPublishTokens() {
    console.log('>> Working to publush tokens');
    const shouldPublish = await confirm('Would you like to publish new chat tokens?\n\nEach message sent to you is uniquely encrypted using the chat tokens you publish.');

    try {
      if (!shouldPublish) {
        return console.log('[Settings] Skip publish');
      }

      if (await this.activeAccount.publishRemoteKeyBundle()) {
        this._capturePublishTokens();

        return alert('Successfully published a batch of chat tokens.');
      }

      alert('Something went wrong while publishing new chat tokens. Please try again later.');
    } catch (err) {
      console.log('[Settings] ERROR PUBLISHING CHAT TOKENS');
      console.log(err.message ? err.message : err);

      this._capturePublishTokensFailed();

      if (err.message === 'UserMaxPreKeys') {
        return alert('You have published the current maximum amount of single use chat tokens. Please wait until your token count has decreased.');
      }

      alert('Something went wrong while publishing new chat tokens. Please try again later.');
    }
  }

  public viewNotificationSettings() {
    this._router.navigate(['/settings/notifications'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  public viewMetricsPreferences() {
    this._router.navigate(['/settings/metrics'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  public viewDeveloperTools() {
    this._router.navigate(['/settings/developer'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  public viewIdentityBackup() {
    this._router.navigate(['/settings/identity'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  public onCopyText(text: string) {
    let sb = this._snack;
    Clipboard.setText(text)
    .then(async function() {
      try {
        await sb.simple('Username copied to clipboard!', '#ffffff', '#333333', 3, false);
      } catch (err) {
        console.log('Unable to copy to clipboard', err);
      }
    });
  }

  toggleUITheme() {
    if (isAndroid && device.sdkVersion >= '21') {
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

  private _capturePublishTokens() {
    firebase.analytics.logEvent({
      key: 'settings_publish_tokens'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Publish Tokens'); });
  }

  private _capturePublishTokensFailed() {
    firebase.analytics.logEvent({
      key: 'settings_publish_tokens_failed'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Publish Tokens Failed'); });
  }

  private _capturePurgeAttempt() {
    firebase.analytics.logEvent({
      key: 'settings_purge_attempt'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Purge Attempt'); });
  }

  private _capturePurgeConfirm() {
    firebase.analytics.logEvent({
      key: 'settings_purge_confirm'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Purge Confirm'); });
  }
}

