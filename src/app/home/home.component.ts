import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Page } from 'tns-core-modules/ui/page';
import { RouterExtensions } from 'nativescript-angular/router';
import { StorageService } from '~/app/shared';
import { AccountService } from '~/app/shared/services';
import { Account } from '~/app/shared/models/identity';

@Component({
    selector: 'Splashscreen',
    moduleId: module.id,
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public currentActivity: string;
  private storageEventListener: any;

  constructor(
    private _page: Page,
    private _router: RouterExtensions,
    // private _user: UserModel,
    private _storage: StorageService,
    private Account: AccountService) {
    this._page.actionBarHidden = true;
  }

  ngOnDestroy(): void {
    this.storageEventListener && this.storageEventListener.unsubscribe();
  }

  ngOnInit(): void {
    this.storageEventListener = this._storage.eventStream$.subscribe(data => {
      this.currentActivity = data;

      if (data === 'StorageService::Ready') {
        const registeredAccount = this.Account.accounts.find((a: Account) => a.registered === true);
      
        if (registeredAccount) {
          console.log('[Home] >> Session exists, redirect to messages home');
          this._router.navigate(['/messenger'], { clearHistory: true });
        } else {
          console.log('[Home] >> No session exists, redirect to splashscreen');
          this._router.navigate(['/create'], { clearHistory: true });
        }
      }
    });
  }
}

