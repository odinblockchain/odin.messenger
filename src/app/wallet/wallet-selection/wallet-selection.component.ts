import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
	moduleId: module.id,
	selector: 'WalletSelection',
	templateUrl: './wallet-selection.component.html',
	styleUrls: ['./wallet-selection.component.css']
})

export class WalletSelectionComponent implements OnInit {
  @Input() selectedWallet: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

	constructor() {}

	ngOnInit() {
    console.log('selected wallet?', this.selectedWallet);
  }

  onSelectWallet(walletNumber: number) {
    console.log('...on select', walletNumber);
    this.walletSelected.next(walletNumber);
  }
}
