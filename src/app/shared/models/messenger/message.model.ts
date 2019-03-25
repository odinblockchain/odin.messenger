import { Deserializable } from '../deserializable.model';
import { Database } from '../database.model';

export class Message extends Database {
  public id: number;
  public account_bip44: number;
  public contact_username: string;
  public owner_username: string;
  public message: string;
  public timestamp: number;
  public favorite: number;
  private unread: string;

  constructor(props: any) {
    super('Message');
    this.deserialize(props);
  }
  
  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  getMessage() {
    return this.message;
  }

  isUnread() {
    return (this.unread === 'true' ? true : false);
  }
}
