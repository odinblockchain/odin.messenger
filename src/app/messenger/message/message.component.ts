import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy  } from '@angular/core';
import { PageRoute } from "nativescript-angular/router";
import { RouterExtensions } from "nativescript-angular/router";
// import { switchMap } from "rxjs/operators";
import { ActivatedRoute } from '@angular/router';
import { alert } from "tns-core-modules/ui/dialogs";
// import * as app from "application";
import { ObservableArray } from "tns-core-modules/data/observable-array";

// import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
// import { ListView, ItemEventData } from 'ui/list-view';
import { TextField } from 'ui/text-field';
// import { ScrollView } from 'ui/scroll-view';
// import { Page } from "ui/page"
// import { UserModel } from '~/app/shared/user.model';

// import { displayedEvent, exitEvent, launchEvent, lowMemoryEvent, 
//   orientationChangedEvent, resumeEvent, suspendEvent, uncaughtErrorEvent, 
//   ApplicationEventData, LaunchEventData, OrientationChangedEventData, UnhandledErrorEventData,
//   on as applicationOn, run as applicationRun } from "tns-core-modules/application";
// import { ContactService } from '~/app/shared/services';
import { Contact, Message } from '~/app/shared/models/messenger';
import { IdentityService } from '~/app/shared/services/identity.service';
// import { Subscription, Observable } from 'rxjs';
import { Account } from '~/app/shared/models/identity';
import { RadListView } from 'nativescript-ui-listview';
// import { topmost } from 'tns-core-modules/ui/frame/frame';

declare var android: any;

@Component({
	moduleId: module.id,
	selector: 'message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit, AfterViewInit, OnDestroy {//, OnDestroy {
  @ViewChild("listView") lv: ElementRef;
  @ViewChild("textfield") tf: ElementRef;

  list: RadListView;
  textfield: TextField;

  // v1 message pulling leftovers
  // public contactMessages: any;//ObservableArray<any>; //any[];
  // public contactMessages$: Observable<Data>;
  // private contactMessageSub: Subscription;

  public contactIdentity: string;
  public message: string;

  private _activeAccount: Account;
  private _contact: Contact;
  private _dataItems: ObservableArray<any>;
  private _timer: any;

  constructor(
    private _page: PageRoute,
    private _router: RouterExtensions,
    private _route: ActivatedRoute,
    private IdentityServ: IdentityService
  ) {

    // this.contactMessages = [];
    // this.contactMessages$ = new Observable(); //new ObservableArray();

    this._route.params
    .subscribe(params => {
      console.log('GOT route params', params);
      if (params.hasOwnProperty('contactId')) {
        this.contactIdentity = params['contactId'];
      } else {
        alert("Something went wrong while loading the requested messages.");
        this._router.navigate(['/messenger']);
      }
    });

    this.message = '';
    this.sendMessage = this.sendMessage.bind(this);

    // load query params (if any)...
    // this._route.queryParams
    // .subscribe(params => {
    //   console.log('GOT params', params);
    // });

    // this.page.on("loaded", (args) => {
    //   var window = app.android.startActivity.getWindow();
    //   window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    // });

    // applicationOn(suspendEvent, (args: ApplicationEventData) => {
    //   // For Android applications, args.android is an android activity class.
    //   if (args.android) console.log("SUSPEND Activity: " + args.android);
    //   else if (args.ios) console.log("UIApplication: " + args.ios);
    // });

    // applicationOn(resumeEvent, (args: ApplicationEventData) => {
    //   if (args.android) {
    //     console.log("RESUME Activity: " + args.android);
    //     var window = app.android.startActivity.getWindow();
    //     window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    //   }
    // });
  }

  ngOnDestroy() {
    console.log('Cleaning up Message View...');
    // if (this.contactMessageSub) {
    //   this.contactMessageSub.unsubscribe();
    // }
  }

  ngOnInit() {
    console.log(`MessageView... Loading Contact ${this.contactIdentity}`);
    
    // this.ContactServ.findContact(this.contactIdentity);
    // this.IdentityServ.activeAccount.fetchMessages(this.IdentityServ.activeAccount.client)
    
    if (this.IdentityServ.getActiveAccount()) {
      this._activeAccount = this.IdentityServ.getActiveAccount();
      this._contact = this.IdentityServ.getActiveAccount().findContact(this.contactIdentity);

      if (this._contact) {
        // this.contactMessageSub = this.contact.messages$.subscribe(value => {
        //   // console.log('subscribed!');
        //   this.contactMessages.push(value);
        //   // console.log('NEW MESSAGE', value);
        // });

        this._dataItems = this._contact.oMessages$;
      } else {
        console.log('Unable to load contact');
        this._dataItems = new ObservableArray();
        console.log(this.IdentityServ.getActiveAccount().contacts);
      }
    } else {
      console.log('IdentityService missing active account');
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

  /**
   * Event handler for when the RadListView has completed loading
   * @param e 
   */
  public loadedEvent(e) {
    console.log(`List has been loaded... item count: ${this._dataItems.length}`);
    this.scrollToIndex(this._dataItems.length - 1);
  }

  /**
   * Event when the RadListView has been populated with data
   * @param e 
   */
  public populatedEvent(e) {
    console.log('List has been populated');
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
        console.log('attempting to scroll', index);
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
        console.log('Message sent successfully');
        this.scrollToIndex(this._dataItems.length - 1);
      }).catch(console.log);

      this.textfield.text = '';
      this.textfield.dismissSoftInput(); // Hide Keyboard. 
    } catch (err) {
      this.textfield.text = '';
      this.textfield.dismissSoftInput(); // Hide Keyboard.
      this.scrollToIndex(this._dataItems.length - 1);

      console.log(`MessageView... Something unexpected happened while delivering...`);
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
    this._router.back();
  }

  public onEditContact() {
    alert('This feature is not available yet!');
  }

  public onDeleteContact() {
    alert('This feature is not available yet!');
  }

  public onFetchMessages() {
    if (this.IdentityServ.getActiveAccount()) {
      this.IdentityServ.getActiveAccount().fetchRemoteMessages()
      .then(() => {
        console.log('All messages have been fetched');
      }).catch(console.log);
    } else {
      console.log('NO ACTIVE ACCOUNT -- UNABLE TO FETCH MESSAGES');
    }
  }
}
