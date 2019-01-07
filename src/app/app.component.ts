import { Component, OnInit, ViewChild } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { DrawerTransitionBase, RadSideDrawer, SlideInOnTopTransition } from "nativescript-ui-sidedrawer";
import { filter } from "rxjs/operators";
import { UserModel } from './shared/user.model';
import { PreferencesService } from './shared/preferences.service';
import * as app from "tns-core-modules/application";
import * as platformModule from 'tns-core-modules/platform';
import { Observable, Page, PropertyChangeData } from "tns-core-modules/ui/page/page";
import { registerElement } from 'nativescript-angular/element-registry';
import { setInterval, clearInterval } from "tns-core-modules/timer";
import { interval } from "rxjs";

registerElement('Fab', () => require('nativescript-floatingactionbutton').Fab);

// import { app } from 'application';
// import * as applicationModule from "tns-core-modules/application";

import {resumeEvent, suspendEvent, ApplicationEventData, on as applicationOn, run as applicationRun } from "tns-core-modules/application";

declare var android: any;

@Component({
  moduleId: module.id,
  selector: "ns-app",
  templateUrl: "app.component.html"
})
export class AppComponent implements OnInit {
  private _activatedUrl: string;
  private _sideDrawerTransition: DrawerTransitionBase;
  private _pingServer: any;
  public userAccount: any;
  public connected: boolean;

  constructor(
    private router: Router,
    private routerExtensions: RouterExtensions,
    private userModel: UserModel,
    private _pref: PreferencesService) {
      this.connected = true;
  }

  ngOnInit(): void {
    this._activatedUrl = "/splashscreen";
    this._sideDrawerTransition = new SlideInOnTopTransition();
    this.userAccount = this.userModel.saveData;

    this.userModel.addEventListener(Observable.propertyChangeEvent, (args: PropertyChangeData) => {
      console.log('onAccountModelUpdate', {
        eventName: args.eventName,
        propertyName: args.propertyName,
        newValue: args.value,
        oldValue: args.oldValue
      });
    });

    let _this = this;
    this.userModel.on("ClearSession", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
      _this.userAccount = eventData.object['saveData'];

      if (_this._pingServer) {
        clearInterval(_this._pingServer);
        _this._pingServer = false;
      }
    });

    this.userModel.on("SaveDataPurged", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
      _this.userAccount = eventData.object['saveData'];
    });

    this.userModel.on("SessionRestored", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
      _this.userAccount = eventData.object['saveData'];
    });

    this.userModel.on("IdentityRegistered", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);

      if (!_this._pingServer) {
        clearInterval(this._pingServer);
        _this._pingServer = setInterval(() => {
          if (_this.userModel.osmConnected) {
            console.log(`[App] Ping Server...`);
            _this.userModel.fetchMessages();
          }
        }, (15 * 1000));
      }
    });

    this.userModel.on("ContactsRestored", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
    });

    this.userModel.on("NoConnection", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
      _this.connected = false;
      clearInterval(_this._pingServer);
    });

    this.userModel.on("Connected", function(eventData) {
      console.log(`[UserModel Event] --- ${eventData.eventName}`);
      _this.connected = true;
    });

    this.router.events
    .pipe(filter((event: any) => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => this._activatedUrl = event.urlAfterRedirects);

    this.adjustStatusBar();

    applicationOn(suspendEvent, (args: ApplicationEventData) => {
      console.log("[App] Suspend OSM...");
      if (_this._pingServer) {
        clearInterval(_this._pingServer);
        _this._pingServer = false;
      }
    });

    applicationOn(resumeEvent, (args: ApplicationEventData) => {
      console.log("[App] Resume OSM...");

      if (!_this._pingServer) {
        clearInterval(_this._pingServer);
        _this._pingServer = setInterval(() => {
          if (_this.userModel.osmConnected) {
            console.log(`[App] Ping Server...`);
            _this.userModel.fetchMessages();
          }
        }, (15 * 1000));
      }
    });
  }

  adjustStatusBar() {
    console.log('...adjust status bar');
    if (platformModule.isAndroid && platformModule.device.sdkVersion >= '21') {
      console.log('MET CRITERIA');
      // const activity = app.android.startActivity;
      // const win = activity.getWindow();
      // win.addFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
      // win.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
      
      // var window = app.android.startActivity.getWindow();
      // // set the status bar to Color.Transparent
      // window.setStatusBarColor(0x000000);

      // var decorView = window.getDecorView();
      // decorView.setSystemUiVisibility(
      //     View.SYSTEM_UI_FLAG_LAYOUT_STABLE
      //     | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
      //     | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
          
      //     // | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
      //     // | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
      //     | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    } else {
      console.log(`Nope... ${platformModule.isAndroid} ... ${platformModule.device.sdkVersion}`);
    }

    // if (app.android && platform.device.sdkVersion >= '21') {
    //   var window = app.android.startActivity.getWindow();
    //   // set the status bar to Color.Transparent
    //   window.setStatusBarColor(0x000000);

    //   var decorView = window.getDecorView();
    //   decorView.setSystemUiVisibility(
    //       View.SYSTEM_UI_FLAG_LAYOUT_STABLE
    //       | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
    //       | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    //       // | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide nav bar
    //       // | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
    //       | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    // }
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  isComponentSelected(url: string): boolean {
    return this._activatedUrl === url;
  }

  onNavItemTap(navItemRoute: string): void {
    this.routerExtensions.navigate([navItemRoute], {
        transition: {
            name: "fade"
        }
    });

    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.closeDrawer();
  }
}
