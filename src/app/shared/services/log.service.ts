import { Injectable } from '@angular/core';
import { StorageService } from '../storage.service';
import { Log } from '../models/log.model';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LogService extends StorageService {
  public logs: Log[] = [];
  public _logs$: BehaviorSubject<Log[]> = new BehaviorSubject([]);
  public readonly blogs$: Observable<Log[]> = this._logs$.asObservable();

  constructor() {
    super('LogService');
    
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
    if (!await this.dbReady()) {
      return new Error('db_not_open');
    }

    this.logs   = [];
    this._logs$.next(this.logs);

    return new Promise(async (resolve, reject) => {
      try {
        const logs: Log[] = await this.odb.all('SELECT * FROM logs');

        while (logs.length > 0) {
          const log = new Log(logs.shift());
          this.logs.push(log);
        }

        this._logs$.next(this.logs);
        this.log(`logs loaded... total:${this.logs.length}`);
        return resolve(this.logs);
      } catch (err) {
        this.log('Unable to load logs...');
        console.log(err);
        return reject(err);
      }
    });
  }

  public logger(message: string|any) {
    this.dbReady()
    .then(ready => {
      if (!ready) {
        this.log('logger failed, db not ready');
        return;
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
        const log = new Log({
          timestamp,
          message: logMessage
        });

        this.logs.push(log);
        this._logs$.next(this.logs);

        this.log(`Event logged: "${logMessage}"`);
      }).catch(console.log);
    }).catch(console.log);
  }
}
