import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { TabView } from "tns-core-modules/ui/tab-view";
import { Image } from "tns-core-modules/ui/image";
import { isAndroid, isIOS, device } from "platform";
import * as app from "tns-core-modules/application";
import { EventData } from "tns-core-modules/data/observable";
import { alert } from "tns-core-modules/ui/dialogs";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Page } from "ui/page";
import { WalletModel } from '~/app/shared/wallet.model';
import { setTimeout, clearTimeout, setInterval, clearInterval } from 'tns-core-modules/timer/timer';
import { WalletService } from '../shared/services';
import { Subscription } from 'rxjs';

@Component({
	moduleId: module.id,
	selector: 'wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("tabView") tabView: ElementRef;
  public tabSelectedIndex: number;
  public selectedWalletId: number;
  public walletData: any;
  public wallets: any[];
  public activeWallet: any;

  public blockheight: number;
  private reconnectTimer: any;
  private keepAliveTimer: any;
  private _walletSub: Subscription;

  public noticeActive: boolean;
  public noticeContent: string;

  public warningActive: boolean;
  public warningContent: string;

  private creatingNewWallet: boolean;

	constructor(
    private page: Page,
    private _wallet: WalletModel,
    private _change: ChangeDetectorRef,
    private _WalletServ: WalletService
  ) {

    this.tabSelectedIndex = 1;
    this.selectedWalletId = 0;
    this.walletData = this._wallet.walletData;
    this.wallets = this._wallet.wallets;
    this.activeWallet = false;
    this.blockheight = 0;
    this.reconnectTimer = null;
    this.keepAliveTimer = null;
    this.creatingNewWallet = false;

    this.warning = this.warning.bind(this);
    this.notice = this.notice.bind(this);
    this.noticeDelay = this.noticeDelay.bind(this);
    this.loadWalletView = this.loadWalletView.bind(this);
    this.createDefaultWallet = this.createDefaultWallet.bind(this);
    this.onHandleWalletEvents = this.onHandleWalletEvents.bind(this);

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

    this._walletSub = this._WalletServ.eventStream$.subscribe(this.onHandleWalletEvents);
    // if (this._wallet.wallets.length) {
    //   console.log(`[Wallet Module] Wallets Found...`);
    //   this.blockheight  = this._wallet.chainStats.blockheight;
    // } else {
    //   console.log(`[Wallet Module] Wallets Loading...`);
    // }
    // this.setupSubscriptions();
  }

  onHandleWalletEvents(eventName: string) {
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
        break;
      
      default:
        console.log(`WalletModule [${eventName}]`);
    }
  }

  setupSubscriptions() {
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
      
    //   this.keepAliveTimer = setInterval(() => {
    //     console.log('[Wallet Module] Keep Alive');
    //     this._wallet.keepAlive();
    //   }, (5 * 60 * 1000));
    // });

    // this._wallet.on('NewBlockFound', (event: EventData) => {
    //   console.log(`[Wallet Module] Block -- ${event.object['chainStats'].blockheight}`);
    //   this.blockheight = event.object['chainStats'].blockheight;
    //   this._change.detectChanges();
    // });

    // this._wallet.on('TransactionSent', (event: EventData) => {
    //   console.log(`[Wallet Module] TransactionSent --`);
    //   this.onRefreshWallet();
    // });
  }

  ngOnInit() {
    let self = this;

    this.page.on('navigatingFrom', async (data) => {
      console.log('[Wallet Module] Am navigating away...');

      if (this._walletSub) {
        this._walletSub.unsubscribe();
      }
      // clearTimeout(this.reconnectTimer);
      // clearInterval(this.keepAliveTimer);
      // self._wallet.off('NewBlockFound');
      // self._wallet.off('WalletReady');
      // await self._wallet.cancelSubscriptions();
      // console.log('[Wallet Module] Subscriptions cancelled...');
      // console.dir(this._wallet.walletData);
    });

    // if ((!this._wallet.walletData.loaded || !this._wallet.walletData.subscribed) && !this._wallet.walletData.busy) {
    //   console.log('[Wallet Module] Reconnecting...');

    //   this.reconnectTimer = setTimeout(() => {
    //     this._wallet.reconnect(this._wallet.wallets[0].coin)
    //     .then((loaded) => {
    //       console.log('[Wallet Module] Connection re-established');
    //     })
    //     .catch((err) => {
    //       console.log('[Wallet Module] Unable to reconnect');
    //     });
    //   }, 1000);
    // }
  }

  ngAfterViewInit() {
    console.log('$$$ ngAfterViewInit');
    setTimeout(this.loadWalletView, 2000);
  }

  ngOnDestroy() {
    console.log('ON DESTROY');

    if (this._walletSub) {
      this._walletSub.unsubscribe();
    }
  }

  private loadWalletView() {
    console.log('$$$ loadWalletView');

    if (!this._WalletServ.wallets.length) {
      console.log('$$$ NO WALLETS');
      this.notice('No Wallets Found – Creating Default Wallet');
      setTimeout(this.createDefaultWallet, 2000);
    } else {
      console.log('$$$ WALLETS');
      setTimeout(this.createDefaultWallet, 2000);
    }
  }

  private createDefaultWallet() {
    console.log('$$$ createDefaultWallet');
    this.creatingNewWallet = true;
    this._WalletServ.createDefaultWallet()
    .then(wallet => {
      console.log('$$$ WALLET CREATED');
      this.creatingNewWallet = false;
      this.noticeDelay('New Wallet Created – Loading View');
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
    console.log('onRefreshWallet', typeof this._wallet.refreshWalletDetails);
    this._wallet.refreshWalletDetails()
    .then(() => {
      console.log('[Wallet] Completed refresh');
      console.log('all wallets', this._wallet.wallets.map(wallet => wallet.balance.confirmed));

      this.activeWallet = this._wallet.wallets[this.selectedWalletId];
    });
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
    console.log('switch tab by index', index);
    this.tabSelectedIndex = index;
  }
}
