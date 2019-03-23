import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptUISideDrawerModule } from 'nativescript-ui-sidedrawer/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { StorageService } from './shared/storage.service';
import { PreferencesService } from './shared/preferences.service';
import { UserModel } from './shared/user.model';
import { WalletModel } from './shared/wallet.model';
import { OSMClientService } from './shared/osm-client.service';
import { SnackBar, SnackBarOptions } from 'nativescript-snackbar';
import { WalletClientService } from './shared/wallet-client.service';

@NgModule({
  bootstrap: [
    AppComponent
  ],
  providers: [
    StorageService,
    PreferencesService,
    OSMClientService,
    WalletClientService,
    UserModel,
    WalletModel,
    SnackBar
  ],
  imports: [
    AppRoutingModule,
    NativeScriptModule,
    NativeScriptUISideDrawerModule
  ],
  declarations: [
    AppComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class AppModule { }
