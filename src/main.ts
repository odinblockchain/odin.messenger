// this import should be first in order to load some required settings (like globals and reflect-metadata)
import { platformNativeScriptDynamic } from "nativescript-angular/platform";
import { android as androidNS, ApplicationEventData, AndroidActivityEventData, AndroidActivityResultEventData, AndroidActivityBackPressedEventData, AndroidApplication, AndroidActivityBundleEventData } from "tns-core-modules/application";
import { AppModule } from "./app/app.module";

declare var android: any;

/**
 * @todo utilize "share"
 */
// function cbParseTextAndUrl(argIntent) {
//   var Intent_1 = android.content.Intent;
//   var Patterns = android.util.Patterns;
//   //let Matcher = java.util.regex.Matcher;
//   var ListUrl = [];
//   var text = argIntent.getStringExtra(Intent_1.EXTRA_TEXT);
//   if (new String().valueOf() !== "null") {
//       var Matcher = Patterns.WEB_URL.matcher(text);
//       while (Matcher.find()) {
//           var url = Matcher.group();
//           ListUrl.push(url);
//       }
//       return { "text": text, "listUrl": ListUrl };
//   }
// }
// function cbParseImageUrl(argIntent) {
//   var Intent_1 = android.content.Intent;
//   var imageUri = argIntent.getParcelableExtra(Intent_1.EXTRA_STREAM);
//   if (imageUri != null) {
//       // Update UI to reflect image being shared
//       return imageUri;
//   }
// }
// function cbParseMultipleImageUrl(argIntent) {
//   var Intent_1 = android.content.Intent;
//   var imageUris = argIntent.getParcelableArrayListExtra(Intent_1.EXTRA_STREAM);
//   if (imageUris != null) {
//       // Update UI to reflect image being shared
//       return JSON.stringify(imageUris.toString());
//   }
// }

// Android activity events
if (androidNS) {
  androidNS.on(AndroidApplication.activityCreatedEvent, function (args: AndroidActivityBundleEventData) {
    console.log('ODIN Messenger -- Event.activityCreatedEvent');

    /**
     * @todo utilize "share"
     */
    // console.log("Event: " + args.eventName + ", Activity: " + args.activity);
    // var a = args.activity;
    // try {
    //   var Intent_1 = android.content.Intent;
    //   var actionSend = Intent_1.ACTION_SEND;
    //   var actionSendMultiple = Intent_1.ACTION_SEND_MULTIPLE;
    //   var argIntent = a.getIntent();
    //   var argIntentAction = argIntent.getAction();
    //   var argIntentType = argIntent.getType();
    //   //~~~~ Intent is ~~~~ :ODIN_ACTIVITY_2
    //   console.log(" ~~~~ Intent is ~~~~ :" + new String(argIntent.getAction()).valueOf());
    //   String.prototype.startsWith = function (str) {
    //       return this.substring(0, str.length) === str;
    //   };
    //   if (new String(argIntentAction).valueOf() === new String(Intent_1.ACTION_SEND).valueOf()) {
    //       if (new String(argIntentType).valueOf() === new String("text/plain").valueOf()) {
    //           console.dir(cbParseTextAndUrl(argIntent));
    //       }
    //       else if (argIntentType.startsWith("image/")) {
    //           console.log(cbParseImageUrl(argIntent));
    //       }
    //   }
    //   else if (new String(argIntentAction).valueOf() === new String(Intent_1.ACTION_SEND_MULTIPLE).valueOf()) {
    //       if (argIntentType.startsWith("image/")) {
    //           var Uri = cbParseMultipleImageUrl(argIntent);
    //           if (Uri !== null) {
    //               var Uris = JSON.parse(Uri);
    //               console.log(Uris);
    //           }
    //       }
    //   }
    // }
    // catch (e) {
    //   console.log(e);
    // }
  });

  androidNS.on(AndroidApplication.activityResumedEvent, function (args: AndroidActivityEventData) {
    console.log("Event: " + args.eventName + ", Activity: " + args.activity);
    /**
     * @todo utilize "share"
     */
    // var a = args.activity;
    // try {
    //   var Intent_1 = android.content.Intent;
    //   var actionSend = Intent_1.ACTION_SEND;
    //   var actionSendMultiple = Intent_1.ACTION_SEND_MULTIPLE;
    //   var argIntent = a.getIntent();
    //   var argIntentAction = argIntent.getAction();
    //   var argIntentType = argIntent.getType();
    //   //:android.intent.action.SEND
    //   console.log(" ~~~~ Intent is ~~~~ :" + new String(argIntent.getAction()).valueOf());
    //   String.prototype.startsWith = function (str) {
    //       return this.substring(0, str.length) === str;
    //   };
    //   if (new String(argIntentAction).valueOf() === new String(Intent_1.ACTION_SEND).valueOf()) {
    //       if (new String(argIntentType).valueOf() === new String("text/plain").valueOf()) {
    //           console.dir(cbParseTextAndUrl(argIntent));
    //           //text:""
    //           //listurl:[]
    //       }
    //       else if (argIntentType.startsWith("image/")) {
    //           console.log(cbParseImageUrl(argIntent));
    //       }
    //   }
    //   else if (new String(argIntentAction).valueOf() === new String(Intent_1.ACTION_SEND_MULTIPLE).valueOf()) {
    //       if (argIntentType.startsWith("image/")) {
    //           var Uri = cbParseMultipleImageUrl(argIntent);
    //           if (Uri !== null) {
    //               var Uris = JSON.parse(Uri);
    //               console.log(Uris);
    //           }
    //       }
    //   }
    // }
    // catch (e) {
    //   console.log(e);
    // }
  });

  androidNS.on(AndroidApplication.activityStartedEvent, function (args: AndroidActivityEventData) {
    console.log('ODIN Messenger -- Event.activityStartedEvent');
  });

  androidNS.on(AndroidApplication.saveActivityStateEvent, function (args: AndroidActivityBundleEventData) {
    console.log('ODIN Messenger -- Event.saveActivityStateEvent');
  });

  androidNS.on(AndroidApplication.activityBackPressedEvent, function (args: AndroidActivityBackPressedEventData) {
    console.log('ODIN Messenger -- Event.activityBackPressedEvent');
  });

  androidNS.on(AndroidApplication.activityPausedEvent, function (args: AndroidActivityEventData) {
    console.log('ODIN Messenger -- Event.activityPausedEvent');
  });

  androidNS.on(AndroidApplication.activityStoppedEvent, function (args: AndroidActivityEventData) {
    console.log('ODIN Messenger -- Event.activityStoppedEvent');
  });

  androidNS.on(AndroidApplication.activityDestroyedEvent, function (args: AndroidActivityEventData) {
    console.log('ODIN Messenger -- Event.activityDestroyedEvent');
  });
}

platformNativeScriptDynamic().bootstrapModule(AppModule);
