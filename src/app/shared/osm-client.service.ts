import { Injectable } from '@angular/core';
import { request } from 'tns-core-modules/http';
import { PreferencesService } from './preferences.service';


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

  constructor(
    private _pref: PreferencesService
  ) { }

  public fetchContact(contactIdentity: string): Promise<any> {
    console.log(`OSMClientService... FetchContact (${contactIdentity})`);
    return new Promise((resolve, reject) => {
      request({
        url: `${this._pref.preferences.api_url}/keys/?user=${contactIdentity}`,
        method: 'GET'
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
        url: `${this._pref.preferences.api_url}/keys/count?user=${hashAccountName}`,
        method: 'GET'
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          if (response.content && response.content.toString().indexOf('Key not found in database') != -1) {
            return reject(new Error('Not_Registered'));
          } else {
            return reject(new Error('Bad_Status'));
          }
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
        url: `${this._pref.preferences.api_url}/keys`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        content: JSON.stringify(clientDetails)
      }).then((response) => {
        if (response.statusCode !== 200) {
          console.log('OSMClientService... RESPONSE');
          console.dir(response);
          if (response.content && response.content.toString().indexOf('UserMaxPreKeys') != -1) {
            return reject(new Error('Max_PreKeys'));
          } else {
            return reject(new Error('Bad_Status'));
          }

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
        return reject(e.message ? e.message : e);
      });
    });
  }

  public putMessage(putMessageBody: IPutMessage) {
    console.log(`OSMClientService... PutMessage`);
    console.dir(putMessageBody);
    console.log('---');

    return new Promise((resolve, reject) => {
      request({
        url: `${this._pref.preferences.api_url}/messages`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
        url: `${this._pref.preferences.api_url}/messages?deviceId=${deviceId}&registrationId=${registrationId}`,
        method: 'GET',
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

  public delMessage(messageKey: string) {
    console.log(`OSMClientService... DeleteMessage (${messageKey})`);

    return new Promise((resolve, reject) => {
      request({
        url: `${this._pref.preferences.api_url}/messages?key=${messageKey}`,
        method: 'DELETE',
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
