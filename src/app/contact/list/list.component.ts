import { Component, OnInit } from '@angular/core';
import { isAndroid } from 'tns-core-modules/ui/page';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import * as app from 'tns-core-modules/application';
import { TouchGestureEventData } from 'tns-core-modules/ui/gestures';
import { GridLayout } from 'tns-core-modules/ui/layouts/grid-layout';
import { RouterExtensions } from 'nativescript-angular/router';
import { IdentityService } from '~/app/shared/services/identity.service';
import { Contact, Message } from '~/app/shared/models/messenger';
import { SnackBar } from 'nativescript-snackbar';
import { device } from 'tns-core-modules/platform/platform';

const firebase = require('nativescript-plugin-firebase');
declare var android: any;

@Component({
	moduleId: module.id,
	selector: 'ContactList',
	templateUrl: './list.component.html',
	styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  public friends: Contact[];

	constructor(
    private _router: RouterExtensions,
    private IdentityServ: IdentityService,
    private _snack: SnackBar
  ) {
    this.friends = [];

    // Span the background under status bar on Android
    if (isAndroid && device.sdkVersion >= '21') {
      const activity = app.android.startActivity;
      const win = activity.getWindow();
      win.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
    }

    firebase.analytics.setScreenName({
      screenName: 'Contact List'
    }).then(() => {});
  }

  ngOnInit() {
    console.log('view >> /contact/list');
    this.IdentityServ.getActiveAccount().loadContacts()
    .then((contacts: Contact[]) => {
      console.log('[Contact List] loaded contacts', contacts.map(c => `${c.username}`).join(','));
      this.friends = contacts;
    }).catch((err) => {
      console.log('[Contact List]  contact load error', err.message ? err.message : err);
    });
  }
  
  onAddContact(location: string) {
    this._captureAddContact(location);

    this._router.navigate(['/contact/add'], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  onTapContact(contactIdentity: string) {
    this._router.navigate(['/contact/edit', contactIdentity], {
      transition: {
        name: 'slideLeft'
      },
      queryParams: {
        goBackTo: 'contacts'
      }
    });
  }

  /**
   * Toggles the classname `-active` to the GridLayout DOM element
   * when a user first presses down and lifts up. This provides
   * feedback to the user about their action.
   * 
   * @param args Event data passed from TouchGesture
   */
  onTouchContact(args: TouchGestureEventData) {
    if (args.action === 'down') {
      let gridLayout = args.object as GridLayout;
      gridLayout.className = 'contact -active';
    } else if (args.action === 'up') {
      let gridLayout = args.object as GridLayout;
      gridLayout.className = 'contact';
    }
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  private _captureAddContact(location: string) {
    if (location === 'fab') {
      firebase.analytics.logEvent({
        key: 'contacts_add_friend_fab'
      })
      .then(() => { console.log('[Analytics] Metric logged >> Contacts Add Friend FAB'); });
    } else if (location === 'menu') {
      firebase.analytics.logEvent({
        key: 'contacts_add_friend_menu'
      })
      .then(() => { console.log('[Analytics] Metric logged >> Contacts Add Friend Menu'); });
    }
  }
}
