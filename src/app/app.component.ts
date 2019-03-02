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
import { isAndroid, isIOS, device, screen } from "tns-core-modules/platform";

registerElement('Fab', () => require('nativescript-floatingactionbutton').Fab);

// import { app } from 'application';
// import * as applicationModule from "tns-core-modules/application";

import {
  AndroidApplication,
  uncaughtErrorEvent,
  launchEvent,
  displayedEvent,
  exitEvent,
  resumeEvent,
  suspendEvent,
  hasListeners,
  ApplicationEventData,
  on as applicationOn,
  off as applicationOff,
  run as applicationRun
} from "tns-core-modules/application";

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
  public isWalletView: boolean;

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
    this.isWalletView = false;

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
        // _this._pingServer = setInterval(() => {
        //   if (_this.userModel.osmConnected) {
        //     console.log(`[App] Ping Server...`);
        //     _this.userModel.fetchMessages();
        //   }
        // }, (15 * 1000));
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

    console.log('EVENTS', {
      suspend: hasListeners(suspendEvent),
      resume: hasListeners(resumeEvent)
    });

    // if (!hasListeners(launchEvent)) applicationOn(launchEvent, this.onApplicationLaunch, this);
    // if (!hasListeners(displayedEvent)) applicationOn(displayedEvent, this.onApplicationReady, this);
    if (!hasListeners(suspendEvent)) applicationOn(suspendEvent, this.onApplicationSuspend, this);
    if (!hasListeners(resumeEvent)) applicationOn(resumeEvent, this.onApplicationResume, this);
    if (!hasListeners(uncaughtErrorEvent)) applicationOn(uncaughtErrorEvent, this.onApplicationError, this);
    
    if (isAndroid) {
      console.log('...android');
      
      applicationOn(AndroidApplication.activityCreatedEvent, (args) => {
        console.log('[App] CREATED');
      });

      applicationOn(AndroidApplication.activityDestroyedEvent, (args) => {
        console.log('[App] DESTROYED');
      });

      applicationOn(AndroidApplication.activityStartedEvent, (args) => {
        console.log('[App] STARTED');
      });

      applicationOn(AndroidApplication.saveActivityStateEvent, (args) => {
        console.log('[App] SAVE THIS');
      });

      applicationOn(AndroidApplication.saveActivityStateEvent, (args) => {
        console.log('[App] SAVE THIS');
      });
    }
  }

  onApplicationLaunch(args: ApplicationEventData) {
    console.log('[App] Launch ODIN...');
  }

  onApplicationError(args: ApplicationEventData) {
    console.log('[App] Error ODIN...', args);
  }

  onApplicationReady(args: ApplicationEventData) {
    console.log('[App] Ready ODIN...');
  }

  onApplicationExit(args: ApplicationEventData) {
    console.log('[App] Exit ODIN...');
  }

  onApplicationResume(args: ApplicationEventData) {
    console.log("[App] Resume ODIN...");

    if (!this._pingServer) {
      // clearInterval(this._pingServer);
      // this._pingServer = setInterval(() => {
      //   if (this.userModel.osmConnected) {
      //     console.log(`[App] Ping Server...`);
      //     this.userModel.fetchMessages();
      //   }
      // }, (15 * 1000));
    }
  }

  onApplicationSuspend(args: ApplicationEventData) {
    console.log("[App] Suspend ODIN...");

    if (this._pingServer) {
      clearInterval(this._pingServer);
      this._pingServer = false;
    }
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
    console.log(`[App] NavigateTo [${navItemRoute}]`);

    if (navItemRoute === '/wallet') this.isWalletView = true;

    this.routerExtensions.navigate([navItemRoute], {
      transition: {
        name: (this.isWalletView) ? 'flip' : 'fade'
      }
    });

    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.closeDrawer();
    this.isWalletView = false;
  }
}
