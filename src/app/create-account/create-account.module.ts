import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { CreateAccountRoutingModule } from "./create-account-routing.module";
import { CreateConversationScreenComponent } from "./conversation/conversation.component";
import { WalletConversationScreenComponent } from "./wallet/wallet.component";
import { ShieldConversationScreenComponent } from "./shield/shield.component";
import { GenerateScreenComponent } from "./generate/generate.component";
import { RoundButtonComponent } from "../shared/ui/round-button/round-button.component";
import { IndexComponent } from "./index/index.component";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    CreateAccountRoutingModule
  ],
  declarations: [
    RoundButtonComponent,
    CreateConversationScreenComponent,
    WalletConversationScreenComponent,
    ShieldConversationScreenComponent,
    GenerateScreenComponent,
    IndexComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class CreateAccountModule { }
