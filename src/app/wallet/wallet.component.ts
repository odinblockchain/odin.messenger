import { Component, OnInit } from '@angular/core';
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "application";
import { alert } from "tns-core-modules/ui/dialogs";

@Component({
	moduleId: module.id,
	selector: 'wallet',
	templateUrl: './wallet.component.html',
	styleUrls: ['./wallet.component.css']
})

export class WalletComponent implements OnInit {

	constructor() { }

  ngOnInit() { }
  
  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  onRefreshWallet() {
    alert('This feature is not available yet!');
  }
}
