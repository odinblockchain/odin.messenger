import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { TabView } from "tns-core-modules/ui/tab-view";
import { Image } from "tns-core-modules/ui/image";
import { isAndroid, isIOS, device } from "platform";
import * as app from "tns-core-modules/application";
import { EventData, Observable } from "tns-core-modules/data/observable";
import { alert } from "tns-core-modules/ui/dialogs";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Page } from "ui/page";
import { WalletModel } from '~/app/shared/wallet.model';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'tns-core-modules/timer/timer';
import { WalletService } from '../shared/services';
import { Subscription, Observable as ObservableGeneric } from 'rxjs';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Wallet, Transaction, Address } from '../shared/models/wallet';
import { IdentityService } from '../shared/services/identity.service';
import { SnackBar } from 'nativescript-snackbar';

@Component({
	moduleId: module.id,
	selector: 'wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("tabView") tabView: ElementRef;
  // public walletData: any;
  // public wallets: any[];
  // public activeWallet: any;

  // private reconnectTimer: any;
  // private keepAliveTimer: any;
  private _keepAliveTimer: any;
  private _walletServiceSub: Subscription;
  private _walletSub: Subscription;
  private _blockheightSub: Subscription;
  
  public noticeActive: boolean;
  public noticeContent: string;

  public warningActive: boolean;
  public warningContent: string;

  public selectedWalletId: number;
  public tabSelectedIndex: number;

  public trackedBlockheight: number;

  private _appWallets: ObservableArray<Wallet>;
  public walletTransactions: ObservableArray<Transaction>;
  public walletAddresses: ObservableArray<Address>;
  private creatingNewWallet: boolean;

  public walletReady: boolean;
  // public selectedWallet: Observable;
  public selectedWallet: Wallet;

  public refreshingWallet: boolean;

	constructor(
    private page: Page,
    private _WalletServ: WalletService,
    private _IdentityServ: IdentityService,
    private _zone: NgZone,
    private _snack: SnackBar
  ) {

    this.tabSelectedIndex = 1;
    this.selectedWalletId = 0;

    this.refreshingWallet = false;

    // this.walletData = this._wallet.walletData;
    // this.wallets = this._wallet.wallets;

    // this.activeWallet = false;
    // this.reconnectTimer = null;
    // this.keepAliveTimer = null;
    this.creatingNewWallet = false;
    this.walletReady = false;

    this.warning = this.warning.bind(this);
    this.notice = this.notice.bind(this);
    this.noticeDelay = this.noticeDelay.bind(this);
    this.initWallet = this.initWallet.bind(this);
    this.loadWalletView = this.loadWalletView.bind(this);
    this.createDefaultWallet = this.createDefaultWallet.bind(this);
    this.onHandleWalletEvents = this.onHandleWalletEvents.bind(this);
    this.restoreWallet = this.restoreWallet.bind(this);
    this.onSendTransaction = this.onSendTransaction.bind(this);
    
    this.notice('Loading Wallet View');

    /**
     * WalletService::Init
     * WalletService::Connected
     * WalletService::CreateDefaultWallet
     * WalletService::CreateWallet
     * WalletService::EstablishConnection
     * WalletService::ElectrumxListening
     * WalletService::ElectrumxBlockchainHeaderSubscribed
     * WalletService::ElectrumxConnected
     * 
     * Happy Path Electrumx
     * WalletService::ElectrumxAccepted
     * WalletService::ElectrumxConnectionEstablished
     * 
     * Sad Path Electrumx
     * ElectrumxError_UnsupportedClient
     * ElectrumxError
     * 
     * Happy Timeout Electrumx
     * ElectrumxConnectionValid
     * 
     * Sad Timeout Electrumx
     * ElectrumxConnectionTimeout
     * ElectrumxConnectionInvalid
     * 
     * WalletService::WalletDiscovery
     * WalletService::StartDiscoverExternal
     * WalletService::FinishDiscoverExternal
     * WalletService::StartDiscoverInternal
     * WalletService::FinishDiscoverInternal
     * WalletService::FinishWalletDiscovery
     * WalletService::FinishCreateWallet
     * WalletService::FinishDefaultWallet
     * 
     * WalletService::NewBlockFound
     * TCPClientError
     * 
     */
    this.setupSubscriptions();
  }

  onHandleWalletEvents(eventName: string) {
    // console.log(`@@@ ${eventName} @@@`);
    switch(eventName) {
      case 'WalletService::Init':
        this.notice('Wallet Service Starting');
        break;

      case 'WalletService::ElectrumxListening':
        if (this.refreshingWallet) return;
        this.notice('Establishing Connection');
        break;

      case 'WalletService::ElectrumxConnectionEstablished':
        if (this.refreshingWallet) return;
        this.notice('Connection Established');
        break;

      case 'WalletService::WalletDiscovery':
        if (this.refreshingWallet) return;
        this.notice('Loading Wallet Addresses');
        break;

      case 'WalletService::FinishDiscoverExternal':
        if (this.refreshingWallet) return;
        this.notice('External Addresses Discovered');
        break;

      case 'WalletService::FinishDiscoverInternal':
        if (this.refreshingWallet) return;
        this.notice('Internal Addresses Discovered');
        break;

      case 'WalletService::ElectrumxConnectionTimeout':
        if (this.creatingNewWallet)
          this.warning('Connection Failed – Unable to create default wallet at this time');
        else
          this.warning('Connection Failed – Wallet services will be limited, please try reconnecting in a few minutes');
          this.walletReady = true;
        break;

      case 'WalletService::NewBlockFound':
        break;

      case 'WalletService::RefreshWalletStart':
        console.log('START REFRESH');
        this.notice('Refreshing wallet');
        break;

      case 'WalletService::RefreshWalletEnd':
        this.refreshingWallet = false;
        console.log('END REFRESH');
        this.notice('');
        this.selectedWallet.loadTransactions()
        .then(this.selectedWallet.loadAddresses)
        .then(() => console.log('Addresses refreshed'));
        break;
      
      default:
        console.log(`[Wallet Component] Event#${eventName}`);
    }
  }

  setupSubscriptions() {
    console.log('[Wallet Component] @setupSubscription');
    // this._wallet.on("WalletReady", (eventData) => {
    //   this.activeWallet = this._wallet.wallets[this.selectedWalletId];

    //   console.log(`[Wallet Module] Wallet is Active`);
    //   console.log('--- --- [Wallet] --- ---');

    //   console.log('index', this.activeWallet.accountIndex);
    //   console.log('coin', this.activeWallet.coin);
    //   console.log('balance', this.activeWallet.balance);
    //   console.log('transactions', this.activeWallet.transactions.slice(0, 2));
    //   console.log('unspent', this.activeWallet.unspent.slice(0, 2));
    //   console.log('external', this.activeWallet.external.slice(0, 3));
    //   console.log('internal', this.activeWallet.internal.slice(0, 3));
      
    this._appWallets      = this._WalletServ.wallets$;
    this._walletServiceSub       = this._WalletServ.eventStream$.subscribe(this.onHandleWalletEvents);
    this._blockheightSub  = this._WalletServ.trackedBlockheight.subscribe(height => {
      this._zone.run(() => { 
        this.trackedBlockheight = height;
      });
    });

    if (!this._keepAliveTimer) {
      this._keepAliveTimer = setInterval(() => {
        if (this._WalletServ.electrumxConnected) {
          console.log('[Wallet Component] @keepAlive');
          this._WalletServ.keepAlive();
        }
      }, (5 * 60 * 1000));
    }
  }

  ngOnInit() {
    console.log('[Wallet Component] @onInit');

    this.page.on('navigatingFrom', async (data) => {
      console.log('[Wallet Component] @navigatingFrom');
      if (this._walletServiceSub) this._walletServiceSub.unsubscribe();
      if (this._blockheightSub) this._blockheightSub.unsubscribe();
      clearInterval(this._keepAliveTimer);
    });
  }

  ngAfterViewInit() {
    console.log('[Wallet Component] @afterViewInit');
    if (this._WalletServ.electrumxConnected)
      this.noticeDelay('Restoring Wallet View').then(this.restoreWallet);
    else
      setTimeout(this.initWallet, 2000);
  }

  ngOnDestroy() {
    console.log('[Wallet Component] @onDestroy');
    if (this._walletServiceSub) this._walletServiceSub.unsubscribe();
    if (this._blockheightSub) this._blockheightSub.unsubscribe();
    if (this._walletSub) this._walletSub.unsubscribe();
    // clearInterval(this._keepAliveTimer);
  }

  public handleRequestNewAddress(event) {
    this._WalletServ.discoverNewAddress(this.selectedWallet);
  }

  /**
   * Restore previous state of wallet – called from ngAfterViewInit if a
   * previous electrumx session was established
   */
  private restoreWallet() {
    console.log('[Wallet Component] @restoreWallet');
    this.loadWalletView();
  }

  /**
   * Initializes the wallet module – called from ngAfterViewInit if a
   * previous electrumx session has not been established or if it was lost
   */
  private initWallet() {
    console.log('[Wallet Component] @initWallet');

    if (this._WalletServ.wallets.length) {
      this.loadWalletView();
      return;
    }
    
    this.noticeDelay('No Wallets Found – Creating Default Wallet')
    .then(() => this.createDefaultWallet());
  }

  private loadWalletView() {
    console.log('[Wallet Component] @loadWalletView');

    if (!this.selectedWallet) {
      this.selectedWallet = this._WalletServ.wallets$.getItem(this.selectedWalletId);
    }

    this._walletSub = this.selectedWallet.eventStream$.subscribe((event) => {
      console.log('WALLET SUB', event);
      if (event === 'LoadedAddresses') {
        this.walletAddresses = new ObservableArray();
      } else if (event === 'TransactionSent') {
        console.log('@@@@ SAVED @@@@');
        this.tabSelectedIndex = 1;
      } 
    });

    this.walletTransactions = this.selectedWallet.transactions$;
    this.walletAddresses = this.selectedWallet.addresses$;

    this.selectedWallet.loadTransactions()
    .then(this.selectedWallet.loadAddresses)
    .then(() => {
      console.log(`Loaded transactions and addresses for wallet –
      Transactions Count: ${this.selectedWallet.transactions$.length}
      Addresses Count:    ${this.selectedWallet.addresses$.length}`);

      if (this._WalletServ.electrumxConnected) {
        this.noticeDelay('Loading Wallet View')
        .then(() => {
          this.notice('');
          this.warning('');
          this.walletReady = true;
        });
      } else {
        this._WalletServ.establishConnection(this.selectedWallet)
        .then(() => this.noticeDelay('Loading Wallet View'))
        .then(() => {
          this.notice('');
          this.warning('');
          this.walletReady = true;
        }).catch(console.log);
      }
    }).catch(console.log);
  }

  private createDefaultWallet() {
    console.log('[Wallet Component] @createDefaultWallet');

    this.creatingNewWallet = true;
    this._WalletServ.createDefaultWallet()
    .then((_defaultWallet: Wallet) => {
      console.log('[Wallet Component] >> Default wallet created');

      this.creatingNewWallet = false;
      const wallet = this._WalletServ.wallets$.getItem(this.selectedWalletId);
      this.selectedWallet = wallet;
      this.loadWalletView();
    }).catch(err => {
      console.log('$$$ GOT ERR');
      console.log(err.message ? err.message : err);
      this.warning('Unable to create wallet at this time');
    });
  }

  private notice(notice?: string) {
    if (!notice || !notice.length) {
      this.noticeActive = false;
      this.noticeContent = '';
    } else {
      this.noticeActive = true;
      this.noticeContent = notice;
    }
  }

  private async noticeDelay(notice?: string): Promise<any> {
    if (!notice || !notice.length) return false;
    return new Promise(resolve => {
      setTimeout((_self: this) => {
        _self.notice(notice);
        resolve(true);
      }, 2000, this);
    });
  }

  private warning(warning?: string) {
    if (!warning || !warning.length) {
      this.warningActive = false;
      this.warningContent = '';
    } else {
      this.notice('');
      this.warningActive = true;
      this.warningContent = warning;
    }
  }

  public onRefreshWallet() {
    console.log('onRefreshWallet');
    if (this.refreshingWallet) {
      alert('Wallet is already refreshing');
    } else {
      this.refreshingWallet = true;
      this._WalletServ.refreshWallet(this.selectedWallet);
    }
    //, typeof this._wallet.refreshWalletDetails);
    // this._wallet.refreshWalletDetails()
    // .then(() => {
    //   console.log('[Wallet] Completed refresh');
    //   console.log('all wallets', this._wallet.wallets.map(wallet => wallet.balance.confirmed));

    //   this.activeWallet = this._wallet.wallets[this.selectedWalletId];
    // });
  }

  public onWalletSelected(walletSelectedId: number) {
    this.selectedWalletId = walletSelectedId;
    console.log('SWITCH TO WALLET', this.selectedWalletId);
  }

  public onTabsLoaded(event: EventData): void {
    let tabViewElement = <TabView>event.object;

    if (isAndroid) {
      const tabLayout = tabViewElement.nativeViewProtected.tabLayout;
      tabLayout.getLayoutParams().height = 0;
      tabLayout.requestLayout();
    } else if (isIOS) {
      tabViewElement.viewController.tabBar.hidden = true;
    }
  }

  public onCreateWallet(): void {
    alert('This feature is not available yet!');
  }

  public onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  public onTabSwitch($event): void {
    console.log('ontabswitch!');
  }

  public switchTabByIndex(index: number): void {
    console.log('switch tab by index', index);
    this.tabSelectedIndex = index;
  }

  public onSendTransaction({ address, amount }) {
    console.log(`Sending [${amount}] to [${address}]`);

    this.selectedWallet.sendTransaction(this._WalletServ.electrumxClient, address, amount)
    .then(txid => {
      console.log('Assuming sent!', txid);
      this._snack.simple('Transaction has been sent! Funds should be delivered within a few minutes.', '#ffffff', '#333333', 4, false);
    })
    .catch(err => {
      if (err.name && err.name === 'InvalidAddress') {
        alert('Transaction failed, address was invalid. Please double check your input and make sure it is a correct ODIN address!');
      } else if (err.name && err.name === 'BalanceLow') {
        alert('Transaction failed, wallet balance insufficient to cover transaction! You must deposit more ODIN into a receiving address.');
      } else if (err.name && err.name === 'TransactionFailed') {
        alert('Transaction failed, an unexpected error occurred while attempting to send transaction. Please wait and try again later.');
      } else {
        console.log(err);
        alert('Transaction failed to send');
      }
    });
  }
}
