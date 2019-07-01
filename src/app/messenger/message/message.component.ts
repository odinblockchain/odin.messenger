import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, NgZone  } from '@angular/core';
import { PageRoute } from 'nativescript-angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { ActivatedRoute } from '@angular/router';
import { alert, confirm } from 'tns-core-modules/ui/dialogs';
import { ObservableArray } from 'tns-core-modules/data/observable-array';

import * as Clipboard from 'nativescript-clipboard';
import { TextField } from 'tns-core-modules/ui/text-field';
import { Contact, Message } from '~/app/shared/models/messenger';
import { IdentityService } from '~/app/shared/services/identity.service';
import { Account } from '~/app/shared/models/identity';
import { RadListView } from 'nativescript-ui-listview';
import { SnackBar } from 'nativescript-snackbar';
import { Page } from 'tns-core-modules/ui/page/page';
import { Subscription } from 'rxjs';

const firebase = require('nativescript-plugin-firebase');

@Component({
	moduleId: module.id,
	selector: 'message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit, AfterViewInit {
  @ViewChild('listView') lv: ElementRef;
  @ViewChild('textfield') tf: ElementRef;

  list: RadListView;
  textfield: TextField;

  public contactIdentity: string;
  public contactName: string;
  public message: string;
  public actionBoxActive: boolean;

  public subItems: Message[] = [];
  private _sub: Subscription;

  private _activeAccount: Account;
  private _contact: Contact;
  private _timer: any;
  private _onNavigateEdit: boolean = false;

  constructor(
    private _page: Page,
    private _router: RouterExtensions,
    private _route: ActivatedRoute,
    private _snack: SnackBar,
    private IdentityServ: IdentityService
  ) {
    this.actionBoxActive = false;

    this._route.params
    .subscribe(params => {
      if (!params.hasOwnProperty('contactId')) {
        alert('Something went wrong while loading the requested messages.');
        this._router.navigate(['/messenger']);
        return;
      }

      this.contactIdentity = params['contactId'];
    });

    this._page.on(Page.unloadedEvent, event => {
      this.ngOnDestroy();
    });

    this.message = '';
    // this.sendMessage = this.sendMessage.bind(this);

    firebase.analytics.setScreenName({
      screenName: 'Messenger Conversation'
    }).then(() => {});
  }

  ngOnDestroy() {
    this._sub.unsubscribe();
  }

  ngOnInit() {
    console.log(`[Message] Loading Contact ${this.contactIdentity}`);
    if (this._onNavigateEdit) {
      console.log('coming from edit!');
      this._onNavigateEdit = false;
    }
    
    if (!this.IdentityServ.getActiveAccount()) {
      console.log('[Message] IdentityService missing active account');
      this.subItems = [];
      return;
    }
    
    this._activeAccount = this.IdentityServ.getActiveAccount();
    this._contact = this.IdentityServ.getActiveAccount().findContact(this.contactIdentity);

    if (this._contact) {
      this._sub = this._contact.messageList$.subscribe(messages => {
        this.subItems = messages; 
      });

      this.contactName = this._contact.name ? this._contact.name : this._contact.username;
    } else {
      console.log('[Message] Unable to load contact');
      this.subItems = [];
      console.log(this.IdentityServ.getActiveAccount().contacts);
    }

    // try {
    //   console.log('ADD MOCK MESSAGE');
    //   this._contact.saveMockMessage('sample sample sample')
    //   .then(() => console.log('saved!!'))
    //   .catch(err => console.log('bad save', err));
    // } catch (err) {
    //   console.log('bad mock', err);
    // }
  }

  ngAfterViewInit() {
    this.textfield = this.tf.nativeElement;
    this.list = this.lv.nativeElement;
  }

  /**
   * Event handler for when the RadListView has completed loading
   * @param e 
   */
  public loadedEvent(e) {
    console.log(`[Message] RadList has been loaded... item count: ${this.subItems.length}`);
    this.scrollToIndex(this.subItems.length - 1);
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
  public sendMessage = () => {
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
        this.scrollToIndex(this.subItems.length - 1);

        // capture the event of a message being sent and the length for
        // an anonymous bucket
        this._captureMessageSend(this.message.length);
      }).catch(console.log);

      this.textfield.text = '';
      this.textfield.dismissSoftInput(); // Hide Keyboard. 
    } catch (err) {
      this.textfield.text = '';
      this.textfield.dismissSoftInput(); // Hide Keyboard.
      this.scrollToIndex(this.subItems.length - 1);

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

  public onLongPressMessage(item: Message) {
    console.log('[Message] onLongPressMessage', item);
    if (item.message && item.message.length) {
      this.actionBoxActive = !this.actionBoxActive;

      // capture event of user long-pressing to copy a message
      this._captureMessageCopied();

      Clipboard.setText(item.message)
      .then(() => {
        try {
          this._snack.simple(`Copied message to clipboard!`, '#ffffff', '#333333', 3, false);
        } catch (err) {
          console.log(`[Message] FAILED copying item.message to clipboard`);
          console.log(err.message ? err.message : err);
        }
      });
    }
  }

  public onTapMessage = (item: Message) => {
    if (!item) return;
    item.shouldDisplayTime = !item.shouldDisplayTime;
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
    this._onNavigateEdit = true;
    this._router.navigate(['/contact/edit', this.contactIdentity], {
      transition: {
        name: 'slideLeft'
      }
    });
  }

  public async onDeleteMessages(): Promise<void> {
    console.log('[Message] Edit contact');
    const confirmAction = await confirm(`Are you sure you want to delete all saved messages for ${this.contactName}?`);
    if (!confirmAction) return;

    this._captureConversationDelete();
    if (await this._contact.deleteAllMessages()) {
      this._snack.simple(`Deleted all messages with ${this.contactName}`, '#ffffff', '#333333', 3, false);
      this._router.navigate(['/messenger'], {
        transition: {
          name: 'slideRight'
        }
      });
    }
    return;
  }

  public onCopyContact(): void {
    console.log('[Message] Copy contact');
    this._captureCopyFriendUsername();

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

  private _captureConversationDelete() {
    firebase.analytics.logEvent({
      key: 'messenger_delete_conversation'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Messenger Delete Conversation'); });
  }

  private _captureMessageSend(messageLength: number) {
    const messageBuckets = [
      { small:      [0, 20]     },
      { medium:     [21, 50]    },
      { standard:   [51, 140]   },
      { long:       [141, 200]  },
      { wideload:   [201, 9999] }
    ];

    const bucket = messageBuckets.filter(b => {
      const range = Object.values(b)[0];
      return (messageLength > range[0] && messageLength < range[1]);
    });

    firebase.analytics.logEvent({
      key: 'share',
      parameters: [
        {
          key: 'method',
          value: 'message'
        },
        {
          key: 'content_type',
          value: bucket ? Object.keys(bucket)[0] : 'unknown'
        }
      ]
    })
    .then(() => { console.log('[Analytics] Metric logged >> Message Sent'); });
  }

  private _captureMessageCopied() {
    firebase.analytics.logEvent({
      key: 'messenger_copy_message'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Messenger Copy Message'); });
  }

  private _captureCopyFriendUsername() {
    firebase.analytics.logEvent({
      key: 'messenger_copy_friend'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Messenger Copy Friend'); });
  }
}
