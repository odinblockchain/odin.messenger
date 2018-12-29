import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { CreateAccountRoutingModule } from "./create-account.routing.module";
import { CreateAccountComponent } from "./create-account.component";

@NgModule({
  providers: [],
  imports: [
    NativeScriptCommonModule,
    CreateAccountRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    CreateAccountComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class CreateAccountModule { }
