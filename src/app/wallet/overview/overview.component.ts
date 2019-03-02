import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { WalletModel } from '~/app/shared/wallet.model';
import { EventData } from 'tns-core-modules/ui/page/page';

@Component({
	moduleId: module.id,
	selector: 'Overview',
	templateUrl: './overview.component.html',
	styleUrls: ['./overview.component.css']
})

export class OverviewComponent implements OnInit {
  @Input() selectedWalletId: number;
  @Input() currentWallet: any;
  @Input() blockheight: number;
  @Output() walletSelected: EventEmitter<any> = new EventEmitter();

	constructor(
    private _wallet: WalletModel,
    private _change: ChangeDetectorRef
  ) { }

  ngOnInit() { }

  public proxyWalletSelection(selectedWalletId: number) {
    this.walletSelected.next(selectedWalletId);
  }
}
