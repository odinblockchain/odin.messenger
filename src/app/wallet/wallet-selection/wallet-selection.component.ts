import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { WalletService } from '~/app/shared/services';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { Wallet } from '~/app/shared/models/wallet';

@Component({
	moduleId: module.id,
	selector: 'WalletSelection',
	templateUrl: './wallet-selection.component.html',
	styleUrls: ['./wallet-selection.component.css']
})

export class WalletSelectionComponent implements OnInit {
  @Input() selectedWallet: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public wallets: ObservableArray<Wallet>;

	constructor(
    private _WalletServ: WalletService
  ) { }

	ngOnInit() {
    this.wallets = this._WalletServ.wallets$;
  }

  public walletTemplateSelector(item: any, index: number, items: any): string {
    if (item && item.empty === true) return 'empty';
    return 'wallet';
  }

  onSelectWallet(walletNumber: number) {
    this.walletSelected.next(walletNumber);
  }
}
