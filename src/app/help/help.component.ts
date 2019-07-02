import { Component, OnInit } from '@angular/core';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import * as app from 'tns-core-modules/application';
import * as utilityModule from 'tns-core-modules/utils/utils';
import { PreferencesService } from '../shared/preferences.service';
import { environment } from '~/environments/environment.tns';
import { SnackBar } from 'nativescript-snackbar';

const firebase = require('nativescript-plugin-firebase');

@Component({
	moduleId: module.id,
	selector: 'help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {
  private versionTouches: number;
  public preferences: any = {};
  public packageVersion: string = null;

	constructor(
    private _Preferences: PreferencesService,
    private _snack: SnackBar
  ) {
    this.preferences    = this._Preferences.preferences;
    this.packageVersion = global.version ? global.version : environment.app_version;
    this.versionTouches = 0;

    firebase.analytics.setScreenName({
      screenName: 'Help'
    }).then(() => {});
  }

  ngOnInit() {}

  onVersionTouch = (): void => {
    const { developer } = this._Preferences.preferences;

    if (developer) return;
    if (this.versionTouches < 5) {
      this.versionTouches++;
      return;
    }
    
    this._Preferences.savePreferences({
      ...this._Preferences.preferences,
      developer: true
    })
    .then(() => {
      this._snack.simple('Developer mode activated', '#ffffff', '#333333', 3, false);
      firebase.analytics.logEvent({
        key: 'developer_mode'
      })
      .then(() => { console.log('[Analytics] Metric logged >> Developer mode activated'); });
    });
  }
  
  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  openChat() {
    firebase.analytics.logEvent({
      key: 'help_open_chat_web'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open chat website'); });

    utilityModule.openUrl('https://odin.chat/');
  }

  openWebsite() {
    firebase.analytics.logEvent({
      key: 'help_open_odin_web'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open odin website'); });

    utilityModule.openUrl('https://odinblockchain.org/');
  }

  openTwitter() {
    firebase.analytics.logEvent({
      key: 'help_open_twitter'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open twitter'); });

    utilityModule.openUrl('https://twitter.com/odinblockchain');
  }

  openMedium() {
    firebase.analytics.logEvent({
      key: 'help_open_medium'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open medium'); });

    utilityModule.openUrl('https://medium.com/@odinblockchain');
  }

  openFacebook() {
    firebase.analytics.logEvent({
      key: 'help_open_facebook'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open facebook'); });

    utilityModule.openUrl('https://www.facebook.com/OdinBlockchain/');
  }

  openBlockfolio() {
    firebase.analytics.logEvent({
      key: 'help_open_blockfolio'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open blockfolio'); });

    utilityModule.openUrl('https://blockfolio.com/coin/ODIN');
  }

  openDiscord() {
    firebase.analytics.logEvent({
      key: 'help_open_discord'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open discord'); });

    utilityModule.openUrl('https://discord.me/odinblockchain');
  }

  openTelegram() {
    firebase.analytics.logEvent({
      key: 'help_open_telegram'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open telegram'); });

    utilityModule.openUrl('https://t.me/odinblockchain');
  }

  openReddit() {
    firebase.analytics.logEvent({
      key: 'help_open_reddit'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open reddit'); });

    utilityModule.openUrl('http://reddit.com/r/odinblockchain');
  }
}
