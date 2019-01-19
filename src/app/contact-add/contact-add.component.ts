import { Component, OnInit } from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";

import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { alert } from "tns-core-modules/ui/dialogs";
import { OSMClientService } from "~/app/shared/osm-client.service";
import { UserModel } from "~/app/shared/user.model";

export interface IAddContact {
  identity: string;
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

	constructor(
    private _router: RouterExtensions,
    private _sb: SnackBar,
    private _osmClient: OSMClientService,
    private _user: UserModel
  ) { }

  ngOnInit() {
    this.processing = false;
    this.contact = {
      displayName: 'Demo Account1',
      identity: ''
    };
  }

  async onAddContact(contact: IAddContact) {
    if (this.contact.identity === '') {
      return alert("An OSM Identity is required to add another user.");
    } else if (this.contact.identity.indexOf('@') < 0) {
      return alert("You've entered an invalid OSM Identity, please check and try again.");
    }
    
    this.processing = true;
    this._sb.simple('Fetching contact details', '#ffffff', '#333333', 3, false);

    try { 
      if (await this._user.hasFriend(this.contact.identity)) {
        this.processing = false;
        return alert("This user is already on your local contacts list!");
      }

      let contactDetails = await this._osmClient.fetchContact(this.contact.identity);

      if (await this._user.addFriend(contactDetails, this.contact.displayName)) {
        this.processing = false;
        this.contact = {
          displayName: '',
          identity: ''
        };
  
        return alert(`Successfully added ${this.contact.identity} to your local contacts!`);
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
