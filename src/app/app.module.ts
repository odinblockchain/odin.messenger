import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StorageService } from './shared/storage.service';
import { PreferencesService } from './shared/preferences.service';
import { UserModel } from './shared/user.model';
import { WalletModel } from './shared/wallet.model';
import { OSMClientService } from './shared/osm-client.service';
import { SnackBar } from '@nstudio/nativescript-snackbar';
import { WalletClientService } from './shared/wallet-client.service';
import { RouteReuseStrategy } from '@angular/router';
import { CustomRouteReuse } from './custom-route-reuse';

@NgModule({
  // Bootstrap – Creates components in declarations and inserts into DOM
  bootstrap: [
    AppComponent
  ],
  // Providers – Services this module needs to function properly, available globally if defined here
  providers: [
    StorageService,
    PreferencesService,
    OSMClientService,
    WalletClientService,
    UserModel,
    WalletModel,
    SnackBar,
    { provide: RouteReuseStrategy, useClass: CustomRouteReuse }
  ],
  // Imports – Other modules that this module needs to function properly
  imports: [
    AppRoutingModule,
    NativeScriptModule,
    NativeScriptUISideDrawerModule,
    NativeScriptUIListViewModule
  ],
  // Declarations – What components belong to this module
  declarations: [
    AppComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class AppModule { }
