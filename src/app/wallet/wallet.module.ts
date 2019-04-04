import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';

import { WalletRoutingModule } from "./wallet.routing.module";
import { WalletComponent } from "./wallet.component";
import { SendComponent } from './send/send.component';
import { OverviewComponent } from './overview/overview.component';
import { ReceiveComponent } from "./receive/receive.component";
import { WalletSelectionComponent } from "./wallet-selection/wallet-selection.component";
import { SatoshiValueConverter } from "~/app/utils/satoshiValueConverter";
import { TransactionConfirmations } from "~/app/utils/transactionConfirmations";
import { RelativeTime } from "../utils/relativeTime";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    NativeScriptUIListViewModule,
    WalletRoutingModule
  ],
  declarations: [
    SatoshiValueConverter,
    TransactionConfirmations,
    RelativeTime,
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
