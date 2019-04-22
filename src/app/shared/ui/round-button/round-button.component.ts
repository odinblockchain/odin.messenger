import { Component, OnInit, AfterContentInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, NgZone, Input, Output, EventEmitter } from "@angular/core";
import { Page } from "tns-core-modules/ui/page/page";
import { setOrientation, disableRotation } from "nativescript-orientation";
import Seeder from '~/app/lib/Seeder';
import SecureRandom from '~/app/lib/SecureRandom';
import { TouchGestureEventData } from "tns-core-modules/ui/gestures/gestures";
import { AnimationCurve } from "tns-core-modules/ui/enums/enums";

@Component({
  selector: "RoundButton, [RoundButton]",
  moduleId: module.id,
  templateUrl: "./round-button.component.html",
  styleUrls: ['./round-button.component.css']
})
export class RoundButtonComponent implements OnInit, AfterViewInit {
  @Input() row: number;
  @Input() col: number;

  @Input()  disabled: boolean;
  @Input()  busy: boolean;// = false;
  @Input()  text: string;// = 'Button';
  @Input()  theme: string;  
  @Output() tap = new EventEmitter();

  @ViewChild('roundButtonWrap') ctaButton: ElementRef;

  private ctaBtn: any;

  constructor() {
    if (typeof this.text === undefined) this.text = 'Button';
    if (typeof this.theme === undefined) this.theme = 'blue';
    if (typeof this.busy === undefined) this.busy = false;
    if (typeof this.disabled === undefined) this.disabled = false;
  }

  ngOnInit(): void {
    this.ctaBtn = this.ctaButton.nativeElement;
  }

  ngAfterViewInit(): void {
  }

  public onTap(event) {
    if (this.busy || this.disabled) return;

    this.ctaBtn.animate({
      scale: { x: 1.15, y: 1.15 },
      duration: 150,
      curve: AnimationCurve.easeIn
    })
    .then(() => {
      this.tap.emit(event);

      this.ctaBtn.animate({
        scale: { x: 1, y: 1 },
        duration: 300,
        curve: AnimationCurve.cubicBezier(.175, 0.885, 0.32, 1.275)
      });
    });
  }
}
