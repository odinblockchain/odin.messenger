import { Component, OnInit, OnDestroy, AfterViewInit } from "@angular/core";
import { Page } from "ui/page";
import { RouterExtensions } from "nativescript-angular/router";
import { UserModel } from "~/app/shared/user.model";
import { StorageService } from "../shared";

@Component({
    selector: "Splashscreen",
    moduleId: module.id,
    templateUrl: "./home.component.html",
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public currentActivity: string;
  private storageEventListener: any;

  constructor(
    private _page: Page,
    private _router: RouterExtensions,
    private _user: UserModel,
    private _storage: StorageService) {
    this._page.actionBarHidden = true;
  }

  ngOnDestroy(): void {
    this.storageEventListener && this.storageEventListener.unsubscribe();
  }

  ngOnInit(): void {
    this.storageEventListener = this._storage.eventStream.subscribe(data => {
      this.currentActivity = data;
      console.log('[Home]', data);

      if (data === 'StorageService::Ready') {
        if (this._user.saveData.registered) {
          console.log('[Home] >> Session exists, redirect to messages home');
          this._router.navigate(['/messenger'], { clearHistory: true });
        } else {
          console.log('[Home] >> No session exists, redirect to splashscreen');
          this._router.navigate(['/splashscreen'], { clearHistory: true });
        }
      }
    });
  }
}

