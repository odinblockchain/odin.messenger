import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { IndexComponent } from "./index/index.component";
import { GenerateScreenComponent } from "./generate/generate.component";

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'generate', component: GenerateScreenComponent }
];

@NgModule({
  imports: [
    NativeScriptRouterModule.forChild(routes)
  ],
  exports: [
    NativeScriptRouterModule
  ]
})
export class CreateAccountRoutingModule { }
