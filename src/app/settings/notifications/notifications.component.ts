import { Component } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { PreferencesService } from '~/app/shared/preferences.service';
import { messaging } from 'nativescript-plugin-firebase/messaging';
import { SnackBar } from '@nstudio/nativescript-snackbar';
import { IdentityService } from '~/app/shared/services/identity.service';
import { connectionType, getConnectionType } from 'tns-core-modules/connectivity';

const firebase = require('nativescript-plugin-firebase');

@Component({
  selector: 'Notifications',
  moduleId: module.id,
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  public chatPreferences: any;

  constructor(
    private _preferences: PreferencesService,
    private _router: RouterExtensions,
    private _snack: SnackBar,
    private _IdentityServ: IdentityService
  ) {
    if (!this._preferences.preferences.hasOwnProperty('notifications')) {
      this._preferences.preferences.notifications = {};
    }

    if (!this._preferences.preferences.notifications.hasOwnProperty('chat')) {
      this._preferences.preferences.notifications.chat = {};
    }

    this._preferences.savePreferences();
    this.chatPreferences = this._preferences.preferences.notifications.chat;

    firebase.analytics.setScreenName({
      screenName: 'Settings Notifications'
    }).then(() => {});
  }

  public async toggleChatPref(key: string) {
    if (this.chatPreferences.hasOwnProperty(key)) {
      this.chatPreferences[key] = !this.chatPreferences[key];
    } else {
      this.chatPreferences[key] = true;
    }

    this._preferences.savePreferences();

    if (key === 'display') {
      if (this.chatPreferences['display'] === true) this._captureEnableDisplay();
      else this._captureDisableDisplay();
    }

    if (key === 'push' && !this.hasConnection()) {
      this.chatPreferences['push'] = !this.chatPreferences['push'];
      this._preferences.savePreferences();
      return this.confirmToast('Push notifications could not be updated at this time, please ensure you have an active internet connection.');
    }

    if (key === 'push' && this.chatPreferences[key] === false) {
      try {
        await messaging.unregisterForPushNotifications();
        this._captureDisablePush();
        this._snack.simple(`You will no longer receive push notifications`, '#ffffff', '#333333', 3, false);
      } catch (err) {
        console.log('[Settings.Notifications] Failed to unregister', err);
        this.chatPreferences['push'] = true;
        this._preferences.savePreferences();
        this.confirmToast('Push notifications could not be updated at this time, please ensure you have an active internet connection.');
      }
    } else if (key === 'push' && this.chatPreferences[key] === true) {
      try {
        const account     = this._IdentityServ.getActiveAccount();
        const fcmToken    = await firebase.getCurrentPushToken();
        const savedToken  = this._IdentityServ.identity.fcmToken;

        if (fcmToken != savedToken) {
          this._IdentityServ.identity.fcmToken = fcmToken;
          this._IdentityServ.identity.save();
        }

        console.log(`Notifications check --
          Enabled:  ${messaging.areNotificationsEnabled()}
          Saved:    ${savedToken}
          Token:    ${fcmToken}
        \n`);

        const status = await account.publishFcmToken(savedToken);
        if (!status) {
          throw new Error('FCMTokenPublishError');
        }

        this._captureEnablePush();
        console.log('REGISTERED');
      } catch (err) {
        console.log('[Settings.Notifications] Failed to register', err);
        this.chatPreferences['push'] = false;
        this._preferences.savePreferences();
        this.confirmToast('Push notifications could not be updated at this time, please ensure you have an active internet connection.');
      }
    }
  }

  private hasConnection() {
    const type = getConnectionType();
    if (type === connectionType.none) {
      return false;
    }

    return true;
  }

  private confirmToast(text: string) {
    const opts = {
      actionText: 'Ok',
      actionTextColor: '#1D2323',
      maxLines: 4,
      snackText: text,
      textColor: '#FCF9F1',
      hideDelay: (10 * 1000),
      backgroundColor: '#CC4F49'
    };

    this._snack.action(opts);
  }

  public onPreviousView() {
    this._router.navigate(['/settings'], {
      transition: {
        name: 'slideRight'
      },
    });
  }

  private _captureEnablePush() {
    firebase.analytics.logEvent({
      key: 'settings_notifications_push_enable'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Notification Push Enable'); });
  }

  private _captureDisablePush() {
    firebase.analytics.logEvent({
      key: 'settings_notifications_push_disable'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Notification Push Disable'); });
  }

  private _captureEnableDisplay() {
    firebase.analytics.logEvent({
      key: 'settings_notifications_display_enable'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Notification Display Enable'); });
  }

  private _captureDisableDisplay() {
    firebase.analytics.logEvent({
      key: 'settings_notifications_display_disable'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Settings Notification Display Disable'); });
  }
}
