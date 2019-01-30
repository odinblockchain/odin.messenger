// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { android, ApplicationEventData, AndroidActivityEventData, AndroidActivityResultEventData, AndroidActivityBackPressedEventData, AndroidApplication, AndroidActivityBundleEventData } from "tns-core-modules/application";
import { AppModule } from "./app/app.module";

// Android activity events
if (android) {
    android.on(AndroidApplication.activityCreatedEvent, function (args: AndroidActivityBundleEventData) {
      console.log('ODIN Messenger -- Event.activityCreatedEvent');
    });

    android.on(AndroidApplication.activityStartedEvent, function (args: AndroidActivityEventData) {
      console.log('ODIN Messenger -- Event.activityStartedEvent');
    });

    android.on(AndroidApplication.saveActivityStateEvent, function (args: AndroidActivityBundleEventData) {
      console.log('ODIN Messenger -- Event.saveActivityStateEvent');
    });

    android.on(AndroidApplication.activityBackPressedEvent, function (args: AndroidActivityBackPressedEventData) {
      console.log('ODIN Messenger -- Event.activityBackPressedEvent');
    });

    android.on(AndroidApplication.activityPausedEvent, function (args: AndroidActivityEventData) {
      console.log('ODIN Messenger -- Event.activityPausedEvent');
    });

    android.on(AndroidApplication.activityStoppedEvent, function (args: AndroidActivityEventData) {
      console.log('ODIN Messenger -- Event.activityStoppedEvent');
    });

    android.on(AndroidApplication.activityDestroyedEvent, function (args: AndroidActivityEventData) {
      console.log('ODIN Messenger -- Event.activityDestroyedEvent');
    });
}

platformNativeScriptDynamic().bootstrapModule(AppModule);
