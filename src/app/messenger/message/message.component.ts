import { Component, OnInit, AfterViewInit, ViewChild, ElementRef  } from '@angular/core';
import { PageRoute } from "nativescript-angular/router";
import { RouterExtensions } from "nativescript-angular/router";
// import { switchMap } from "rxjs/operators";
import { ActivatedRoute } from '@angular/router';
import { alert } from "tns-core-modules/ui/dialogs";
import * as app from "application";

import { ObservableArray, ChangedData } from "tns-core-modules/data/observable-array";

// import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { ListView } from 'ui/list-view';
import { TextField } from 'ui/text-field';
// import { ScrollView } from 'ui/scroll-view';
import { Page } from "ui/page"
import { UserModel } from '~/app/shared/user.model';

import { displayedEvent, exitEvent, launchEvent, lowMemoryEvent, 
  orientationChangedEvent, resumeEvent, suspendEvent, uncaughtErrorEvent, 
  ApplicationEventData, LaunchEventData, OrientationChangedEventData, UnhandledErrorEventData,
  on as applicationOn, run as applicationRun } from "tns-core-modules/application";

let ipsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In vel nibh eu massa tempus mattis. Cras sit amet tempus sem. Morbi tristique augue quis arcu malesuada gravida. Maecenas maximus ornare congue. Vestibulum tellus diam, tempor eget blandit eget, vulputate id odio.';

declare var android: any;

@Component({
	moduleId: module.id,
	selector: 'message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {
  public contactIdentity: string;
  public contactIdentityShort: string;
  public contactMessages: ObservableArray<any>; //any[];
  public message: string;
    
  @ViewChild("list") lv: ElementRef;
  @ViewChild("textfield") tf: ElementRef;

  list: ListView;
  textfield: TextField;

	constructor(
    private _page: PageRoute,
    private _router: RouterExtensions,
    private _route: ActivatedRoute,
    private page: Page,
    private _user: UserModel
  ) {

    // load route params...
    this._route.params
    .subscribe(params => {
      console.log('GOT route params', params);
      if (params.hasOwnProperty('contactId')) {
        this.contactIdentity = params['contactId'];
        this.contactIdentityShort = this.contactIdentity[0].toUpperCase();
      } else {
        alert("Something went wrong while loading the requested messages.");
        this._router.navigate(['/messenger']);
      }
    });

    // load query params (if any)...
    this._route.queryParams
    .subscribe(params => {
      console.log('GOT params', params);
    });

    this.page.on("loaded", (args) => {
      var window = app.android.startActivity.getWindow();
      window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    });

    applicationOn(suspendEvent, (args: ApplicationEventData) => {
      // For Android applications, args.android is an android activity class.
      if (args.android) console.log("SUSPEND Activity: " + args.android);
      else if (args.ios) console.log("UIApplication: " + args.ios);
    });

    applicationOn(resumeEvent, (args: ApplicationEventData) => {
      if (args.android) {
        console.log("RESUME Activity: " + args.android);
        var window = app.android.startActivity.getWindow();
        window.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
      }
    });
  }

  ngOnInit() {
    console.log(`MessageView... Loading Contact ${this.contactIdentity}`);
    
    // load local messages for contact as observablearray
    this.contactMessages = this._user.loadLocalContact(this.contactIdentity);

    // subscribe to new messages for the hell of it (test)
    this._user.on(`NewMessage_${this.contactIdentity}`, function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
    });
  }

  ngAfterViewInit() {
    this.list = this.lv.nativeElement;
    this.textfield = this.tf.nativeElement;    
  }

  scroll(count:number) {
    console.log(`MessageView... Scrolling to: ${count}`);

    this.list.scrollToIndex(count - 1);
    this.list.refresh();
  }

  /**
   * Send a message to the current loaded contact
   * 
   * @param message Plaintext message to encrypt, encode, and push forward
   */
  async chat(message: string) {

    if(message.length == 0) {
      // Empty messages should not be sent. 
      alert('Make sure you have entered a message');
    } else {
      try {
        if (await this._user.sendMessage(this.contactIdentity, message)) {
          this.scroll(this.list.items.length);
          this.textfield.text = '';
          this.textfield.dismissSoftInput(); // Hide Keyboard. 
        } else {
          console.log(`MessageView... Something went wrong while delivering...`);
        }
      } catch (err) {
        console.log(`MessageView... Something unexpected happened while delivering...`);
        console.log(err.message ? err.message : err);
        alert('Something unexpected occurred while delivering your message, please try again.');
      }

    }

  }

  // ***
  //  View helper methods
  // ***
  filter(senderIdentity: string) {
    if (senderIdentity === 'me') return "me";
    return "them";
  }

  align(senderIdentity: string) {
    if (senderIdentity === 'me') return "right";
    return "left";
  }

  showImage(senderIdentity: string) {
    if (senderIdentity === 'me') return "collapsed";
    return "visible";
  }
  
  // ***
  //  ActionBar Action Methods
  // ***

  onPreviousView() {
    this._router.back();
  }

  onEditContact() {
    alert('This feature is not available yet!');
  }

  onDeleteContact() {
    alert('This feature is not available yet!');
  }

  onFetchMessages() {
    this._user.fetchMessages();
  }
}
