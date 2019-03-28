import { Injectable } from '@angular/core';
import { Coin } from '~/app/shared/models/identity';
import { StorageService } from '../storage.service';
import { Log } from '../models/log.model';
const SqlLite = require('nativescript-sqlite');

@Injectable({
  providedIn: 'root'
})
export class LogService extends StorageService {
  logs: Log[];

  constructor() {
    super('LogService');
    this.logs = [];

    this.init = this.init.bind(this);
    this.loadLogs = this.loadLogs.bind(this);
    this.logger = this.logger.bind(this);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadLogs)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  private async loadLogs() {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const logs: Log[] = await this.odb.all('SELECT * FROM logs');
        this.logs = logs.map(log => {
          log = new Log(log);
          console.log('log', log.message);
          return log;
        });

        this.log(`logs loaded...${this.logs.length}`);
        return resolve(this.logs);
      } catch (err) {
        this.log('Unable to load logs...');
        console.log(err);
        return reject(err);
      }
    });
  }

  public logger(message: string|any) {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    const timestamp   = Date.now();
    const logMessage  = typeof message === 'object'
                      ? JSON.stringify(message)
                      : message;
 
    this.odb.execSQL(`INSERT INTO logs (timestamp, message) values (?, ?)`, [
      timestamp,
      logMessage
    ])
    .then((id: number) => {
      this.logs.push(new Log({
        timestamp: timestamp,
        message: logMessage
      }));
      this.log('successful log');
    })
    .catch(console.log);
  }
}
