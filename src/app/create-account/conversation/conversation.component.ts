import { Component, Input } from "@angular/core";

@Component({
  selector: "CreateConversationScreen, [CreateConversationScreen]",
  moduleId: module.id,
  templateUrl: "./conversation.component.html",
  styleUrls: ['./conversation.component.css']
})
export class CreateConversationScreenComponent {
  @Input() active: boolean;
  
  constructor() { }
}


