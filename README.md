# ODIN Chat Native

###### v0.3.x

This is the official ODIN Messenger Github. ODIN Messenger is a free, peer-to-peer and end-to-end encrypted messenger based on the Obsidian Platform OSM. It utilizes the well known and respected Signal Protocol developed by Open Whisper Systems and used by other known secure messengers such as Signal, WhatsApp, and Google Allo.

The ODIN Messenger is an **enhanced version** of the OSM, with plans to extend its functionality and security. It requires no association to your phone number or access to your address book as the primary focus is to keep your information secure and in your hands.

## Summary

This native client is built on NativeScript + Angular to provide an efficient and modular codebase for ongoing development. It is currently available for Android devices with iOS on the roadmap. Two core NativeScript plugins were written specifically for the ODIN Messenger and are available for public review.

#### nativescript-libsignal-protocol [›› source](https://github.com/Manbearpixel/nativescript-libsignal-protocol)

This plugin provides a wrapper for the [Libsignal Protocol](https://github.com/signalapp/libsignal-protocol-java/) JAVA library developed by Open Whisper Systems. It exposes primary functionality of the JAVA library which is utilized in the ODIN Messenger to secure conversations between parties.

#### nativescript-electrumx-client [›› source](https://github.com/Manbearpixel/nativescript-electrumx-client)

This plugin allows communication between the ODIN Messenger and an [ElectrumX](https://github.com/kyuupichan/electrumx/) instance to utilize core functionalities of a blockchain wallet. Connections to ElectrumX are currently supported over a TCP socket.

## Development Setup

You'll need to ensure you have [NodeJS](https://nodejs.org/en/download/) installed as well as NPM, the Node Package Manager. NPM should come installed with any NodeJS installation.

The rest of the development setup can be found by running through this [Quick Setup](https://docs.nativescript.org/angular/start/quick-setup) guide provided by NativeScript. It is recommended you also go through their [Full Setup](https://docs.nativescript.org/angular/start/quick-setup#full-setup) which is on the same page as it details how to get your local Android environment setup. This is required for running this application natively on your phone or through an Android Emulator.

Once you've got your environment setup and `tns doctor` reports back all green, you can run the command `npm run build.android` to build the Android environment for the ODIN Messenger and then `tns run android` to run on either an Android Emulator or a connected Android Device. Make sure you have Developer Mode activated on your Android phone!

## Get Help

Most of the community can be found throughout Discord and Reddit. If you'd like to help contribute back to this project, ask a question about OSM, or offer a suggestion please reach out to us there!

- https://discord.me/odinblockchain
- https://www.reddit.com/r/OdinBlockchain/

For NativeScript related questions, their community is very vibrant and you're likely bound to find help through them! You can join their [community slack](http://developer.telerik.com/wp-login.php?action=slack-invitation), or by submitting a question on StackOverflow and adding the `#nativescript` tag.

## Contributing

We love PRs, and accept them gladly. Feel free to propose changes and new ideas through our [issues portal](https://github.com/odinblockchain/odin.messenger/issues). We will review and discuss, so that they can be accepted and better integrated. In order to create an official PR, please first clone this repository. Then on your instance, create a new `feature` or `bug` branch (depending on what you are working on) with a short descriptive name such as `feature-awesome-thing`. Feel free to make a PR early on and start the conversation of what you're working on!
