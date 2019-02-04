import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { WalletRoutingModule } from "./wallet.routing.module";
import { WalletComponent } from "./wallet.component";
import { SendComponent } from './send/send.component';
import { OverviewComponent } from './overview/overview.component';
import { ReceiveComponent } from "./receive/receive.component";
import { WalletSelectionComponent } from "./wallet-selection/wallet-selection.component";
import { SatoshiValueConverter } from "~/app/utils/satoshiValueConverter";
import { TransactionConfirmations } from "~/app/utils/transactionConfirmations";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    WalletRoutingModule
  ],
  declarations: [
    SatoshiValueConverter,
    TransactionConfirmations,
    WalletComponent,
    SendComponent,
    OverviewComponent,
    ReceiveComponent,
    WalletSelectionComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class WalletModule { }
