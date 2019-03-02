import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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

@Component({
	moduleId: module.id,
	selector: 'wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit, AfterViewInit {
  @ViewChild("tabView") tabView: ElementRef;
  public tabSelectedIndex: number;
  public selectedWalletId: number;
  public walletData: any;
  public wallets: any[];
  public activeWallet: any;

  public blockheight: number;
  private reconnectTimer: any;
  private keepAliveTimer: any;

	constructor(
    private page: Page,
    private _wallet: WalletModel,
    private _change: ChangeDetectorRef
  ) {
    this.tabSelectedIndex = 1;
    this.selectedWalletId = 0;
    this.walletData = this._wallet.walletData;
    this.wallets = this._wallet.wallets;
    this.activeWallet = false;
    this.blockheight = 0;
    this.reconnectTimer = null;
    this.keepAliveTimer = null;

    if (this._wallet.wallets.length) {
      console.log(`[Wallet Module] Wallets Found...`);
      this.activeWallet = this._wallet.wallets[this.selectedWalletId];
      this.blockheight  = this._wallet.chainStats.blockheight;
    } else {
      console.log(`[Wallet Module] Wallets Loading...`);
    }

    this.setupSubscriptions();
  }

  setupSubscriptions() {
    this._wallet.on("WalletReady", (eventData) => {
      this.activeWallet = this._wallet.wallets[this.selectedWalletId];

      console.log(`[Wallet Module] Wallet is Active`);
      console.log('--- --- [Wallet] --- ---');

      console.log('index', this.activeWallet.accountIndex);
      console.log('coin', this.activeWallet.coin);
      console.log('balance', this.activeWallet.balance);
      console.log('transactions', this.activeWallet.transactions.slice(0, 2));
      console.log('unspent', this.activeWallet.unspent.slice(0, 2));
      console.log('external', this.activeWallet.external.slice(0, 3));
      console.log('internal', this.activeWallet.internal.slice(0, 3));
      
      this.keepAliveTimer = setInterval(() => {
        console.log('[Wallet Module] Keep Alive');
        this._wallet.keepAlive();
      }, (5 * 60 * 1000));
    });

    this._wallet.on('NewBlockFound', (event: EventData) => {
      console.log(`[Wallet Module] Block -- ${event.object['chainStats'].blockheight}`);
      this.blockheight = event.object['chainStats'].blockheight;
      this._change.detectChanges();
    });
  }

  ngOnInit() {
    let self = this;

    this.page.on('navigatingFrom', async (data) => {
      console.log('[Wallet Module] Am navigating away...');

      clearTimeout(this.reconnectTimer);
      clearInterval(this.keepAliveTimer);
      self._wallet.off('NewBlockFound');
      self._wallet.off('WalletReady');
      await self._wallet.cancelSubscriptions();
      console.log('[Wallet Module] Subscriptions cancelled...');
      console.dir(this._wallet.walletData);
    });

    if ((!this._wallet.walletData.loaded || !this._wallet.walletData.subscribed) && !this._wallet.walletData.busy) {
      console.log('[Wallet Module] Reconnecting...');

      this.reconnectTimer = setTimeout(() => {
        this._wallet.reconnect(this._wallet.wallets[0].coin)
        .then((loaded) => {
          console.log('[Wallet Module] Connection re-established');
        })
        .catch((err) => {
          console.log('[Wallet Module] Unable to reconnect');
        });
      }, 1000);
    }
  }

  ngAfterViewInit() {
    console.log('AFTER VIEW INIT');

    
  }

  ngOnDestroy() {
    console.log('ON DESTROY');
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
