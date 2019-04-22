import { NgModule, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptFormsModule } from "nativescript-angular/forms";

import { RoundButtonComponent } from "./round-button/round-button.component";
import { InputFieldComponent } from "./input-field/input-field.component";

@NgModule({
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
