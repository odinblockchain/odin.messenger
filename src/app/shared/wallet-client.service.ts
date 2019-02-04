import { Injectable } from "@angular/core";
import { request } from "http";
import { PreferencesService } from "./preferences.service";

@Injectable()
export class WalletClientService {
  
  constructor(
    private _pref: PreferencesService
  ) { }

  public fetchTransaction(txHash: string): Promise<any> {
    console.log(`[WalletClientService]... FetchTransaction (${txHash})`);
    return new Promise((resolve, reject) => {
      request({
        // url: `${this._pref.preferences.explorer_url}/tx/${txHash}`,
        url: 'https://inspect.odinblockchain.org/api' + `/tx/${txHash}`,
        method: "GET"
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('[WalletClientService]... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`[WalletClientService]... CONTENT`);
        console.log(response.content);

        try {
          console.log('-- content.toJSON');
          console.dir(response.content.toJSON());
          return resolve(response.content.toJSON());
        } catch (err) {
          return reject(err);
        }
      }, (e) => {
        console.log('Error occurred');
        console.log(e.message ? e.message : e);
        console.dir(e);
        return reject(e);
      });
    });
  }

  public fetchBlockchainStats(): Promise<any> {
    console.log(`[WalletClientService]... FetchBlockchainStats`);
    return new Promise((resolve, reject) => {
      request({
        // url: `${this._pref.preferences.explorer_url}/tx/${txHash}`,
        url: 'https://inspect.odinblockchain.org/api' + `/stats`,
        method: "GET"
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('[WalletClientService]... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`[WalletClientService]... CONTENT`);
        console.log(response.content);

        try {
          console.log('-- content.toJSON');
          console.dir(response.content.toJSON());
          return resolve(response.content.toJSON());
        } catch (err) {
          return reject(err);
        }
      }, (e) => {
        console.log('Error occurred');
        console.log(e.message ? e.message : e);
        console.dir(e);
        return reject(e);
      });
    });
  }
}
