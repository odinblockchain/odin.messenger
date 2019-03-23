import { Deserializable } from '../deserializable.model';

export class Message implements Deserializable {
  public id: number;
  public account_bip44: number;
  public contact_username: string;
  public owner_username: string;
  public message: string;
  public timestamp: number;
  public favorite: number;
  private unread: string;

  constructor(props: any) {
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
