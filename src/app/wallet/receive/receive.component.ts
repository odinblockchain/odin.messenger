import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
	moduleId: module.id,
	selector: 'Receive',
	templateUrl: './receive.component.html',
	styleUrls: ['./receive.component.css']
})

export class ReceiveComponent implements OnInit {
  @Input() selectedWalletId: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

	constructor() { }

	ngOnInit() { }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}
