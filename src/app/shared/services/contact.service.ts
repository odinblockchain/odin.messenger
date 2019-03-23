import { Injectable } from '@angular/core';
import { Contact } from '~/app/shared/models/messenger/';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from '../storage.service';

@Injectable({
  providedIn: 'root'
})
export class ContactService extends StorageService {
  public contacts: Contact[];
  public contactSource: BehaviorSubject<Array<Contact>>;
  public contacts$: Observable<Contact[]>;
  private count: any;
  private timer: any;

  constructor() {
    super('ContactService');
    this.contacts = [];

    // this.contactSource = new BehaviorSubject([new Contact({username: 'foobar'})]);
    // this.contacts$ = this.contactSource.asObservable();

    this.init = this.init.bind(this);
    this.loadContacts = this.loadContacts.bind(this);

    // this.count = 0;
    // this.timer = setInterval(() => {
    //   if (this.count > 5) {
    //     clearInterval(this.timer);
    //   } else {
    //     this.count++;
    //     this.contactSource.next([ ...this.contactSource.getValue(), new Contact({ username: `friend_${this.count}@odin` })]);
    //     console.log(`Added contact -- ${this.count}`);
    //   }
    // }, 3000);
  }

  public async init() {
    return new Promise((resolve, reject) => {
      this.connect()
      .then(this.loadContacts)
      .then(resolve)
      .catch(err => {
        this.log('Unable to init service');
        console.log(err);
        reject(err);
      });
    });
  }

  private async loadContacts() {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise(async (resolve, reject) => {
      try {
        const contacts: Contact[] = await this.odb.all('SELECT account_bip44, username, name, address FROM contacts');
        this.contacts = contacts.map(contact => {
          contact = new Contact(contact);
          contact.db = this.odb;
          return contact;
        });

        this.log(`coins loaded...${this.contacts.length}`);
        return resolve(this.contacts);
      } catch (err) {
        this.log('Unable to load contacts...');
        console.log(err);
        return reject(err);
      }
    });
  }

  public async createContact(contact: Contact) {
    if (!this.dbReady()) {
      return new Error('db_not_open');
    }

    return new Promise((resolve, reject) => {
      if (this.contacts.find(c => c.username === contact.username)) {
        return reject(new Error(`Contact (${contact.username}) already exists`));
      }

      this.odb.execSQL(`INSERT INTO contacts (account_bip44, username, name) values (?, ?, ?)`, [
        contact.account_bip44,
        contact.username,
        contact.name
      ])
      .then((id: number) => {
        contact.db = this.odb;
        this.contacts.push(contact);
        return resolve(id);
      })
      .catch(reject);
    });
  }

  public findContact(username: string, account_bip44?: number) {
    return this.contacts.find((c: Contact) => {
      if (account_bip44 && account_bip44 !== c.account_bip44) return false;
      return c.username === username;
    });
  }
}
