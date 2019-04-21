import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import * as app from "tns-core-modules/application";
import { Page, isAndroid, View, ContentView } from "tns-core-modules/ui/page/page";
import { device, screen } from "tns-core-modules/platform/platform";
import { AnimationCurve } from "tns-core-modules/ui/enums";
import { Animation, AnimationDefinition } from "ui/animation";
import { GridLayout } from "tns-core-modules/ui/layouts/grid-layout/grid-layout";
import { SwipeGestureEventData, SwipeDirection } from "tns-core-modules/ui/gestures/gestures";
import { setOrientation, disableRotation } from "nativescript-orientation";
import { RouterExtensions } from "nativescript-angular/router";

declare var android: any;

@Component({
  selector: "Splashscreen",
  moduleId: module.id,
  templateUrl: "./splashscreen.component.html",
  styleUrls: ['./splashscreen.component.css']
})
export class SplashscreenComponent implements OnInit, AfterViewInit {
  @ViewChild('wrapper') gridLayout: ElementRef;
  @ViewChild('slideContent') slideElement: ElementRef;

  public currentSlideIndex: number;
  public packageVersion: string;

  private carouselContinueBtn;
  private slidesView: GridLayout;

  private slideCount: number;
  private screenWidth: number;
  private isTransitioning: boolean;
  private allowGoBack: boolean;

  constructor(
    private _page: Page,
    private _router: RouterExtensions
  ) {
    this.packageVersion     = global.version ? global.version : '0.3.x';
    this.currentSlideIndex  = 1;
    this.slideCount         = 3;
    this.isTransitioning    = false;
    this.allowGoBack        = false;

    // Span the background under status bar on Android
    if (isAndroid && device.sdkVersion >= '21') {
      const activity = app.android.startActivity;
      const win = activity.getWindow();
      // win.addFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
      // win.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE); // disable screenshots
      win.addFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
      // win.addFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
    }
  }

  ngOnInit(): void {
    this._page.actionBarHidden = true;
    this._page.cssClasses.add("welcome-page-background");
    this._page.backgroundSpanUnderStatusBar = true;

    this.screenWidth = screen.mainScreen.widthDIPs;

    setOrientation('portrait');
    disableRotation();
  }

  ngAfterViewInit(): void {
    this.carouselContinueBtn = <GridLayout>this.gridLayout.nativeElement;
    this.slidesView = this.slideElement.nativeElement;
  }

  public onSwipe({ direction }: { direction: SwipeDirection }) {
    if (this.isTransitioning) return;

    if (this.validSwipe(direction)) {
      this.isTransitioning = true;
      this.changeSlide(direction);
    }
  }

  public onNextSlide() {
    if (this.isTransitioning) return;

    if (this.validSwipe(SwipeDirection.left)) {
      this.isTransitioning = true;
      this.carouselContinueBtn.animate({
        scale: { x: 1.15, y: 1.15 },
        duration: 150,
        curve: AnimationCurve.easeIn
      })
      .then(() => {
        this.changeSlide(SwipeDirection.left);

        this.carouselContinueBtn.animate({
          scale: { x: 1, y: 1 },
          duration: 300,
          curve: AnimationCurve.cubicBezier(.175, 0.885, 0.32, 1.275)
        });
      });
    } else if (this.currentSlideIndex === this.slideCount) {
      this._router.navigate(['/splashscreen/generate'], { clearHistory: true });
    }
  }

  private validSwipe(direction: SwipeDirection) {
    const allowedSwipes = [SwipeDirection.left];
    if (this.allowGoBack) allowedSwipes.push(SwipeDirection.right);

    if (!allowedSwipes.includes(direction)) return false;
    if ((this.currentSlideIndex + 1 > this.slideCount) && !this.allowGoBack) return false;

    return true;
  }

  private changeSlide(direction: SwipeDirection) {
    const prevSlideNum = this.currentSlideIndex;

    if (direction === SwipeDirection.left) {
      this.currentSlideIndex++;
    } else if (direction === SwipeDirection.right) {
      this.currentSlideIndex--;
    }

    // normalize if beyond range
    if (this.currentSlideIndex > this.slideCount) this.currentSlideIndex = 1;
    if (this.currentSlideIndex < 1) this.currentSlideIndex = this.slideCount;

    const currSlide = this.slidesView.getChildAt(prevSlideNum - 1);
    const nextSlide = this.slidesView.getChildAt(this.currentSlideIndex - 1);

    this.animate(currSlide, nextSlide, direction);
  }

  private animate(currSlide: View, nextSlide: View, direction: SwipeDirection) {
    nextSlide.opacity     = 1;
    nextSlide.translateX  = (direction === SwipeDirection.left)
                              ? this.screenWidth
                              : -this.screenWidth;

    const animationSet = new Animation([
      {
        target: currSlide,
        translate: { x: (direction == 2 ? -this.screenWidth : this.screenWidth), y: 0 },
        duration: 500
      },
      {
        target: nextSlide,
        translate: { x: 0, y: 0 },
        duration: 500
      }
    ]);

    animationSet.play()
    .then(() => {
      console.log("Animation finished");
      this.isTransitioning = false;
    })
    .catch((err) => {
      console.log('Slide animation error', err.message ? err.message : err);
      this.isTransitioning = false;
    });
  }
}


