import { Component, OnInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';

import { SnackBar } from '@nstudio/nativescript-snackbar';
import { alert } from 'tns-core-modules/ui/dialogs';
import { OSMClientService } from '~/app/shared/osm-client.service';
import * as app from 'tns-core-modules/application';
import { IdentityService } from '~/app/shared/services/identity.service';
import { Account } from '~/app/shared/models/identity';
import { isAndroid } from 'tns-core-modules/ui/page/page';
import { device } from 'tns-core-modules/platform/platform';

const firebase = require('nativescript-plugin-firebase');
declare var android: any;

export interface IAddContact {
  username: string;
  displayName?: string;
}

@Component({
	moduleId: module.id,
	selector: 'ContactAdd',
	templateUrl: './add.component.html',
	styleUrls: ['./add.component.scss']
})
export class AddComponent implements OnInit {
  public contact: IAddContact;
  public processing: boolean;
  public badUsername: boolean;
  private activeAccount: Account;

	constructor(
    private _router: RouterExtensions,
    private _sb: SnackBar,
    private _osmClient: OSMClientService,
    private Identity: IdentityService
  ) {
    if (isAndroid && device.sdkVersion >= '21') {
      const activity = app.android.startActivity;
      const win = activity.getWindow();
      win.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
    }

    firebase.analytics.setScreenName({
      screenName: 'Contact Add'
    }).then(() => {});
  }

  ngOnInit() {
    this.activeAccount  = this.Identity.getActiveAccount();
    this.processing     = false;
    this.badUsername    = false;

    this.contact = {
      displayName: '',
      username: ''
    };
  }

  async onAddContact() {
    this.badUsername    = false;

    if (this.contact.username === '') {
      this.badUsername = true;
      return alert('An ODIN Identity is required to add another user.');
    } else if (this.contact.username.indexOf('@') < 0) {
      this.badUsername = true;
      return alert("Usernames should include '@', please check and try again.");
    }
    
    this.processing = true;
    this._sb.simple('Fetching contact details', '#ffffff', '#333333', 3, false);

    try { 
      if (await this.activeAccount.hasFriend(this.contact.username)) {
        this.processing = false;
        return alert('This user is already on your local contacts list!');
      }

      let contactDetails = await this._osmClient.fetchContact(this.contact.username);

      if (await this.activeAccount.addFriend(this.contact, contactDetails)) {
        this.processing = false;
        this.contact = {
          displayName: '',
          username: ''
        };
        
        // capture successful contact adding
        this._captureUserAdd();
        alert(`Successfully added ${this.contact.username} to your local contacts!`);
        this._router.navigate(['/messenger']);
      } else {
        this.processing = false;
        return alert(`An error occurred while adding this contact locally, please try again.`);
      }
    } catch (err) {
      console.log('Unable to add remote contact');
      console.log(err.message ? err.message : err);

      this.processing = false;
      this._captureUserAddFailed();
      return alert('The specified user does not exist or the server is currently unavailable. Please check your entered information and try again.');
    }
  }
  
  onPreviousView() {
    this._router.back();
  }

  private _captureUserAdd() {
    firebase.analytics.logEvent({
      key: 'contact_add'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Add Contact'); });
  }

  private _captureUserAddFailed() {
    firebase.analytics.logEvent({
      key: 'contact_add_failed'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Add Contact Failed'); });
  }
}
