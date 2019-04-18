import { Component, OnInit } from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";

import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { alert } from "tns-core-modules/ui/dialogs";
import { OSMClientService } from "~/app/shared/osm-client.service";
// import { UserModel } from "~/app/shared/user.model";
import { IdentityService } from '../shared/services/identity.service';
import { Account } from '../shared/models/identity';

export interface IAddContact {
  username: string;
  displayName?: string;
}

@Component({
	moduleId: module.id,
	selector: 'contact-add',
	templateUrl: './contact-add.component.html',
	styleUrls: ['./contact-add.component.css']
})
export class ContactAddComponent implements OnInit {
  public contact: IAddContact;
  public processing: boolean;
  private activeAccount: Account;

	constructor(
    private _router: RouterExtensions,
    private _sb: SnackBar,
    private _osmClient: OSMClientService,
    // private _user: UserModel,
    private Identity: IdentityService
  ) { }

  ngOnInit() {
    this.activeAccount = this.Identity.getActiveAccount();
    this.processing = false;
    this.contact = {
      displayName: '',
      username: ''
    };
  }

  async onAddContact(contact: IAddContact) {
    if (this.contact.username === '') {
      return alert("An ODIN Identity is required to add another user.");
    } else if (this.contact.username.indexOf('@') < 0) {
      return alert("Usernames should include '@', please check and try again.");
    }
    
    this.processing = true;
    this._sb.simple('Fetching contact details', '#ffffff', '#333333', 3, false);

    try { 
      if (await this.activeAccount.hasFriend(this.contact.username)) {
        this.processing = false;
        return alert("This user is already on your local contacts list!");
      }

      let contactDetails = await this._osmClient.fetchContact(this.contact.username);

      if (await this.activeAccount.addFriend(this.contact, contactDetails)) {
        this.processing = false;
        this.contact = {
          displayName: '',
          username: ''
        };
  
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
      return alert("The specified user does not exist or the server is currently unavailable. Please check your entered information and try again.");
    }
  }
  
  onPreviousView() {
    this._router.back();
  }
}
