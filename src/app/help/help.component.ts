import { Component, OnInit } from '@angular/core';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import * as app from 'application';
import * as utilityModule from 'utils/utils';

const firebase = require('nativescript-plugin-firebase');

@Component({
	moduleId: module.id,
	selector: 'help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

	constructor() {
    firebase.analytics.setScreenName({
      screenName: 'Help'
    }).then(() => {});
  }

  ngOnInit() { }
  
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

  openFacebook() {
    firebase.analytics.logEvent({
      key: 'help_open_facebook'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Help open facebook'); });

    utilityModule.openUrl('https://www.facebook.com/OdinBlockchain/');
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
