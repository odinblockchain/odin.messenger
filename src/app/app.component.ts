import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
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
import * as Clipboard from 'nativescript-clipboard';
import { SnackBar } from "nativescript-snackbar";

import { UserModel } from '~/app/shared/user.model';
import { PreferencesService } from '~/app/shared/preferences.service';
import { messaging, Message } from "nativescript-plugin-firebase/messaging";

const firebase = require("nativescript-plugin-firebase");

registerElement('Fab', () => require('nativescript-floatingactionbutton').Fab);

const getCircularReplacer = () => {
  const seen = new WeakSet;
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

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

// seconds
const MESSENGER_REFRESH_DELAY = 15;

// minutes
const WALLET_REFRESH_DELAY = 5;

@Component({
  moduleId: module.id,
  selector: 'ns-app',
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private _activatedUrl: string;
  private _sideDrawerTransition: DrawerTransitionBase;
  private _fetchMessages: any;
  private _fetchWallet: any;
  public initAttempts: number;
  private _loading: boolean;
  private _ready: boolean;
  private _sb: any;

  public userAccount: any;
  public connected: boolean;
  public isWalletView: boolean;
  public networkState: string;
  public osmServerError: boolean;
  public packageVersion: string;

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
    private _Log: LogService,
    private _zone: NgZone,
    private _snack: SnackBar
  ) {
    this._sb          = new SnackBar();
    this._loading     = false;
    this._ready       = false;
    this.connected    = true;
    this.initAttempts = 0;

    this.postInit = this.postInit.bind(this);
    this.setNetworkState = this.setNetworkState.bind(this);
    this.packageVersion = global.version ? global.version : '0.3.x';

    this.setNetworkState(getConnectionType());
    startMonitoring(this.setNetworkState);
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

    // rebuild services if the network is disabled
    // odd bug noticed that sqlite connections appear to drop when switching off data
    // if ((this._ready && !this._loading) && this.networkState === 'none') {
    //   this.buildServices();
    // }
  }

  ngOnDestroy(): void {
    stopMonitoring();
  }

  ngOnInit(): void {
    this._activatedUrl = '/splashscreen';
    this._sideDrawerTransition = new SlideInOnTopTransition();
    this.userAccount = this.userModel.saveData; //TODO REMOVE
    this.isWalletView = false;

    // this.adjustStatusBar();

    // console.log('EVENTS', {
    //   suspend: hasListeners(suspendEvent),
    //   resume: hasListeners(resumeEvent)
    // });
    firebase.init({
      // Optionally pass in properties for database, authentication and cloud messaging,
      // see their respective docs.
      showNotifications: true,
      showNotificationsWhenInForeground: true
    }).then(() => {
      console.log("firebase.init done");
    }, (error) => {
      console.log(`firebase.init error: ${error}`);
    });

    // messaging.registerForPushNotifications({
    //   onPushTokenReceivedCallback: (token: string): void => {
    //     console.log("Firebase plugin received a push token: " + token);
    //   },
    
    //   onMessageReceivedCallback: (message: Message) => {
    //     console.log("Push message received: " + message.title);
    //   },
    
    //   // Whether you want this plugin to automatically display the notifications or just notify the callback. Currently used on iOS only. Default true.
    //   showNotifications: true,
    
    //   // Whether you want this plugin to always handle the notifications when the app is in foreground. Currently used on iOS only. Default false.
    //   showNotificationsWhenInForeground: true
    // }).then(() => console.log("Registered for push"));

    this.createEventListeners = this.createEventListeners.bind(this);
    this.createPlatformListeners = this.createPlatformListeners.bind(this);

    this.createEventListeners();
    this.createPlatformListeners();
  }

  ngAfterViewInit(): void {
    console.log('[App] AfterViewInit');
    this.buildServices();
    this._Account.eventStream$.subscribe(event => {
      console.log('Account Event', event)
      if (event === 'AccountService::registerNewAccountSuccess') {
        console.log('Handle onRegister');
        if (!this.userAccount) {
          this.postInit();
        }
      }
    });
  }

  /**
   * Attempt to build necessary App Services
   * After x attempts, abort boot procedure
   */
  private buildServices(): void {
    if (this.initAttempts >= 4) {
      console.log('[App] MAX ATTEMPTS to build services... Abort...');
      this._loading     = false;
      this._ready       = false;
      this.initAttempts = 0;

      this._storage.listAllTables()
      .then(tables => {
        console.log('[App] DEBUG Current Tables:');
        console.dir(tables);
      });
      return;
    }

    this._loading = true;
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
  private async postInit() {
    // set local useraccount to the activeAccount of Identity
    this.initAttempts = 0;
    this._loading     = false;
    this._ready       = true;
    this.userAccount  = this._Identity.getActiveAccount();

    if (this.userAccount) {
      this.userAccount.client = this._Client.findClientById(this.userAccount.client_id);
    }

    console.log(`Notifications check --
    Enabled:  ${messaging.areNotificationsEnabled()}
    Token:    ${await firebase.getCurrentPushToken()}
    \n`);

    await this._Preferences.loadPreferences();
    console.log(`Initial preferences check --
    Preferences:  ${JSON.stringify(this._Preferences.preferences)}`);

    this._Identity.identity.fcmToken = await firebase.getCurrentPushToken();

    // messaging.registerForPushNotifications({
    //   onPushTokenReceivedCallback: (token: string): void => {
    //     console.log("1Firebase plugin received a push token: " + token);
    //   },

    //   onMessageReceivedCallback: (message: Message) => {
    //     console.log("1Push message received in push-view-model: " + JSON.stringify(message, getCircularReplacer()));
    //   },

    //   // Whether you want this plugin to automatically display the notifications or just notify the callback. Currently used on iOS only. Default true.
    //   // showNotifications: true,

    //   // Whether you want this plugin to always handle the notifications when the app is in foreground.
    //   // Currently used on iOS only. Default false.
    //   // When false, you can still force showing it when the app is in the foreground by adding 'showWhenInForeground' to the notification as mentioned in the readme.
    //   // showNotificationsWhenInForeground: true
    // }).then(() => console.log("Registered for push"));

    messaging.addOnPushTokenReceivedCallback(
      token => {
        // you can use this token to send to your own backend server,
        // so you can send notifications to this specific device
        console.log("2Firebase plugin received a push token: " + token);
        // var pasteboard = utils.ios.getter(UIPasteboard, UIPasteboard.generalPasteboard);
        // pasteboard.setValueForPasteboardType(token, kUTTypePlainText);
      }
    );

    messaging.addOnMessageReceivedCallback(
      message => {
        console.log("Notification message received in push-view-model: " + JSON.stringify(message, getCircularReplacer()));
        console.log(message);

        // display snack notification if already within app AND not in a message view
        if ( (this.router.url.match(new RegExp('messenger/message','ig'))) ) {
          this._snack.simple(`${message.title} – ${message.body}`, '#ffffff', '#333333', 3, false);
        }
        
        return true;
      }
    ).then(() => {
      console.log("Added addOnMessageReceivedCallback");
    }, err => {
      console.log("Failed to add addOnMessageReceivedCallback: " + err);
    });

    this.fetchRemoteMessages();
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

      // if (_this._fetchMessages) {
      //   clearInterval(_this._fetchMessages);
      //   _this._fetchMessages = false;
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
    });

    this.userModel.on('ContactsRestored', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
    });

    this.userModel.on('NoConnection', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.connected = false;
      // clearInterval(_this._fetchMessages);
    });

    this.userModel.on('Connected', function(eventData) {
      console.log(`[App] (UserModel) Event:${eventData.eventName}`);
      // _this.connected = true;
    });
  }

  cbParseTextAndUrl(argIntent) {
    var Intent_1 = android.content.Intent;

    var Patterns = android.util.Patterns;
    //let Matcher = java.util.regex.Matcher;
    var ListUrl = [];
    var text = argIntent.getStringExtra(Intent_1.EXTRA_TEXT);
    if (new String().valueOf() !== "null") {
        var Matcher = Patterns.WEB_URL.matcher(text);
        while (Matcher.find()) {
            var url = Matcher.group();
            ListUrl.push(url);
        }
        return { "text": text, "listUrl": ListUrl };
    }
  }

  cbParseImageUrl(argIntent) {
    var Intent_1 = android.content.Intent;
    var imageUri = argIntent.getParcelableExtra(Intent_1.EXTRA_STREAM);
    if (imageUri != null) {
        // Update UI to reflect image being shared
        return imageUri;
    }
  }

  private createPlatformListeners() {
    if (hasListeners(launchEvent)) applicationOff(launchEvent, this.onApplicationLaunch, this);
    if (hasListeners(displayedEvent)) applicationOff(displayedEvent, this.onApplicationLaunch, this);
    if (hasListeners(suspendEvent)) applicationOff(suspendEvent, this.onApplicationSuspend, this);
    if (hasListeners(resumeEvent)) applicationOff(resumeEvent, this.onApplicationResume, this);
    if (hasListeners(uncaughtErrorEvent)) applicationOff(uncaughtErrorEvent, this.onApplicationError, this);

    console.log('@!@ CHECK LISTENERS?', `
      launch: ${hasListeners(launchEvent)}
      displayed: ${hasListeners(displayedEvent)}
      suspent: ${hasListeners(suspendEvent)}
      resume: ${hasListeners(resumeEvent)}
      error: ${hasListeners(uncaughtErrorEvent)}
    `)

    applicationOn(launchEvent, this.onApplicationLaunch, this);
    applicationOn(displayedEvent, this.onApplicationReady, this);
    applicationOn(suspendEvent, this.onApplicationSuspend, this);
    applicationOn(resumeEvent, this.onApplicationResume, this);
    applicationOn(uncaughtErrorEvent, this.onApplicationError, this);
    
    if (isAndroid) {
      applicationOn(AndroidApplication.activityCreatedEvent, (args) => {
        console.log('[App] ANDROID onCreated');
      });

      applicationOn(AndroidApplication.activityResumedEvent, (args) => {
        console.log('[App] ANDROID onResumed');

        // console.log("Event: " + args.eventName + ", Activity: " + args.activity);
        // var a = args.activity;
        // try {
        //   var Intent_1 = android.content.Intent;
        //   var actionSend = Intent_1.ACTION_SEND;
        //   var actionSendMultiple = Intent_1.ACTION_SEND_MULTIPLE;
        //   var argIntent = a.getIntent();
        //   var argIntentAction = argIntent.getAction();
        //   var argIntentType = argIntent.getType();
        //   console.log(" ~~~~ Intent is ~~~~ :" + new String(argIntent.getAction()).valueOf());
        //   String.prototype.startsWith = function (str) {
        //       return this.substring(0, str.length) === str;
        //   };
        //   if (new String(argIntentAction).valueOf() === new String(Intent_1.ACTION_SEND).valueOf()) {
        //     if (new String(argIntentType).valueOf() === new String("text/plain").valueOf()) {
        //       console.dir(this.cbParseTextAndUrl(argIntent));
        //     }
        //     else if (argIntentType.startsWith("image/")) {
        //       console.log(this.cbParseImageUrl(argIntent));
        //     }
        //   }
        // }
        // catch (e) {
        //   console.log(e);
        // }
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
    console.log('[App] Event: onApplicationLaunch @!@');
  }

  onApplicationError(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationError @!@');
    console.log(args);
  }

  onApplicationReady(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationReady @!@');
  }

  onApplicationExit(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationExit @!@');
  }

  onApplicationResume(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationResume @!@');

    if (!this._fetchMessages) {
      console.log('@!@ setup ping server');
      clearInterval(this._fetchMessages);

      this._fetchMessages = setInterval(() => {

        console.log('@!@ make server ping');
        this.fetchRemoteMessages();
      }, (MESSENGER_REFRESH_DELAY * 1000));

      this._fetchWallet = setInterval(() => {
        console.log('@!@ make wallet ping');
        this.fetchRemoteWallet();
      }, (WALLET_REFRESH_DELAY * 60 * 1000));
    }
  }

  onApplicationSuspend(args: ApplicationEventData) {
    console.log('[App] Event: onApplicationSuspend @!@');

    if (this._fetchMessages) {
      clearInterval(this._fetchMessages);
      this._fetchMessages = null;
      console.log('@!@ clear ping server');
    }

    if (this._fetchWallet) {
      clearInterval(this._fetchWallet);
      this._fetchWallet = null;
      console.log('@!@ clear ping wallet');
    }
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

  public onCopyText(text: string) {
    let sb = this._sb;
    Clipboard.setText(text)
    .then(async function() {
      try {
        await sb.simple('Username copied to clipboard!', '#ffffff', '#333333', 3, false);
        console.log('Clipboard success');
      } catch (err) {
        console.log('Unable to copy to clipboard');
      }
    });
  }

  private fetchRemoteWallet() {
    try {
      const identity = this._Identity.getActiveAccount();
      if (!identity || !identity.registered) return;
      
      if (!this._Wallet.electrumxConnected) {
        console.log('[App] Ignore wallet refresh, not connected');
      } else {
        console.log('[App] Begin wallet refresh');
        const wallet = this._Wallet.wallets$.getItem(0);
        this._Wallet.refreshWallet(wallet);
      }
    } catch (err) {
      console.log('[App] Unable to pull refresh wallet');
      console.log(err.message ? err.message : err);
    }
  }

  private fetchRemoteMessages() {
    if (this._Identity.getActiveAccount()) {
      this._zone.run(() => {
        try {
          const identity = this._Identity.getActiveAccount();
          if (identity.registered) {
            
            /**
             * @todo Bug: New identity not receiving preferences
             */
            if (!identity.preferences) {
              identity.preferences = this._Preferences.preferences;
            }

            identity.fetchRemoteMessages()
            .then(() => {
              console.log('[App] Messages up to date');
              this.osmServerError = false;
            }).catch((err) => {
              console.log('[App] Fetch messages error', err.message ? err.message : err);
              this.osmServerError = true;
            });
          }
        } catch (err) {
          console.log('[App] Unable to pull remote messages');
          console.log(err.message ? err.message : err);
        }
      });
    } else {
      console.log('NO ACTIVE ACCOUNT -- UNABLE TO FETCH MESSAGES');
    }
  }
}
