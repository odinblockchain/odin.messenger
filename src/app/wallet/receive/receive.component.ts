import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { WalletModel } from '~/app/shared/wallet.model';

@Component({
	moduleId: module.id,
	selector: 'Receive',
	templateUrl: './receive.component.html',
	styleUrls: ['./receive.component.css']
})

export class ReceiveComponent implements OnInit, OnChanges {
  @Input() selectedWalletId: number;
  @Input() currentWallet: any;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public usedExternalAddresses: Array<any>;
  public unusedAddress: any;

	constructor(
    private _wallet: WalletModel
  ) {
    this.usedExternalAddresses = [];
    this.unusedAddress = {};
  }

	ngOnInit() { }

  ngOnChanges(simpleChanges: any) {
    console.log('[Wallet >> Receive] onChanges');
    // console.dir(simpleChanges);

    try {
      if (this.currentWallet.external.length) {
        this.usedExternalAddresses = this.currentWallet.external.filter(address => {
          if (address.balance.confirmed > 0 || address.balance.unconfirmed > 0) {
            return true;
          } else {
            return false;
          }
        });
  
        this.unusedAddress = this.currentWallet.external.find(address => {
          if (address.balance.confirmed === 0 && address.balance.unconfirmed === 0) {
            return true;
          } else {
            return false;
          }
        });
      } else {
        this.usedExternalAddresses = [];
      }
    } catch(err) {
      console.log('[Wallet Receive] Current Wallet not loaded yet');
    }
  }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}
