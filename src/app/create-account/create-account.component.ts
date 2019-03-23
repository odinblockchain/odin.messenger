import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Observable, Page, PropertyChangeData } from "tns-core-modules/ui/page/page";
import Seeder from '~/app/lib/Seeder'
import SecureRandom from '~/app/lib/SecureRandom'
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { confirm } from "tns-core-modules/ui/dialogs";
import * as utilityModule from "utils/utils";
import { UserModel } from '~/app/shared/user.model';
import { GestureTypes, TouchGestureEventData } from "tns-core-modules/ui/gestures";
import { IdentityService } from '../shared/services/identity.service';
import { AccountService } from '../shared/services';
import { Identity } from '../shared/models/identity/identity.model';
import { Account } from '../shared/models/identity';
import { Client } from '../shared/models/messenger/client.model';
import { ClientService } from '../shared/services/client.service';

@Component({
	moduleId: module.id,
	selector: 'create-account',
	templateUrl: './create-account.component.html',
	styleUrls: ['./create-account.component.css']
})
export class CreateAccountComponent implements OnInit {
  @ViewChild('scrollViewGenerate') scrollViewGenerate: ElementRef;

  public seeder : Seeder;
  public secureRandom = new SecureRandom();

  public activeStep: number;

  private _sb: any;

  private hasVerifiedBackup: boolean;
  public verifyBackupPhrase: string;

  public mnemonicSaved: boolean;
  public identity: Identity;

  // public user;

	constructor(
    private page: Page,
    // private userModel: UserModel,
    private Identity: IdentityService,
    private Account: AccountService,
    private Client: ClientService) {
    this.page.actionBarHidden = true;
    this.useSeed = this.useSeed.bind(this);
  }

	ngOnInit(): void {
    this._sb = new SnackBar();
    this.verifyBackupPhrase = '';
    this.mnemonicSaved = false;
    this.hasVerifiedBackup = false;
    this.activeStep = 1;
    this.identity = this.Identity.identity;

    // this.user = this.userModel;
    // this.user.addEventListener(Observable.propertyChangeEvent, this.onAccountUpdate);

    this.seeder = new Seeder();

    console.log('CHECK USERMODEL FOR SAVEDATA');

    // if (this.user.saveData.mnemonicPhrase != '') {
    if (this.Identity.identity.mnemonicPhrase != '') {
      console.log('>> USING SAVEDATA');
      this.seeder.poolFilled = true;
      this.seeder.complete();
      this.activeStep = 2;
    } else {
      this.seeder.on('complete', (eventData) => {
        console.log('>> Master seed generation complete');
        this.useSeed(this.seeder.sha256Seed());
      });
    }
  }

  /**
   * Use the provided `seedHex` that was generated with random entropy provided by the user
   * to initialize the app in stages:
   * 
   * > Create primary identity (appStorage) for app (identities can have multiple accounts)
   * > Create primary account (db) based on `mnemonicPhrase` and starting `bip44_index`
   * > Create signal client (db) based on account details
   * > Update primary account to link signal client
   * 
   * Move to Step #2 (Display mnemonic phrase)
   * 
   * @param seedHex 
   */
  private async useSeed(seedHex?: string) {
    // await this.user.onSaveMasterSeed(seedHex);
    this.Identity.saveMasterseed(seedHex)
    .then((id: Identity) => {
      console.log('>>> IDENTITY', id);
      return this.Account.createAccountFromMnemonic(id.mnemonicPhrase, 0);
    })
    .then((account: Account) => {
      console.log('>>> ACCOUNT', account);

      return this.Client.createClient(new Client({
        account_username: account.username,
        identity_key_pair: '',
        signed_pre_key: '',
        pre_keys: []
      }));
    })
    .then((client: Client) => {
      console.log('>>> CLIENT', client);
    })
    .catch(console.log);
    this.mnemonicSaved = true;
  }

  /**
   * View Actions
   */

  onAdvanceStep = async function(stepNumber: number) {
    console.log(`advance::${stepNumber}`);

    if (stepNumber === 4) {
      console.log('entered phrase:', this.verifyBackupPhrase);
      
      await this.onVerifyBackup();
      if (this.hasVerifiedBackup === true) {
        this.activeStep = stepNumber;
      }
    } else {
      this.activeStep = stepNumber;
    }
  }

  onRegisterAccount() {
    this.Identity.onRegisterUser();
  }

  onAccountUpdate(args: PropertyChangeData) {
    console.dir(this);
    // args is of type PropertyChangeData
    if (args.eventName === 'propertyChange') {
      if (args.propertyName === 'mnemonicPhrase') {
        console.log('SET STEP2');
        // this.activeStep = 2;
      }
    }

    console.log('onAccountModelUpdate', {
      eventName: args.eventName,
      propertyName: args.propertyName,
      newValue: args.value,
      oldValue: args.oldValue
    });
  }

  onTouch(args: TouchGestureEventData) {
    if (!this.seeder.poolFilled) {
      this.seeder.seed(args.getX(), args.getY())
    }
  }

  onVerifyBackup = async function() {
    console.log('ON RETURN PRESS');
    if (this.verifyBackupPhrase.toLowerCase() === this.Identity.mnemonicPhrase.toLowerCase()) {
      this.hasVerifiedBackup = true;
      this._sb.simple('You have verified your mnemonic phrase!', '#ffffff', '#333333', 3, false);
      return true;
    } else {
      this.hasVerifiedBackup = false;
      this._sb.simple('The mnemonic phrase entered was incorrect! Please check spelling and word placement.', '#ffffff', '#333333', 3, false);
      return false;
    }
  }

  onSkipVerifyMnemonic() {
    confirm({
      title: "Skip Backup Verification?",
      message: "While we are unable to restore your account whether you verify or not, this ensures you have the correct mnemonic phrase backed up. Are you sure you wish to skip?",
      okButtonText: "Yes",
      cancelButtonText: "No",
      neutralButtonText: "Go Back"
    })
    .then((result: boolean) => {
      if (result === true) {
        this.hasVerifiedBackup = true;
        this.activeStep = 4;
      }
    });
  }

  onCopyText(text: string) {
    let sb = this._sb;
    Clipboard.setText(text)
    .then(async function() {
      try {
        await sb.simple('Copied to clipboard!', '#ffffff', '#333333', 3, false);
        console.log('Clipboard success');
      } catch (err) {
        console.log('Unable to copy to clipboard');
      }
    });
  }

  openTos() {
    utilityModule.openUrl('https://odinblockchain.org/messenger-terms-of-service');
  }

  openPrivacy() {
    utilityModule.openUrl('https://odinblockchain.org/messenger-privacy-policy');
  }
}
