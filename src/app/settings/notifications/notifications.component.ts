import { Component } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { PreferencesService } from "~/app/shared/preferences.service";
import { messaging, Message } from "nativescript-plugin-firebase/messaging";
import { SnackBar } from "nativescript-snackbar";
import { IdentityService } from "~/app/shared/services/identity.service";

@Component({
  selector: "Notifications",
  moduleId: module.id,
  templateUrl: "./notifications.component.html",
  styleUrls: ['./notifications.component.css']
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
  }

  public toggleChatPref(key: string) {
    if (this.chatPreferences.hasOwnProperty(key)) {
      this.chatPreferences[key] = !this.chatPreferences[key];
    } else {
      this.chatPreferences[key] = true;
    }

    this._preferences.savePreferences();

    if (key === 'push' && this.chatPreferences[key] === false) {
      messaging.unregisterForPushNotifications()
      .then(() => {
        this._snack.simple(`You will no longer receive push notifications`, '#ffffff', '#333333', 3, false);
      })
      .catch(err => {
        console.log('CANNOT UNREGISTER');
      })
    } else if (key === 'push' && this.chatPreferences[key] === true) {
      const account = this._IdentityServ.getActiveAccount();
      console.log(`NEW FCM TOKEN: ${this._IdentityServ.identity.fcmToken}`);
      const token = this._IdentityServ.identity.fcmToken;
      account.publishFcmToken(token)
      .then((status) => {
        if (status) {
          console.log('NICE');
        } else {
          console.log('NOT NICE');
        }
      })
      .catch(err => {
        console.log('CANNOT REGISTER FOR PUSH');
      });

      // messaging.registerForPushNotifications()
      // .then(() => {
      //   console.log('PUSH REGISTERED');
      // })
      // .catch(err => {
      //   console.log('CANNOT REGISTER FOR PUSH');
      // });
    }
  }

  public onPreviousView() {
    this._router.navigate(['/settings'], {
      transition: {
        name: 'slideRight'
      },
    });
  }
}
