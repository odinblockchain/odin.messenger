# OSM Client Native

###### ALPHA v0.1.x

This is the new official Obsidian Secure Messenger (OSM). Originally produced by Claus Ehrenberg, the OSM has been redone completely from the ground up. The OSM is meant to provide a secure means of conversing with others without sacrificing your personal identity. The OSM is the first step towards truly private conversations.

## Summary

This native client is built using both the NativeScript and Angular framework and is currently available for Android devices. The OSM relies on two plugins developed specifically for this application:

#### nativescript-libsignal-protocol [›› source](https://github.com/Manbearpixel/nativescript-libsignal-protocol)

This plugin provides a wrapper for the [Libsignal Protocol](https://github.com/signalapp/libsignal-protocol-java/) JAVA library developed by Open Whisper Systems and Signal. It exposes primary functionality of the JAVA library which is utilized in the OSM to secure conversations between two users.

#### nativescript-electrumx-client [›› source](https://github.com/Manbearpixel/nativescript-electrumx-client)

This plugin allows communication between OSM and an ElectrumX instance to utilize core functionalities of a wallet. It currently supports connections via TCP.

## Development Setup

You'll need to ensure you have [NodeJS](https://nodejs.org/en/download/) installed as well as NPM, the Node Package Manager. NPM should come installed with any NodeJS installation.

The rest of the development setup can be found by running through this [Quick Setup](https://docs.nativescript.org/angular/start/quick-setup) guide provided by NativeScript. It is recommended you also go through their [Full Setup](https://docs.nativescript.org/angular/start/quick-setup#full-setup) which is on the same page as it details how to get your local Android environment setup. This is required for running this application natively on your phone or through an Android Emulator.

Once you've got your environment setup and `tns doctor` reports back all green, you can run the command `npm run build.android` to build the Android environment for OSM and then `tns run android` to run OSM on either an Android Emulator or connected Android Device. Make sure you have Developer Mode activated on your Android phone!

## Get Help

Most of the community can be found throughout Discord and Reddit. If you'd like to help contribute back to this project, ask a question about OSM, or offer a suggestion please reach out to us there!

- https://discord.gg/X5rmND6
- https://www.reddit.com/r/ObsidianProject

For NativeScript related questions, their community is very vibrant and you're likely bound to find help through them! You can join their [community slack](http://developer.telerik.com/wp-login.php?action=slack-invitation), or by submitting a question on StackOverflow and adding the `#nativescript` tag.

## Contributing

We love PRs, and accept them gladly. Feel free to propose changes and new ideas. We will review and discuss, so that they can be accepted and better integrated. In order to create an official PR, please first clone this repository. Then on your instance, create a new `feature` or `bug` branch (depending on what you are working on) with a short descriptive name. Feel free to make a PR early on and start the conversation of what you're working on!
