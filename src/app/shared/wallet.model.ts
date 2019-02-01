import { Injectable } from "@angular/core";
import { fromObject, fromObjectRecursive, Observable, PropertyChangeData } from "tns-core-modules/data/observable";
import { StorageService } from './index';
import { RouterExtensions } from "nativescript-angular/router";

import { alert } from "ui/dialogs";

import { LibsignalProtocol } from 'nativescript-libsignal-protocol';
import { WalletClientService } from "./wallet-client.service";
import { ElectrumxClient } from 'nativescript-electrumx-client';
import { setTimeout, clearTimeout } from "tns-core-modules/timer";

@Injectable()
export class WalletModel extends Observable {
  private _store: StorageService;
  private _electrumxClient: ElectrumxClient;
  public walletData: any;

  constructor(
    private _router: RouterExtensions,
    private _walletClient: WalletClientService
  ) {
    super();
    
    this.walletData = {
      loaded: false,
      enabled: false,
      serverVersion: '',
      warning: false
    };

    this._electrumxClient = new ElectrumxClient('electrumx.odinblockchain.org', 50001);
    this.createSubscriptions();
    this.init();

    setTimeout(this.validateSession, 1000 * 10, this);
  }

  /**
   * Validates the current ElectrumX session after 10 seconds to ensure the user
   * is not left hanging.
   * 
   * @param thisRef Reference to the WalletModule instance
   */
  public validateSession(thisRef) {
    if (!thisRef.walletData.loaded) {
      console.log('[App] [Wallet] >> SESSION_TIMEOUT');
      thisRef.walletData.loaded       = true;
      thisRef.walletData.warning      = true;
      thisRef.walletData.warningText  = 'Unable to establish a connection to a Wallet Relay Node. Please try again later';
    }
  }

  /**
   * Create handlers for certain ElectrumX event streams
   */
  private createSubscriptions() {
    this._electrumxClient.subscribe.on('data', (rawData: string) => {
      console.log('ON DATA', rawData);
    });

    this._electrumxClient.subscribe.on('finished', (tcpActionId: number) => {
      console.log('ON FINISHED', tcpActionId);
    });

    /**
     * Subscribe to any errors streamed from this plugin.
     * There are two primary error types to watch out for:
     *
     * err.name === "UnexpectedResponseError"
     * This error comes from an unexpected response from ElectrumX as
     * ElectrumX should always return a JSON.parse-able string response.
     *
     * err.name === "TCPClientError"
     * This error comes from the base class TcpClient when a connection
     * fails.
     */
    this._electrumxClient.subscribe.on('error', async (err) => {
      console.log('ON ERROR', {
        name: err.name ? err.name : '??',
        msg: err.message ? err.message : '??'
      }, err);

      if (err.name === 'TCPClientError!') {
        this.walletData.loaded      = true;
        this.walletData.warning     = true;
        this.walletData.warningText = 'Failed to establish a connection to a Wallet Relay Node. Please try again later';
      }
    });
    
    this._electrumxClient.subscribe.on('blockchain.scripthash.subscribe', (...args) => {
      console.log('GOT BLOCK', args);
    });
  }

  /**
   * Attempts to initialize a connection to an ElectrumX server. Passed along the an
   * internal app version/agent string and the min electrumx version
   */
  private async init() {

    this._electrumxClient.connect()
    .then(() => {

      this._electrumxClient.server_version('ODINX 0.2.6', '1.2')
      .then((version) => {
        console.log('>> VERSION RESPONSE', version);

        this.walletData.loaded        = true;
        this.walletData.enabled       = true;
        this.walletData.serverVersion = Array.isArray(version) ? version[0] : 'Unknown Version';
      })
      .catch((err) => {
        this.walletData.loaded  = true;
        this.walletData.warning = true;

        if (err && err.message.includes('unsupported client')) {
          this.walletData.warningText = 'Wallet outdated! Please update your application to continue!';

          alert('You are currently using an unsupported version of this wallet. Please update your ODIN Messenger as soon as possible to continue.')
        } else {
          this.walletData.warningText = 'Unable to establish a secure connection with an available wallet relay node. Please try again later.';

          console.log('Connection error');
          console.log(err);
        }
      });
    })
    .catch((err) => {
      console.log('CONNECTION ERROR');
      console.log(err);

      this.walletData.loaded      = true;
      this.walletData.warning     = true;
      this.walletData.warningText = 'CONNECTION FAILURE';
    });
  }
}
