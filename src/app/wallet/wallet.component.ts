import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TabView } from "tns-core-modules/ui/tab-view";
import { Image } from "tns-core-modules/ui/image";
import { isAndroid, isIOS, device } from "platform";
import * as app from "tns-core-modules/application";
import { EventData } from "tns-core-modules/data/observable";
import { alert } from "tns-core-modules/ui/dialogs";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import { Page } from "ui/page";
import { WalletModel } from '~/app/shared/wallet.model';

@Component({
	moduleId: module.id,
	selector: 'wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  @ViewChild("tabView") tabView: ElementRef;
  public tabSelectedIndex: number;
  public selectedWalletId: number;
  public walletData: any;

	constructor(
    private page: Page,
    private _wallet: WalletModel
  ) {
    this.tabSelectedIndex = 1;
    this.selectedWalletId = 0;
    this.walletData = this._wallet.walletData;
  }

  ngOnInit() { }

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
