import { Component, OnInit } from '@angular/core';
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "application";
import { alert } from "tns-core-modules/ui/dialogs";
import * as utilityModule from "utils/utils";

@Component({
	moduleId: module.id,
	selector: 'help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

	constructor() { }

  ngOnInit() { }
  
  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

  openChat() {
    utilityModule.openUrl('https://odin.chat/');
  }

  openWebsite() {
    utilityModule.openUrl('https://odinblockchain.org/');
  }

  openTwitter() {
    utilityModule.openUrl('https://twitter.com/odinblockchain');
  }

  openFacebook() {
    utilityModule.openUrl('https://www.facebook.com/OdinBlockchain/');
  }

  openDiscord() {
    utilityModule.openUrl('https://discord.me/odinblockchain');
  }

  openTelegram() {
    utilityModule.openUrl('https://t.me/odinblockchain');
  }

  openReddit() {
    utilityModule.openUrl('http://reddit.com/r/odinblockchain');
  }
}
