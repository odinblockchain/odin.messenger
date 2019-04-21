import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { SplashscreenComponent } from "./splashscreen.component";
import { GenerateScreenComponent } from "./generate/generate.component";

const routes: Routes = [
  { path: '', component: SplashscreenComponent },
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
export class SplashscreenRoutingModule { }
