import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { SplashscreenRoutingModule } from "./splashscreen-routing.module";
import { SplashscreenComponent } from "./splashscreen.component";
import { CreateConversationScreenComponent } from "./conversation/conversation.component";
import { WalletConversationScreenComponent } from "./wallet/wallet.component";
import { ShieldConversationScreenComponent } from "./shield/shield.component";
import { GenerateScreenComponent } from "./generate/generate.component";
import { RoundButtonComponent } from "../shared/ui/round-button/round-button.component";
@NgModule({
  imports: [
    NativeScriptCommonModule,
    SplashscreenRoutingModule
  ],
  declarations: [
    CreateConversationScreenComponent,
    WalletConversationScreenComponent,
    ShieldConversationScreenComponent,
    GenerateScreenComponent,
    SplashscreenComponent,
    RoundButtonComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class SplashscreenModule { }
