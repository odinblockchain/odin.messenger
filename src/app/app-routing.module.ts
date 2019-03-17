import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", loadChildren: "~/app/home/home.module#HomeModule" },
  { path: "browse", loadChildren: "~/app/browse/browse.module#BrowseModule" },
  { path: "search", loadChildren: "~/app/search/search.module#SearchModule" },
  { path: "splashscreen", loadChildren: "~/app/splashscreen/splashscreen.module#SplashscreenModule" },
  { path: "settings", loadChildren: "~/app/settings/settings.module#SettingsModule" },
  { path: "create", loadChildren: "~/app/create-account/create-account.module#CreateAccountModule" },
  // { path: "messages", loadChildren: "~/app/messages/messages.module#MessagesModule" },
  { path: "contact-add", loadChildren: "~/app/contact-add/contact-add.module#ContactAddModule" },
  // { path: "message", loadChildren: "~/app/message-view/message-view.module#MessageViewModule" },
  { path: "messenger", loadChildren: "~/app/messenger/messenger.module#MessengerModule" },
  { path: "wallet", loadChildren: "~/app/wallet/wallet.module#WalletModule" },
  { path: "help", loadChildren: "~/app/help/help.module#HelpModule" }
];

@NgModule({
  imports: [
    NativeScriptRouterModule.forRoot(routes)
  ],
  exports: [
    NativeScriptRouterModule
  ]
})
export class AppRoutingModule { }
