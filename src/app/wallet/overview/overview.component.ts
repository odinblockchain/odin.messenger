import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
	moduleId: module.id,
	selector: 'Overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.css']
})

export class OverviewComponent implements OnInit {
  @Input() selectedWalletId: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

  public wallets: any[];

	constructor() {
    this.wallets = [
      {
        symbol: 'ODIN',
        logo: 'res://icon',
        label: 'wallet one',
        balance: '1,950,124.12345678',
        lastTransaction: '5 hours ago'
      },
      {
        symbol: 'ODIN',
        logo: 'res://icon',
        label: 'wallet two',
        balance: '950,124.12345678',
        lastTransaction: '10 hours ago'
      }
    ];
  }

  ngOnInit() { }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}
