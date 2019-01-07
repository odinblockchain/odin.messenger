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

  onTapWebsite() {
    utilityModule.openUrl('https://obsidianplatform.com/');
  }

  onTapTwitter() {
    utilityModule.openUrl('https://twitter.com/obsidiancrypto');
  }

  onTapDiscord() {
    utilityModule.openUrl('https://discord.gg/Wyagm4f');
  }

  onTapReddit() {
    utilityModule.openUrl('https://www.reddit.com/r/ObsidianProject');
  }
}
