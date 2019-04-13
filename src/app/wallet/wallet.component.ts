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

	constructor(
    private page: Page,
    // private _wallet: WalletModel,
    // private _change: ChangeDetectorRef,
    private _WalletServ: WalletService,
    private _IdentityServ: IdentityService,
    private _zone: NgZone
  ) {

    this.tabSelectedIndex = 1;
    this.selectedWalletId = 0;

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
        this.notice('Establishing Connection');
        break;

      case 'WalletService::ElectrumxConnectionEstablished':
        this.notice('Connection Established');
        break;

      case 'WalletService::WalletDiscovery':
        this.notice('Loading Wallet Addresses');
        break;

      case 'WalletService::FinishDiscoverExternal':
        this.notice('External Addresses Discovered');
        break;

      case 'WalletService::FinishDiscoverInternal':
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
    this._walletSub       = this._WalletServ.eventStream$.subscribe(this.onHandleWalletEvents);
    this._blockheightSub  = this._WalletServ.trackedBlockheight.subscribe(height => {
      this._zone.run(() => { 
        this.trackedBlockheight = height;
      });
    });

    this._keepAliveTimer = setInterval(() => {
      if (this._WalletServ.electrumxConnected) {
        console.log('[Wallet Component] @keepAlive');
        this._WalletServ.keepAlive();
      }
    }, (5 * 60 * 1000));

    // this._wallet.on('TransactionSent', (event: EventData) => {
    //   console.log(`[Wallet Module] TransactionSent --`);
    //   this.onRefreshWallet();
    // });
  }

  ngOnInit() {
    console.log('[Wallet Component] @onInit');

    this.page.on('navigatingFrom', async (data) => {
      console.log('[Wallet Component] @navigatingFrom');
      if (this._walletSub) this._walletSub.unsubscribe();
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
    if (this._walletSub) this._walletSub.unsubscribe();
    if (this._blockheightSub) this._blockheightSub.unsubscribe();
    clearInterval(this._keepAliveTimer);
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
    console.log('onSendTransaction', address, amount);

    console.log(`Sending [${amount}] to [${address}]`);

    this.selectedWallet.loadUnspent()
    .then(() => {
      console.log('loaded?', this.selectedWallet.unspent$.length);
      return this.selectedWallet.sendTransaction(this._WalletServ.electrumxClient, address, amount);
    })
    .then((sent) => {
      console.log('sent?', sent);
    })
    .catch((err) => {
      if (err.name && err.name === 'InvalidAddress') {
        alert('Transaction failed, address was invalid. Please double check your input and make sure it is a correct ODIN address!');
      }

      console.log(err)
    });
  //   let unspent = this.currentWallet.unspent.slice(0).sort((tx1, tx2) => {
  //     if (tx1['height'] < tx2['height']) return -1;
  //     else if (tx1['height'] > tx2['height']) return 1;
  //     return 0;
  //   });

  //   let coinControl = unspent.reduce((txArr, tx) => {
  //     let sum = txArr.reduce((sum, _tx) => sum += _tx['value'], 0);
  //     if (sum <= (amount * 1e8)) {
  //       txArr.push(tx);
  //     }

  //     return txArr;
  //   }, []);

  //   this._wallet.sendTransaction(this.currentWallet, recipient, amount, coinControl, this.TX_FEE)
  //   .then((txid) => {
  //     alert(`Transaction Sent!\n\nTXID:\n${txid}\n\nPlease allow a few minutes for this transaction to appear in your mobile wallet.`);
  //   })
  //   .catch((err) => {
  //     console.log('err', err);
  //     alert('error');
  //   })
  }
}
