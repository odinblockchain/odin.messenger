import { Database } from './database.model';

export class Log extends Database {
  timestamp: number;
  message: string;

  constructor(props: any) {
    super('Log');
    this.deserialize(props);
  }

  deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }
}
