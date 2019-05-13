import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { RoundButtonComponent } from "./round-button/round-button.component";
import { InputFieldComponent } from "./input-field/input-field.component";

@NgModule({
  schemas: [
    NO_ERRORS_SCHEMA
  ],
  imports: [
    CommonModule,
    NativeScriptFormsModule
  ],
  providers: [],
  declarations: [
    RoundButtonComponent,
    InputFieldComponent
  ],
  exports: [
    RoundButtonComponent,
    InputFieldComponent
  ]
})
export class UIModule { }
