import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { WalletModel } from '~/app/shared/wallet.model';

@Component({
	moduleId: module.id,
	selector: 'WalletSelection',
	templateUrl: './wallet-selection.component.html',
	styleUrls: ['./wallet-selection.component.css']
})

export class WalletSelectionComponent implements OnInit {
  @Input() selectedWallet: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public wallets: any[];

	constructor(
    private _wallet: WalletModel
  ) {
    let self = this;
    this.wallets = [];

    this._wallet.on("WalletReady", function(eventData) {
      console.log(`[WalletModel Event]2 --- ${eventData.eventName}`);
      self.wallets = self._wallet.wallets;
    });
  }

	ngOnInit() {
    let self = this;
    
    
  }

  onSelectWallet(walletNumber: number) {
    console.log('...on select', walletNumber);
    this.walletSelected.next(walletNumber);
  }
}
