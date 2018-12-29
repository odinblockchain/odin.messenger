import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { CreateAccountComponent } from "./create-account.component";

const routes: Routes = [
  { path: "", component: CreateAccountComponent }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class CreateAccountRoutingModule { }
