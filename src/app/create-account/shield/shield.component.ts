import { Component, Input } from "@angular/core";

@Component({
  selector: "ShieldConversationScreen, [ShieldConversationScreen]",
  moduleId: module.id,
  templateUrl: "./shield.component.html",
  styleUrls: ['./shield.component.css']
})
export class ShieldConversationScreenComponent {
  @Input() active: boolean;

  constructor() { }
}
