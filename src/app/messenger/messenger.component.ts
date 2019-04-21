import { Component, OnInit } from '@angular/core';
import { Page } from "ui/page";
// import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
// import { EventData } from "tns-core-modules/data/observable";
// import { View } from 'tns-core-modules/ui/core/view';
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { TouchGestureEventData } from "tns-core-modules/ui/gestures";
import { GridLayout } from "ui/layouts/grid-layout";
import { RouterExtensions } from "nativescript-angular/router";
// import { UserModel, ISignalAddress } from '~/app/shared/user.model';
// import { SignalAddress } from '../shared/models/signal';
// import { AccountService } from '../shared/services';
import { IdentityService } from '~/app/shared/services/identity.service';
import { Contact, Message } from '~/app/shared/models/messenger';
import { SnackBar } from 'nativescript-snackbar';
// import { StorageService } from '../shared';
// import { PreferencesService } from '../shared/preferences.service';

@Component({
	moduleId: module.id,
	selector: 'messenger',
	templateUrl: './messenger.component.html',
	styleUrls: ['./messenger.component.css']
})

export class MessengerComponent implements OnInit {
  // public friends: SignalAddress[];
  public friends: Contact[];

	constructor(
    private _page: Page,
    private _router: RouterExtensions,
    // private _user: UserModel,
    // private Account: AccountService,
    private IdentityServ: IdentityService,
    private _snack: SnackBar
    // private Storage: StorageService,
    // private Preferences: PreferencesService
  ) {
    this.friends = [];

    this.onFetchMessages = this.onFetchMessages.bind(this);
  }

  ngOnInit() {
    console.log('view >> /messenger');
    this.IdentityServ.getActiveAccount().loadContacts()
    .then((contacts: Contact[]) => {
      console.log('loaded contacts', contacts.map(c => `${c.username}`).join(','));
      this.friends = contacts;
    })
    .catch(console.log);
  }
  
  onAddContact() {
    console.log('CTA::AddContact');
    this._router.navigate(["/contact-add"], {
      transition: {
        name: "slideLeft"
      }
    });
  }

  onViewMessages(contactIdentity: string) {
    console.log('onViewMessage', contactIdentity);
    this._router.navigate(['/messenger/message', contactIdentity], {
      queryParams: {
        name: 'foobar',
        id: 123
      },
      transition: {
        name: 'slideLeft'
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
      gridLayout.className = "contact -active";
    } else if (args.action === 'up') {
      let gridLayout = args.object as GridLayout;
      gridLayout.className = "contact";
    }
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  onFetchMessages() {
    if (this.IdentityServ.getActiveAccount()) {
      this._snack.simple('Fetching new messages', '#ffffff', '#333333', 3, false);
      this.IdentityServ.getActiveAccount().fetchRemoteMessages()
      .then(() => {
        console.log('All messages have been fetched');
        this._snack.simple('All new messages fetched', '#ffffff', '#333333', 3, false);
      }).catch((err) => {
        console.log('Fetch messages error', err.message ? err.message : err);
        this._snack.simple('Failed to fetch messages', '#ffffff', '#333333', 3, false);
      });
    } else {
      console.log('NO ACTIVE ACCOUNT -- UNABLE TO FETCH MESSAGES');
    }
  }
}
