import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptUISideDrawerModule } from "nativescript-ui-sidedrawer/angular";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
// import { AccountService, StorageService, UserModel } from './shared';
import { AccountService } from './shared/account.service';
import { StorageService } from './shared/storage.service';
import { UserModel } from './shared/user.model';
import { OSMClientService } from './shared/osm-client.service';
import { SnackBar, SnackBarOptions } from "nativescript-snackbar";

@NgModule({
  bootstrap: [
    AppComponent
  ],
  providers: [
    AccountService,
    StorageService,
    OSMClientService,
    UserModel,
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
