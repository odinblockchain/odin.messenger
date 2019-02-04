import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
	moduleId: module.id,
	selector: 'Overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.css']
})

export class OverviewComponent implements OnInit {
  @Input() selectedWalletId: number;
  @Input() currentWallet: any;
  @Input() chainState: any;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

	constructor() { }

  ngOnInit() { }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}
