import { Injectable } from "@angular/core";
import { request } from "http";

const API = 'http://e92e3429.ngrok.io';

export interface IRegistrationData {
  address: {
    name: string,
    deviceId: number,
    registrationId: number
  },
  identityPubKey: string,
  signedPreKey: {
    id: number,
    pubKey: string,
    signature: string
  },
  publicPreKeys: any[];
}

@Injectable()
export class OSMClientService {

  constructor() {
  }

  public foo(): string {
    return 'bar';
  }

  public checkRegistration(hashAccountName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('--- Check Registration ---');
      request({
        url: `${API}/keys/count?user=${hashAccountName}`,
        method: "GET"
      }).then((response) => {
        console.log('OSM-Server Response');
        console.dir(response);

        if (response.statusCode !== 200) {
          return reject(new Error('Bad_Status'));
        }

        console.log('OSM-Server Content');
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

  public registerClient(clientDetails: IRegistrationData): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('--- Send Registration ---');
      console.dir(clientDetails);
      console.log('---');

      request({
        url: `${API}/keys`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify(clientDetails)
      }).then((response) => {
        console.log('OSM-Server Response');
        console.dir(response);

        if (response.statusCode !== 200) {
          return reject(new Error('Bad_Status'));
        }

        console.log('OSM-Server Content');
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
      });
    });
  }

  static bat(): string {
    return 'lol';
  }
}
