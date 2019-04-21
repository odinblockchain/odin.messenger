import { Component, OnInit, AfterContentInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone } from "@angular/core";
import { Page } from "tns-core-modules/ui/page/page";
import { setOrientation, disableRotation } from "nativescript-orientation";
import Seeder from '~/app/lib/Seeder';
import SecureRandom from '~/app/lib/SecureRandom';
import { TouchGestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { AnimationCurve } from "tns-core-modules/ui/enums/enums";
import { IdentityService } from "~/app/shared/services/identity.service";
import { Identity } from "~/app/shared/models/identity/identity.model";
import { AccountService } from "~/app/shared/services";
import { Client } from "~/app/shared/models/messenger/client.model";
import { ClientService } from "~/app/shared/services/client.service";
import { Account } from "~/app/shared/models/identity";
import { alert } from "tns-core-modules/ui/dialogs/dialogs";
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar } from "nativescript-snackbar";

@Component({
  selector: "GenerateScreen",
  moduleId: module.id,
  templateUrl: "./generate.component.html",
  styleUrls: ['./generate.component.css']
})
export class GenerateScreenComponent implements OnInit, OnDestroy {
  @ViewChild('generateLayout') generateLayout: ElementRef;
  // @ViewChild('wrapper') ctaButton: ElementRef;

  public accountGenerated: boolean;
  public entropyCreated: boolean;
  public currentEntropy: number;
  public maxEntropy: number;

  public seeder: Seeder;
  public secureRandom: SecureRandom;
  public activeStep: number;

  public identity: Identity;
  public primaryAccount: Account;
  public primaryClient: Client;

  private layout: any;

  private busyClick: boolean;
  private registering: boolean;

  constructor(
    private _page: Page,
    private _zone: NgZone,
    private _IdentityServ: IdentityService,
    private _AccountServ: AccountService,
    private _ClientServ: ClientService,
    private _snack: SnackBar
  ) {
    this._page.actionBarHidden = true;
    this._page.cssClasses.add("welcome-page-background");
    this._page.backgroundSpanUnderStatusBar = true;
    setOrientation('portrait');
    disableRotation();

    this.entropyCreated   = false;
    this.accountGenerated = false;
    this.busyClick        = false;
    this.registering      = false;

    this.identity       = this._IdentityServ.identity;
    this.primaryAccount = new Account();
    this.primaryClient  = new Client();

    this.onGenerationComplete = this.onGenerationComplete.bind(this);
    this.onTouchEntropy       = this.onTouchEntropy.bind(this);
    this.refreshPassport      = this.refreshPassport.bind(this);
  }

  ngOnInit(): void {
    console.log(this.primaryAccount.registered);
    console.log('[Generate] Look for savedata...', this.identity);

    if (this.identity.mnemonicPhrase != '') {
      this.primaryAccount = this._AccountServ.accounts[0];
      this.primaryClient  = this._ClientServ.findClientById(this.primaryAccount.client_id);
      console.log('PRIMARY', this.primaryAccount.serialize());
      console.log('CLIENT', this.primaryClient.serialize());

      this.entropyCreated   = true;
      this.accountGenerated = true;
    } else {
      this.layout         = this.generateLayout.nativeElement;
      this.secureRandom   = new SecureRandom();
      this.seeder         = new Seeder(25);
      this.maxEntropy     = this.seeder.get('seedLimit');
      this.currentEntropy = 0;

      console.log(`[Generate] Entropy Required: ${this.maxEntropy}`);

      this.seeder.poolFilled = false;
      this.layout.on('touch', this.onTouchEntropy);
      this.seeder.on('complete', this.onGenerationComplete);
    }
  }

  ngOnDestroy(): void {
    if (this.seeder) this.seeder.off('complete', this.onGenerationComplete);
    if (this.layout) this.layout.off('touch', this.onTouchEntropy);
    if (this.seeder) delete this.seeder;
    if (this.secureRandom) delete this.secureRandom;
  }

  public onTouchEntropy(args: TouchGestureEventData) {
    // console.log('onTouchEntropy', {
    //   x: args.getX(),
    //   y: args.getY()
    // });

    this._zone.run(() => {
      if (!this.seeder.poolFilled) {
        this.seeder.seed(args.getX(), args.getY());
        this.currentEntropy = this.seeder.get('seedCount');
      }
    });
  }

  public onRegister(event) {
    if (this.busyClick || this.registering) return;

    this.registering  = true;
    this.busyClick    = true;

    this._AccountServ.registerAccount(this.identity, this.primaryAccount, this.primaryClient)
    .then(() => {
      console.log('onRegister!');
      this._zone.run(this.refreshPassport);
    })
    .catch((err) => {
      console.log('Registration Faied');
      console.log(err.message ? err.message : err);
      
      this.registering = false;
      this.busyClick = false;
    });
  }

  public onCopyText(text: string) {
    let sb = this._snack;
    Clipboard.setText(text)
    .then(async function() {
      try {
        await sb.simple('Copied username to clipboard!', '#ffffff', '#333333', 3, false);
      } catch (err) {
        console.log('Unable to copy to clipboard');
      }
    });
  }

  private refreshPassport() {
    console.log('Refreshing passport...');

    this.primaryAccount = this._IdentityServ.getActiveAccount();
    if (this.primaryAccount) {
      this.primaryClient = this._ClientServ.findClientById(this.primaryAccount.client_id);
    }
  }

  private onGenerationComplete(eventData?: any) {
    console.log('[Generate] onGenerationComplete');

    this.seeder.off('complete', this.onGenerationComplete);
    this.layout.off('touch', this.onTouchEntropy);

    this.currentEntropy     = this.maxEntropy;
    this.entropyCreated     = true;
    this.seeder.poolFilled  = true;

    this.useSeed(this.seeder.sha256Seed());
  }

  private useSeed(seedHex?: string) {
    console.log('using seed');
    console.log(seedHex);

    this._IdentityServ.saveMasterseed(seedHex)
    .then((id: Identity) => this._AccountServ.createAccountFromMnemonic(id.mnemonicPhrase, 0))
    .then((account: Account) => {
      this.primaryAccount = account;
      return this._ClientServ.createClient(new Client({ account_username: account.username }))
    })
    .then((client: Client) => {
      this.primaryClient = client;
      this.primaryAccount.client_id = client.id;
      return this.primaryAccount.save();
    })
    .then(() => {
      this.accountGenerated = true;
    })
    .catch((err) => {
      alert('There was an error generating your account! Please close this app and try again.\n\n' + (err.message ? err.message : err));
      console.log(err);
    });
  }
  
}
