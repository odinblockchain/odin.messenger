import { Component, OnInit } from '@angular/core';
import { Page } from "ui/page";
import { ScrollView, ScrollEventData } from 'tns-core-modules/ui/scroll-view';
import { EventData } from "tns-core-modules/data/observable";
import { View } from 'tns-core-modules/ui/core/view';
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { TouchGestureEventData } from "tns-core-modules/ui/gestures";
import { GridLayout } from "ui/layouts/grid-layout";
import { RouterExtensions } from "nativescript-angular/router";
import { UserModel, IRemoteContact } from '../shared/user.model';

@Component({
	moduleId: module.id,
	selector: 'messages',
	templateUrl: './messages.component.html',
	styleUrls: ['./messages.component.css']
})

export class MessagesComponent implements OnInit {
  public friends: IRemoteContact[];

	constructor(
    private _page: Page,
    private _router: RouterExtensions,
    private _user: UserModel) {
    // this._page.actionBarHidden = true;
  }

  ngOnInit() {
    this.friends = this._user.friends;
  }
  
  onAddContact() {
    console.log('CTA::AddContact');
    this._router.navigate(["/contact-add"], {
      transition: {
        name: "slideLeft"
      }
    });
  }

  /**
   * Toggles the classname `-active` to the GridLayout DOM element
   * when a user first presses down and lifts up. This provides
   * feedback to the user about their action.
   * 
   * @param args Event data passed from TouchGesture
   */
  onTouchContact(args: TouchGestureEventData) {
    if (args.action === 'down') {
      let gridLayout = args.object as GridLayout;
      gridLayout.className = "contact -active";
    } else if (args.action === 'up') {
      let gridLayout = args.object as GridLayout;
      gridLayout.className = "contact";
    }
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }
}
