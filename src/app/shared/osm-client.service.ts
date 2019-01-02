import { Injectable } from "@angular/core";
import { request } from "http";

const API = 'http://3043d3e7.ngrok.io';

export interface IRegistrationData {
  address: {
    name: string,
    deviceId: number,
    registrationId: number
  };
  identityPubKey: string;
  signedPreKey: {
    id: number,
    pubKey: string,
    signature: string
  };
  publicPreKeys: any[];
}

export interface IPutMessage {
  destinationDeviceId: number;
  destinationRegistrationId: number;
  deviceId: number;
  registrationId: number;
  ciphertextMessage: string;
}

@Injectable()
export class OSMClientService {

  constructor() {
  }

  public fetchContact(contactIdentity: string): Promise<any> {
    console.log(`OSMClientService... FetchContact (${contactIdentity})`);
    return new Promise((resolve, reject) => {
      request({
        url: `${API}/keys/?user=${contactIdentity}`,
        method: "GET"
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`OSMClientService... CONTENT`);
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

  public checkRegistration(hashAccountName: string): Promise<any> {
    console.log(`OSMClientService... CheckRegistration (${hashAccountName})`);
    return new Promise((resolve, reject) => {
      request({
        url: `${API}/keys/count?user=${hashAccountName}`,
        method: "GET"
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`OSMClientService... CONTENT`);
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
    console.log(`OSMClientService... RegisterClient`);
    console.dir(clientDetails);
    console.log('---');

    return new Promise((resolve, reject) => {
      request({
        url: `${API}/keys`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify(clientDetails)
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`OSMClientService... CONTENT`);
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

  public putMessage(putMessageBody: IPutMessage) {
    console.log(`OSMClientService... PutMessage`);
    console.dir(putMessageBody);
    console.log('---');

    return new Promise((resolve, reject) => {
      request({
        url: `${API}/messages`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        content: JSON.stringify(putMessageBody)
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`OSMClientService... CONTENT`);
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

  public getMessages(registrationId: number, deviceId: number) {
    console.log(`OSMClientService... GetMessages (${registrationId})(${deviceId})`);

    return new Promise((resolve, reject) => {
      request({
        url: `${API}/messages?deviceId=${deviceId}&registrationId=${registrationId}`,
        method: "GET",
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          return reject(new Error('Bad_Status'));
        }

        console.log(`OSMClientService... CONTENT`);
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
}
