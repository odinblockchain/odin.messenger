import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
// import { WalletModel } from '~/app/shared/wallet.model';
import { WalletService } from '~/app/shared/services';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
// import { Observable } from 'tns-core-modules/ui/page/page';
// import { Wallet } from '~/app/shared/models/wallet';
// import { Subscription, BehaviorSubject } from 'rxjs';
import { Observable } from 'tns-core-modules/ui/page/page';
// import { fromObject } from 'tns-core-modules/data/observable/observable';

@Component({
	moduleId: module.id,
	selector: 'WalletSelection',
	templateUrl: './wallet-selection.component.html',
	styleUrls: ['./wallet-selection.component.css']
})

export class WalletSelectionComponent implements OnInit {
  @Input() selectedWallet: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public wallets: ObservableArray<Observable>;
	constructor(
    private _WalletServ: WalletService
  ) {

  }

	ngOnInit() {

    this.wallets = this._WalletServ.wallets$;
    // this.wallets.push(fromObject({empty: true}));
  }

  public walletTemplateSelector(item: any, index: number, items: any): string {
    if (item && item.empty === true) {
      return 'empty';
    }
    return 'wallet';
  }

  onSelectWallet(walletNumber: number) {
    console.log('...on select', walletNumber);
    this.walletSelected.next(walletNumber);
  }
}
