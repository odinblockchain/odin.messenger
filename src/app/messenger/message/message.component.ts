import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy  } from '@angular/core';
import { PageRoute } from "nativescript-angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { ActivatedRoute } from '@angular/router';
import { alert } from "tns-core-modules/ui/dialogs";
import { ObservableArray } from "tns-core-modules/data/observable-array";

import * as Clipboard from 'nativescript-clipboard';
import { TextField } from 'ui/text-field';
import { Contact, Message } from '~/app/shared/models/messenger';
import { IdentityService } from '~/app/shared/services/identity.service';
import { Account } from '~/app/shared/models/identity';
import { RadListView } from 'nativescript-ui-listview';
import { SnackBar } from 'nativescript-snackbar';

@Component({
	moduleId: module.id,
	selector: 'message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit, AfterViewInit {
  @ViewChild("listView") lv: ElementRef;
  @ViewChild("textfield") tf: ElementRef;

  list: RadListView;
  textfield: TextField;

  public contactIdentity: string;
  public contactName: string;
  public message: string;

  private _activeAccount: Account;
  private _contact: Contact;
  private _dataItems: ObservableArray<any>;
  private _timer: any;

  constructor(
    private _page: PageRoute,
    private _router: RouterExtensions,
    private _route: ActivatedRoute,
    private _snack: SnackBar,
    private IdentityServ: IdentityService
  ) {

    this._route.params
    .subscribe(params => {
      console.log('[Message] Route params', params);

      if (params.hasOwnProperty('contactId')) {
        this.contactIdentity = params['contactId'];
      } else {
        alert("Something went wrong while loading the requested messages.");
        this._router.navigate(['/messenger']);
      }
    });

    this.message = '';
    this.sendMessage = this.sendMessage.bind(this);
  }

  ngOnInit() {
    console.log(`[Message] Loading Contact ${this.contactIdentity}`);
    
    if (this.IdentityServ.getActiveAccount()) {
      this._activeAccount = this.IdentityServ.getActiveAccount();
      this._contact = this.IdentityServ.getActiveAccount().findContact(this.contactIdentity);

      if (this._contact) {
        this._dataItems = this._contact.oMessages$;
        this.contactName = this._contact.name;
      } else {
        console.log('[Message] Unable to load contact');
        this._dataItems = new ObservableArray();
        console.log(this.IdentityServ.getActiveAccount().contacts);
      }
    } else {
      console.log('[Message] IdentityService missing active account');
      this._dataItems = new ObservableArray();
    }
  }

  ngAfterViewInit() {
    this.textfield = this.tf.nativeElement;
    this.list = this.lv.nativeElement;
  }

  get dataItems(): ObservableArray<Message> {
    return this._dataItems;
  }

  public displayName(): string {
    if (this.contactName && this.contactName.length) {
      return this.contactName;
    } else {
      return this.contactIdentity;
    }
  }

  /**
   * Event handler for when the RadListView has completed loading
   * @param e 
   */
  public loadedEvent(e) {
    console.log(`[Message] RadList has been loaded... item count: ${this._dataItems.length}`);
    this.scrollToIndex(this._dataItems.length - 1);
  }

  /**
   * Event when the RadListView has been populated with data
   * @param e 
   */
  public populatedEvent(e) {
    console.log('[Message] RadList has been populated');
  }

  /**
   * Attempts to scroll the `RadListView` to a given `index`.
   * Sets a minimum index to 0. Works with a `setTimeout` due
   * to a reported iOS bug for scrolling.
   * https://github.com/telerik/nativescript-ui-samples/blob/master/listview/app/examples/scroll-to-index/scroll-to-index-initial.ts#L24
   * 
   * @param index The index position to scroll to
   */
  private scrollToIndex(index: number = 0) {
    index = Math.max(0, index); // 0 is minimum index
    clearTimeout(this._timer); // clear any previous scroll timers

    this._timer = setTimeout(() => {
      try {
        console.log('[Message] Scrolling to latest message', index);
        if (this.list) this.list.scrollToIndex(index, false);
        else console.log('no list');
      } catch (err) {
        console.log(`Unable to scroll to index:${index}`);
      }
    }, 100);
  }

  /**
   * Attempts to deliver a local `message` to a remote endpoint for the current
   * contact to fetch.
   */
  public sendMessage() {
    if (this.message.length == 0) {
      return alert(`Please enter a message to send`);
    }

    if (!this._activeAccount) {
      return alert(`Unable to deliver message at this time`);
    }

    try {
      this._activeAccount.sendRemoteMessage(this._contact, this.message)
      .then(() => {
        console.log('[Message] Message delivered successfully');
        this.scrollToIndex(this._dataItems.length - 1);
      }).catch(console.log);

      this.textfield.text = '';
      this.textfield.dismissSoftInput(); // Hide Keyboard. 
    } catch (err) {
      this.textfield.text = '';
      this.textfield.dismissSoftInput(); // Hide Keyboard.
      this.scrollToIndex(this._dataItems.length - 1);

      console.log(`[Message] Something unexpected happened while delivering...`);
      console.log(err.message ? err.message : err);
      alert('Something unexpected occurred while delivering your message, please try again.');
    }
  }

  /**
   * Template rendering method to help determine which template to load for a given
   * `Message`.
   * 
   * @param item The `Message` model
   * @param index The index of the item
   * @param items The array of items
   */
  public messageTemplate(item: Message, index: number, items: any): string {
    if (item.contact_username === item.owner_username) {
      return 'contact';
    } else {
      return 'me';
    }
  }

  /**
   * Menu option methods
   */
  public onPreviousView() {
    if (this._router.canGoBack()) {
      this._router.back();
    } else {
      this._router.navigate(['/messenger'], {
        transition: {
          name: 'slideRight'
        },
      });
    }
  }

  public onEditContact(): void {
    console.log('[Message] Edit contact');
    this._router.navigate(['/contact/edit', this.contactIdentity], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  public onCopyContact(): void {
    console.log('[Message] Copy contact');
    Clipboard.setText(this.contactIdentity)
    .then(async () => {
      try {
        await this._snack.simple(`Copied ${this.contactIdentity} to clipboard!`, '#ffffff', '#333333', 3, false);
      } catch (err) {
        console.log(`[Message] FAILED copying ${this.contactIdentity} to clipboard`);
        console.log(err.message ? err.message : err);
      }
    });
  }

  public onFetchMessages() {
    if (this.IdentityServ.getActiveAccount()) {
      this.IdentityServ.getActiveAccount().fetchRemoteMessages()
      .then(() => {
        console.log('[Message] All messages have been fetched');
      }).catch(console.log);
    } else {
      console.log('[Message] NO ACTIVE ACCOUNT -- UNABLE TO FETCH MESSAGES');
    }
  }
}
