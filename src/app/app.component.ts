import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { registerElement } from 'nativescript-angular/element-registry';
import * as app from 'tns-core-modules/application';
import * as platformModule from 'tns-core-modules/platform';
import { Observable, Page, PropertyChangeData } from 'tns-core-modules/ui/page/page';
import { setInterval, clearInterval } from 'tns-core-modules/timer';
import { isAndroid, isIOS, device, screen } from 'tns-core-modules/platform';
import { DrawerTransitionBase, RadSideDrawer, SlideInOnTopTransition } from 'nativescript-ui-sidedrawer';
import { filter } from 'rxjs/operators';

import { UserModel } from '~/app/shared/user.model';
import { PreferencesService } from '~/app/shared/preferences.service';

registerElement('Fab', () => require('nativescript-floatingactionbutton').Fab);

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
} from 'tns-core-modules/application';
import { StorageService } from './shared';
import { AccountService, ContactService, CoinService, WalletService, AddressService } from './shared/services';
import { Identity } from './shared/models/identity/identity.model';
import { IdentityService } from './shared/services/identity.service';
import { ClientService } from './shared/services/client.service';
import { LogService } from './shared/services/log.service';
import {
  connectionType,
  getConnectionType,
  startMonitoring,
  stopMonitoring
} from 'tns-core-modules/connectivity';

declare var android: any;

@Component({
  moduleId: module.id,
  selector: 'ns-app',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private _activatedUrl: string;
  private _sideDrawerTransition: DrawerTransitionBase;
  private _pingServer: any;
  public initAttempts: number;

  public userAccount: any;
  public connected: boolean;
  public isWalletView: boolean;
  public networkState: string;

  constructor(
    private router: Router,
    private routerExtensions: RouterExtensions,
    private userModel: UserModel,
    private _storage: StorageService,
    private _pref: PreferencesService,
    private _Identity: IdentityService,
    private _Account: AccountService,
    private _Client: ClientService,
    private _Contact: ContactService,
    private _Coin: CoinService,
    private _Wallet: WalletService,
    private _Address: AddressService,
    private _Preferences: PreferencesService,
    private _Log: LogService
  ) {
    this.connected    = true;
    this.initAttempts = 0;

    this.setNetworkState(getConnectionType());

    this.postInit = this.postInit.bind(this);
    this.setNetworkState = this.setNetworkState.bind(this);

    console.log('connection', getConnectionType());

    startMonitoring(this.setNetworkState);

    // const conType = ({
    //   `${connectionType.none}`: 'no connection',

    // })[getConnectionType()];

    // console.log(connectionType);
  }

  setNetworkState(connection) {
    switch (connection) {
      case connectionType.none:
        this.networkState = 'none';
        break;
      case connectionType.wifi:
        this.networkState = 'wifi';
        break;
      case connectionType.mobile:
        this.networkState = 'mobile';
        break;
      case connectionType.ethernet:
        this.networkState = 'ethernet';
        break;
      default:
        this.networkState = 'unknown';
        break;
    }

    console.log(`CONNECTION TYPE DETECTED – ${this.networkState}`);
  }

  ngOnDestroy(): void {
    stopMonitoring();
  }

  ngOnInit(): void {
    this._activatedUrl = '/splashscreen';
    this._sideDrawerTransition = new SlideInOnTopTransition();
    this.userAccount = this.userModel.saveData; //TODO REMOVE
    this.isWalletView = false;

    this.adjustStatusBar();

    console.log('EVENTS', {
      suspend: hasListeners(suspendEvent),
      resume: hasListeners(resumeEvent)
    });

    this.createEventListeners = this.createEventListeners.bind(this);
    this.createPlatformListeners = this.createPlatformListeners.bind(this);

    this.createEventListeners();
    this.createPlatformListeners();
  }

  ngAfterViewInit(): void {
    console.log('[App] AfterViewInit');
    this.buildServices();
  }

  /**
   * Attempt to build necessary App Services
   * After x attempts, abort boot procedure
   */
  private buildServices(): void {
    if (this.initAttempts >= 4) {
      console.log('[App] MAX ATTEMPTS to build services... Abort...');
      this._storage.listAllTables()
      .then(tables => {
        console.log('[App] DEBUG Current Tables:');
        console.dir(tables);
      });
      return;
    }

    this.initAttempts++;
    this._storage.loadStorage(false)
    .then(this._Preferences.loadPreferences)
    .then(this._Preferences.savePreferences)
    .then(this._Identity.init)
    .then(this._Account.init)
    .then(this._Client.init)
    .then(this._Contact.init)
    .then(this._Coin.init)
    .then(this._Wallet.init)
    .then(this._Address.init)
    .then(this._Log.init)
    .then(this._Identity.setActiveAccount)
    .then(this.postInit)
    .catch((err) => {
      console.log('[App] Init error error');
      console.log(err);

      console.log('[App] Init retrying...');
      this.buildServices();
    });
  }

  /**
   * Methods to execute after services are initialized
   */
  private postInit() {
    // set local useraccount to the activeAccount of Identity
    this.userAccount = this._Identity.getActiveAccount();
    if (this.userAccount) {
      this.userAccount.client = this._Client.findClientById(this.userAccount.client_id);
      console.log('set client');
      console.dir(this.userAccount);
    }
  }

  private createEventListeners() {
    this.router.events
    .pipe(filter((event: any) => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => this._activatedUrl = event.urlAfterRedirects);

    this.userModel.addEventListener(Observable.propertyChangeEvent, (args: PropertyChangeData) => {
      console.log('[App] onAccountModelUpdate', {
        eventName: args.eventName,
        propertyName: args.propertyName,
        newValue: args.value,
        oldValue: args.oldValue
      }); 
    });

    this.userModel.on('ClearSession', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.userAccount = eventData.object['saveData'];

      // if (_this._pingServer) {
      //   clearInterval(_this._pingServer);
      //   _this._pingServer = false;
      // }
    });

    this.userModel.on('SaveDataPurged', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.userAccount = eventData.object['saveData'];
    });

    this.userModel.on('SessionRestored', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.userAccount = eventData.object['saveData'];
    });

    this.userModel.on('IdentityRegistered', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);

      // if (!_this._pingServer) {
      //   clearInterval(this._pingServer);
        // _this._pingServer = setInterval(() => {
        //   if (_this.userModel.osmConnected) {
        //     console.log(`[App] Ping Server...`);
        //     _this.userModel.fetchMessages();
        //   }
        // }, (15 * 1000));
      // }
    });

    this.userModel.on('ContactsRestored', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
    });

    this.userModel.on('NoConnection', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.connected = false;
      // clearInterval(_this._pingServer);
    });

    this.userModel.on('Connected', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.connected = true;
    });
  }

  private createPlatformListeners() {
    if (!hasListeners(launchEvent)) applicationOn(launchEvent, this.onApplicationLaunch, this);
    if (!hasListeners(displayedEvent)) applicationOn(displayedEvent, this.onApplicationReady, this);
    if (!hasListeners(suspendEvent)) applicationOn(suspendEvent, this.onApplicationSuspend, this);
    if (!hasListeners(resumeEvent)) applicationOn(resumeEvent, this.onApplicationResume, this);
    if (!hasListeners(uncaughtErrorEvent)) applicationOn(uncaughtErrorEvent, this.onApplicationError, this);
    
    if (isAndroid) {
      
      applicationOn(AndroidApplication.activityCreatedEvent, (args) => {
        console.log('[App] ANDROID onCreated');
      });

      applicationOn(AndroidApplication.activityDestroyedEvent, (args) => {
        console.log('[App] ANDROID onDestroyed');
      });

      applicationOn(AndroidApplication.activityStartedEvent, (args) => {
        console.log('[App] ANDROID onStarted');
      });

      applicationOn(AndroidApplication.saveActivityStateEvent, (args) => {
        console.log('[App] ANDROID onSaveActivity');
      });

      console.log('[App] Setup Android Listeners');
    }
  }

  onApplicationLaunch(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationLaunch');
  }

  onApplicationError(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationError');
    console.log(args);
  }

  onApplicationReady(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationReady');
  }

  onApplicationExit(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationExit');
  }

  onApplicationResume(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationResume');

    // if (!this._pingServer) {
      // clearInterval(this._pingServer);
      // this._pingServer = setInterval(() => {
      //   if (this.userModel.osmConnected) {
      //     console.log(`[App] Ping Server...`);
      //     this.userModel.fetchMessages();
      //   }
      // }, (15 * 1000));
    // }
  }

  onApplicationSuspend(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationSuspend');

    // if (this._pingServer) {
    //   clearInterval(this._pingServer);
    //   this._pingServer = false;
    // }
  }

  adjustStatusBar() {
    if (platformModule.isAndroid && platformModule.device.sdkVersion >= '21') {
      console.log('[App] adjustStatusBar');
      // console.log('MET CRITERIA');
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
      console.log('[App] BAD adjustStatusBar');
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
