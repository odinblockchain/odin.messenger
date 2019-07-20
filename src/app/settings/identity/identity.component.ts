import { Component, OnInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { IdentityService } from '~/app/shared/services/identity.service';
import * as app from 'tns-core-modules/application';

const firebase = require('nativescript-plugin-firebase');
declare var android: any;

@Component({
  selector: 'IdentityComponent',
  moduleId: module.id,
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.scss']
})
export class IdentityComponent implements OnInit {
  public backupActive: boolean;
  public backupPhrase: string[];

  constructor(
    private _router: RouterExtensions,
    private _IdentityServ: IdentityService
  ) {
    this.backupActive = false;
    
    try {
      const phrase = this._IdentityServ.identity.mnemonicPhrase;
      this.backupPhrase = phrase.toLowerCase().split(' ');
    } catch (err) {
      this.backupPhrase = [];
    }

    firebase.analytics.setScreenName({
      screenName: 'Settings Identity Backup'
    }).then(() => {});
  }
  
  ngOnInit() {
    try {
      const activity = app.android.startActivity;
      const win = activity.getWindow();
      win.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
    } catch (err) {
      console.log('[Settings.Identity] Unable to register view as secure');
    }
  }

  public toggleBackup() {
    this.backupActive = !this.backupActive;
  }

  public onPreviousView() {
    this._router.navigate(['/settings'], {
      transition: {
        name: 'slideRight'
      },
    });
  }

  public onCompleteBackup() {
    // this.backupActive = false;
    this._router.navigate(['/settings'], {
      transition: {
        name: 'slideRight'
      },
    });
  }
}
