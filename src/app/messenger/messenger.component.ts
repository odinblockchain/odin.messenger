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
import { UserModel, ISignalAddress } from '~/app/shared/user.model';
import { SignalAddress } from '../shared/models/signal';
import { AccountService } from '../shared/services';
import { IdentityService } from '../shared/services/identity.service';
import { Contact, Message } from '../shared/models/messenger';
import { StorageService } from '../shared';
import { PreferencesService } from '../shared/preferences.service';

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
    private _user: UserModel,
    private Account: AccountService,
    private IdentityServ: IdentityService,
    private Storage: StorageService,
    private Preferences: PreferencesService
  ) {
    this.friends = [];

    this.onFetchMessages = this.onFetchMessages.bind(this);
  }

  ngOnInit() {
    console.log('view >> /messenger');
    this.IdentityServ.activeAccount.loadContacts()
    .then((contacts: Contact[]) => {
      console.log('loaded contacts', contacts.map(c => c.username).join(','));
      // console.dir(contacts);
      this.friends = contacts;
    })
    .catch(console.log);

    // this.IdentityServ.activeAccount.fetchMessages(this.IdentityServ.activeAccount.client)
    // .then((messages: any[]) => {
    //   while(messages.length) {
    //     const message = messages.shift();
    //     console.log(`handle`, message.key);
    //     this.IdentityServ.activeAccount.handleMessage(new Message({
    //       key: message.key,
    //       account_bip44: this.IdentityServ.activeAccount.bip44_index,
    //       contact_username: message.value.accountHash,
    //       owner_username: this.IdentityServ.activeAccount.username,
    //       message: message.value.ciphertextMessage,
    //       timestamp: message.value.timestamp
    //     }));
    //   }

    //   console.log('done');
    // })
    // .catch(console.log);
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
    this.IdentityServ.activeAccount.fetchRemoteMessages()
    .then(x => {
      console.log('DONE')
    })
    .catch(console.log);
    
    //(this.IdentityServ.activeAccount.client);
  }
}
