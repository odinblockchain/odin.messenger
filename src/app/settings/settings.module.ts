import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

// import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";
// import { NativeScriptUICalendarModule } from "nativescript-ui-calendar/angular";
// import { NativeScriptUIChartModule } from "nativescript-ui-chart/angular";
// import { NativeScriptUIDataFormModule } from "nativescript-ui-dataform/angular";
// import { NativeScriptUIAutoCompleteTextViewModule } from "nativescript-ui-autocomplete/angular";
// import { NativeScriptUIGaugeModule } from "nativescript-ui-gauge/angular";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { SettingsRoutingModule } from "./settings-routing.module";
import { SettingsComponent } from "./settings.component";

@NgModule({
  imports: [
    // NativeScriptUIListViewModule,
    // NativeScriptUICalendarModule,
    // NativeScriptUIChartModule,
    // NativeScriptUIDataFormModule,
    // NativeScriptUIAutoCompleteTextViewModule,
    // NativeScriptUIGaugeModule,
    NativeScriptFormsModule,
    NativeScriptCommonModule,
    SettingsRoutingModule
  ],
  declarations: [
    SettingsComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class SettingsModule { }
