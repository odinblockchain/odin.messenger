import { Component, OnInit } from '@angular/core';
import { Observable, Page, PropertyChangeData } from "tns-core-modules/ui/page/page";
import Seeder from '../Seeder'
import SecureRandom from '../SecureRandom'
// import { ODIN } from '../walletbundle2'
import { Buffer } from 'buffer';
import { Obsidian } from '../bundle.obsidian.js';
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar, SnackBarOptions } from "nativescript-snackbar";
import { confirm } from "tns-core-modules/ui/dialogs";
import Hashids from 'hashids';
// import { AccountService, UserModel } from "../shared";

import { AccountService } from '../shared/account.service';
import { UserModel } from '../shared/user.model';

// import * as randomBytes from 'nativescript-randombytes';
import randomBytes from '../lib/randombytes-native';
// import * as randomBytes from 'nativescript-randombytes';
// import * as randomBytes from 'nativescript-randombytes';
import * as bcrypt from '../lib/bcrypt';

import { isAndroid, isIOS, device, screen } from "tns-core-modules/platform";

import { GestureTypes, TouchGestureEventData } from "tns-core-modules/ui/gestures";
import {
  getBoolean,
  setBoolean,
  getNumber,
  setNumber,
  getString,
  setString,
  hasKey,
  remove,
  clear
} from "tns-core-modules/application-settings";
import { StorageService } from '../shared';

@Component({
	moduleId: module.id,
	selector: 'create-account',
	templateUrl: './create-account.component.html',
	styleUrls: ['./create-account.component.css']
})

export class CreateAccountComponent implements OnInit {
  public seeder : Seeder;
  public secureRandom = new SecureRandom();

  public activeStep: number;

  private _sb: any;

  private hasVerifiedBackup: boolean;
  public verifyBackupPhrase: string;

  public mnemonicSaved: boolean;
  
  public user;

	constructor(
    private page: Page,
    private accountService: AccountService,
    private storage: StorageService,
    private userModel: UserModel) {
    this.page.actionBarHidden = true;
  }

	ngOnInit(): void {
    // clear();

    this._sb = new SnackBar();
    this.verifyBackupPhrase = '';
    this.mnemonicSaved = false;
    this.hasVerifiedBackup = false;
    this.activeStep = 1;

    this.user = this.userModel;
    this.user.addEventListener(Observable.propertyChangeEvent, this.onAccountUpdate);

    this.seeder = new Seeder();

    console.log('CHECK USERMODEL FOR SAVEDATA');

    if (this.user.saveData.mnemonicPhrase != '') {
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

  useSeed = async function(seedHex?: string) {
    await this.user.onSaveMasterSeed(seedHex);
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
    console.log('ON REGISTER account');
    this.user.onRegisterUser();
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
    if (!this.seeder.poolFilled)
      this.seeder.seed(args.getX(), args.getY())
  }

  onVerifyBackup = async function() {
    console.log('ON RETURN PRESS');
    if (this.verifyBackupPhrase.toLowerCase() === this.user.saveData.mnemonicPhrase.toLowerCase()) {
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
}
