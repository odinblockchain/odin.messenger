import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { TabView } from 'tns-core-modules/ui/tab-view';
import { isAndroid, isIOS, screen } from 'tns-core-modules/platform';
import * as app from 'tns-core-modules/application';
import { EventData } from 'tns-core-modules/data/observable';
import { alert } from 'tns-core-modules/ui/dialogs';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import { Page, layout } from 'tns-core-modules/ui/page';
import { setTimeout, setInterval, clearInterval } from 'tns-core-modules/timer/timer';
import { WalletService } from '~/app/shared/services';
import { Subscription, Observable as ObservableGeneric } from 'rxjs';
import { Wallet } from '~/app/shared/models/wallet';
import { SnackBar } from 'nativescript-snackbar';
import { LogService } from '~/app/shared/services/log.service';

const firebase = require('nativescript-plugin-firebase');

const KEEP_ALIVE_DELAY = 2;

@Component({
	moduleId: module.id,
	selector: 'wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tabView') tabView: ElementRef;

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

  public walletReady: boolean;
  public selectedWallet: Wallet;
  public refreshingWallet: boolean;

  private creatingNewWallet: boolean;

  public gridLayout;

  @ViewChild('gridLayoutRef') walletGrid: ElementRef;
  private gridLayoutRef: any;
  public isLimitedView: boolean;

	constructor(
    private page: Page,
    private _WalletServ: WalletService,
    private _zone: NgZone,
    private _snack: SnackBar,
    private _Log: LogService
  ) {

    this.tabSelectedIndex = 1;
    this.selectedWalletId = 0;
    
    this.isLimitedView = true;
    this.gridLayout = {
      rows: 'auto, 170, *, auto',
    };

    this.refreshingWallet = false;
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
        this.refreshingWallet = true;
        this.notice('Refreshing wallet');
        break;

      case 'WalletService::RefreshWalletEnd':
        this._zone.run(() => {
          this.refreshingWallet = false;
          this.selectedWallet.loadTransactions()
          .then(this.selectedWallet.loadAddresses)
          .then(() => {
            this.notice('');
            this.warning('');
          });
        });
        break;
      
      default:
        console.log(`[Wallet Component] Event#${eventName}`);
    }
  }

  setupSubscriptions() {
    console.log('[Wallet Component] @setupSubscription');
      
    this._walletServiceSub  = this._WalletServ.eventStream$.subscribe(this.onHandleWalletEvents);
    this._blockheightSub    = this._WalletServ.trackedBlockheight.subscribe(height => {
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
      }, (KEEP_ALIVE_DELAY * 60 * 1000));

      console.log('[Wallet Component] KeepAlive Started');
    }
  }
  
  ngOnInit() {
    console.log('[Wallet Component] @onInit');

    this.gridLayoutRef = this.walletGrid.nativeElement;
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
    clearInterval(this._keepAliveTimer);
  }

  public handleRequestNewAddress(event) {
    this._WalletServ.discoverNewAddress(this.selectedWallet);
  }

  public updateLayout() {
    const width = layout.toDeviceIndependentPixels(
      this.gridLayoutRef.nativeView.getMeasuredWidth()
    );

    const height = screen.mainScreen.heightDIPs;

    console.log('DEVICE', width, screen.mainScreen.heightDIPs);
  
    if (height < 500) {
      this.gridLayout = {
        rows: 'auto, 125, *, auto',
      };
    } else {
      this.isLimitedView = false;
      this.gridLayout = {
        rows: 'auto, 170, *, auto',
      };
    }
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
      if (event === 'TransactionSent') {
        this.tabSelectedIndex = 1;
      } 
    });

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
      console.log('Default wallet created');

      this.creatingNewWallet = false;
      const wallet = this._WalletServ.wallets$.getItem(this.selectedWalletId);
      this.selectedWallet = wallet;
      this.loadWalletView();
    }).catch(err => {
      console.log('Default wallet creation error', err.message ? err.message : err);
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
    if (this.refreshingWallet) {
      console.log('Unable to refresh wallet');
      this._snack.simple('Wallet is already refreshing', '#ffffff', '#333333', 4, false);
    } else {
      console.log('Refreshing wallet');
      this.refreshingWallet = true;
      this.notice('');
      this.warning('');

      if (!this._WalletServ.electrumxConnected) {
        this._snack.simple('Reconnecting to server', '#ffffff', '#333333', 4, false);
        this._WalletServ.establishConnection(this.selectedWallet)
        .then(() => this.noticeDelay('Loading Wallet View'))
        .then(() => {
          this._WalletServ.refreshWallet(this.selectedWallet);
        }).catch((err) => {
          console.log('Error reconnecting', err.message ? err.message : err);
          if (!this.warningActive) {
            this.warning('Unable to fetch the latest update for your wallet. Please try again later.');
          }

          this.refreshingWallet = false;
        });
      } else {
        this._WalletServ.refreshWallet(this.selectedWallet);
      }
    }
  }

  public onWalletSelected(walletSelectedId: number) {
    this.selectedWalletId = walletSelectedId;
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
    this.tabSelectedIndex = index;
  }

  public onSendTransaction({ address, amount }) {
    console.log(`Sending [${amount}] to [${address}]`);

    this.selectedWallet.sendTransaction(this._WalletServ.electrumxClient, address, amount)
    .then(txid => {
      console.log('Assuming sent!', txid);
      this._captureSend(amount);

      this._snack.simple('Transaction has been sent! Funds should be delivered within a few minutes.', '#ffffff', '#333333', 4, false);
    })
    .catch(err => {
      if (err.name) console.log(`Transaction failed... ErrorId:${err.name}`);

      if (err.name && err.name === 'InvalidAddress') {
        this._captureSendBadAddress();

        alert('Transaction failed, address was invalid. Please double check your input and make sure it is a correct ODIN address!');
      } else if (err.name && err.name === 'BalanceLow') {
        this._captureSendBadAmount();

        alert('Transaction failed, wallet balance insufficient to cover transaction! You must deposit more ODIN into a receiving address.');
      } else if (err.name && err.name === 'TransactionFailed') {
        this._captureSendBadOther();

        alert('Transaction failed, an unexpected error occurred while attempting to send transaction. Please wait and try again later.');
      } else {
        this._captureSendBadOther();
        if (err.message) {
          try {
            const errMessage = err.message.replace(/ *\[[^\]]*]/, '').trim();
            this._Log.logger(errMessage);
          } catch (err) {}
        }
        
        alert('Transaction failed to send');
        console.log(`Transaction failed to send...
          Error: ${err.message ? err.message : err}
        `);
      }
    });
  }

  private formatBalance(amount: number): number {
    return Number((amount / 1e8).toFixed(8));
  }

  private _captureSendBadAddress() {
    firebase.analytics.logEvent({
      key: 'wallet_send_bad_address'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet Send Bad Address'); });
  }

  private _captureSendBadAmount() {
    firebase.analytics.logEvent({
      key: 'wallet_send_bad_amount'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet Send Bad Amount'); });
  }

  private _captureSendBadOther() {
    firebase.analytics.logEvent({
      key: 'wallet_send_bad_other'
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet Send Bad Other'); });
  }

  private _captureSend(amount: number) {
    const sendBuckets = [
      { small:    [0, 100]        },
      { medium:   [101, 500]      },
      { standard: [501, 1000]     },
      { large:    [1001, 5000]    },
      { xlarge:   [5001, 10000]   },
      { xxlarge:  [10001, 20000]  }
    ];

    const bucket = sendBuckets.filter(b => {
      const range = Object.values(b)[0];
      return (amount > range[0] && amount < range[1]);
    });

    firebase.analytics.logEvent({
      key: 'spend_virtual_currency',
      parameters: [
        {
          key: 'virtual_currency_name',
          value: 'odin'
        },
        {
          key: 'item_name',
          value: bucket ? Object.keys(bucket)[0] : 'unknown'
        }
      ]
    })
    .then(() => { console.log('[Analytics] Metric logged >> Wallet Send'); });
  }
}
