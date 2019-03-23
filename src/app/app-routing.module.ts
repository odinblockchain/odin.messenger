import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // pages
  { path: 'home', loadChildren: '~/app/home/home.module#HomeModule' },
  { path: 'splashscreen', loadChildren: '~/app/splashscreen/splashscreen.module#SplashscreenModule' },
  { path: 'settings', loadChildren: '~/app/settings/settings.module#SettingsModule' },
  { path: 'help', loadChildren: '~/app/help/help.module#HelpModule' },

  // contacts
  { path: 'create', loadChildren: '~/app/create-account/create-account.module#CreateAccountModule' },
  { path: 'contact-add', loadChildren: '~/app/contact-add/contact-add.module#ContactAddModule' },

  // messenger - module
  { path: 'messenger', loadChildren: '~/app/messenger/messenger.module#MessengerModule' },

  // wallet - module
  { path: 'wallet', loadChildren: '~/app/wallet/wallet.module#WalletModule' }
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
