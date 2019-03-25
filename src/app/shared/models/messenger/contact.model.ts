import { Database } from '../database.model';

export class Contact extends Database {
  account_bip44: number;
  username: string;
  name: string;
  address: string;
  unread: boolean;

  constructor(props: any) {
    super('Contact');
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  public async getMessages() {
    if (!this.db || !this.db.isOpen()) {
      return [];
    }
    
    return await this.db.all(`SELECT messages.account_bip44, name, contact_username, owner_username, message, timestamp, messages.unread, favorite FROM messages INNER JOIN contacts ON messages.contact_username = contacts.username WHERE contacts.username = ?`, this.username);
  }
}
