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
import { Contact } from '../shared/models/messenger';

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
    private Identity: IdentityService
  ) {
    this.friends = [];
  }

  ngOnInit() {
    console.log('view >> /messenger');
    this.Identity.activeAccount.loadContacts()
    .then((contacts: Contact[]) => {
      console.log('loaded contacts', contacts.map(c => c.username).join(','));
      // console.dir(contacts);
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
    // this._router.navigate(['/messenger/message', contactIdentity], {
    //   queryParams: {
    //     name: 'foobar',
    //     id: 123
    //   },
    //   transition: {
    //     name: 'slideLeft'
    //   }
    // });
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
    this._user.fetchMessages();
  }
}
