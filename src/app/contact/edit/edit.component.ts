import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";

import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { alert, confirm } from "tns-core-modules/ui/dialogs";
import { OSMClientService } from "~/app/shared/osm-client.service";
import * as app from "tns-core-modules/application";
import { IdentityService } from '~/app/shared/services/identity.service';
import { Account } from '~/app/shared/models/identity';
import { isAndroid } from 'tns-core-modules/ui/page/page';
import { device } from 'tns-core-modules/platform/platform';

import * as frame from 'tns-core-modules/ui/frame';
import { ActivatedRoute } from '@angular/router';
import { Contact } from '~/app/shared/models/messenger';

declare var android: any;

export interface IAddContact {
  username: string;
  displayName?: string;
}

@Component({
	moduleId: module.id,
	selector: 'ContactEdit',
	templateUrl: './edit.component.html',
	styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, AfterViewInit {

  public processing: boolean;
  public badUsername: boolean;

  public contact: Contact;

  private activeAccount: Account;
  private contactUsername: string;
  private contactCopy: Contact;
  private contactSaved: boolean;

	constructor(
    private _router: RouterExtensions,
    private _route: ActivatedRoute,
    private _snack: SnackBar,
    private _IdentityServ: IdentityService
  ) {
    this.contact = new Contact();
    this.contactSaved = false;

    this._route.params
    .subscribe(params => {
      if (!params.hasOwnProperty('contactUsername')) {
        alert("Something went wrong while loading the requested contact");
        this._router.navigate(['/messenger']);
        return;
      }

      this.contactUsername = params['contactUsername'];
    });
    
    if (isAndroid && device.sdkVersion >= '21') {
      const activity = app.android.startActivity;
      const win = activity.getWindow();
      win.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
    }
  }

  ngOnInit(): void {
    this.activeAccount  = this._IdentityServ.getActiveAccount();
    this.processing     = false;
    this.badUsername    = false;
  }

  ngAfterViewInit(): void {
    this.findMatchingContact(this.contactUsername)
    .then(contact => {
      this.contact      = contact;
      this.contactCopy  = new Contact(contact);
    })
    .catch(err => {
      console.log(`[Edit] Cannot load contact details for ${this.contactUsername}`);
      console.log(err.message ? err.message : err);
      
      this._router.navigate(['/messenger'], {
        clearHistory: true,
        queryParams: {
          error: `Unable to load contact details for ${this.contactUsername}`
        }
      });
    });
  }

  public onSaveContact(): void {
    if (this.processing) return;
    if (this.hasModifiedContact()) this.contactSaved = false;

    this.processing = true;

    this.contact.save()
    .then(saved => {
      this.processing   = false;
      this.contactSaved = true;
      console.log('[Edit] contact saved!');
      this._snack.simple('Contact updated!', '#ffffff', '#333333', 3, false);
    })
    .catch(err => {
      this.processing = false;
      console.log('[Edit] contact save error!');
      console.log(err.message ? err.message : err);
      this._snack.simple('Something went wrong while updating your contact', '#ffffff', '#333333', 3, false);
    });
  }

  private async findMatchingContact(contactUsername: string) {
    const account = this._IdentityServ.getActiveAccount();
    if (!account.contacts.length) await account.loadContacts();

    const matchingContact = account.contacts.find(c => {
      return c.username === contactUsername;
    });

    if (matchingContact) return Promise.resolve(matchingContact);
    else return Promise.reject('missing contact');
  }
  
  public onPreviousView() {
    if (this.hasModifiedContact() && !this.contactSaved) {
      confirm('You have unsaved changes to this contact, would you like to save?')
      .then(save => {

        if (save) {
          this.contact.save()
          .then(saved => {
            console.log('[Edit] contact saved!');
            this._snack.simple('Contact updated!', '#ffffff', '#333333', 3, false);
            this.navigateBack(true);
          })
          .catch(err => {
            console.log('[Edit] contact save error!');
            console.log(err.message ? err.message : err);
            this._snack.simple('Something went wrong while updating your contact', '#ffffff', '#333333', 3, false);
          });
        } else {
          this.contact.name = this.contactCopy.name;
          this.navigateBack();
        }
      });
    } else if (this.hasModifiedContact() && this.contactSaved) {
      this.navigateBack(true);
    } else {
      this.navigateBack();
    }
  }

  private hasModifiedContact() {
    return (this.contactCopy.name !== this.contact.name);
  }

  private navigateBack(hardNavigate?: boolean) {
    if (!hardNavigate) {
      this._router.back();
    } else {
      this._router.navigate(['/messenger/message/', this.contact.username], {
        clearHistory: true,
        transition: {
          name: 'slideRight'
        },
      });
    }
  }
}