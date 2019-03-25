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

  public seeder: Seeder;
  public secureRandom: SecureRandom;
  public activeStep: number;

  private _sb: any;

  private hasVerifiedBackup: boolean;
  public verifyBackupPhrase: string;

  public mnemonicSaved: boolean;

  public identity: Identity;
  public primaryAccount: Account;
  public primaryClient: Client;

  // public user;

	constructor(
    private page: Page,
    // private userModel: UserModel,
    private IdentityServ: IdentityService,
    private AccountServ: AccountService,
    private ClientServ: ClientService
  ) {
    this._sb = new SnackBar();
    this.verifyBackupPhrase = '';
    this.mnemonicSaved = false;
    this.hasVerifiedBackup = false;
    this.activeStep = 1;
    this.page.actionBarHidden = true;

    this.identity       = this.IdentityServ.identity;
    this.primaryAccount = new Account();
    this.primaryClient  = new Client();

    this.useSeed = this.useSeed.bind(this);
    this.onAdvanceStep = this.onAdvanceStep.bind(this);
  }

	ngOnInit(): void {
    console.log(this.primaryAccount.registered);
    console.log('CHECK USERMODEL FOR SAVEDATA', this.identity);

    // if (this.user.saveData.mnemonicPhrase != '') {
    if (this.identity.mnemonicPhrase != '') {
      this.primaryAccount = this.AccountServ.accounts[0];
      this.primaryClient  = this.ClientServ.findClientById(this.primaryAccount.client_id);
      console.log('PRIMARY', this.primaryAccount.serialize());
      console.log('CLIENT', this.primaryClient.serialize());

      this.onAdvanceStep(2);
    } else {
      this.secureRandom   = new SecureRandom();
      this.seeder         = new Seeder();

      console.log('>> USING SEEDER');
      this.seeder.poolFilled = false;
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
    this.IdentityServ.saveMasterseed(seedHex)
    .then((id: Identity) => this.AccountServ.createAccountFromMnemonic(id.mnemonicPhrase, 0))
    .then((account: Account) => {
      this.primaryAccount = account;
      return this.ClientServ.createClient(new Client({ account_username: account.username }))
    })
    .then((client: Client) => {
      this.primaryClient = client;
      this.primaryAccount.client_id = client.id;
      return this.primaryAccount.save();
    })
    .then(() => {
      this.mnemonicSaved = true;
    })
    .catch(console.log);
  }

  private onVerifyBackup = async function(): Promise<boolean> {
    const phraseInput = this.verifyBackupPhrase && this.verifyBackupPhrase.length
                          ? this.verifyBackupPhrase.toLowerCase()
                          : '';

    console.log('ON RETURN PRESS', phraseInput, this.identity.mnemonicPhrase);

    if (phraseInput === this.identity.mnemonicPhrase.toLowerCase()) {
      this.hasVerifiedBackup = true;
      this._sb.simple('You have verified your mnemonic phrase!', '#ffffff', '#333333', 3, false);
      return true;
    } else {
      this.hasVerifiedBackup = false;
      this._sb.simple('The mnemonic phrase entered was incorrect! Please check spelling and word placement.', '#ffffff', '#333333', 3, false);
      return false;
    }
  }

  /**
   * View Actions
   */

  public onAdvanceStep = async function(stepNumber: number): Promise<void> {
    console.log(`advance::${stepNumber}`);
    if (stepNumber === 2) {
      delete this.seeder;
      delete this.secureRandom;
    }

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

  public onTouchEntropy(args: TouchGestureEventData) {
    if (!this.seeder.poolFilled) {
      this.seeder.seed(args.getX(), args.getY())
    }
  }

  public onRegisterAccount() {
    this.AccountServ.registerAccount(this.primaryAccount, this.primaryClient)
    .then()
    .catch(console.log);
  }

  public onSkipVerifyMnemonic() {
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

  public onCopyText(text: string) {
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

  public openTos() {
    utilityModule.openUrl('https://odinblockchain.org/messenger-terms-of-service');
  }

  public openPrivacy() {
    utilityModule.openUrl('https://odinblockchain.org/messenger-privacy-policy');
  }
}
