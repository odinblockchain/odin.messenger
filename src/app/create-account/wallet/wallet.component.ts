import { Component, Input } from "@angular/core";

@Component({
  selector: "WalletConversationScreen, [WalletConversationScreen]",
  moduleId: module.id,
  templateUrl: "./wallet.component.html",
  styleUrls: ['./wallet.component.css']
})
export class WalletConversationScreenComponent {
  @Input() active: boolean;
  
  constructor() { }
}


