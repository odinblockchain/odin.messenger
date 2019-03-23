import { Deserializable } from "./deserializable.model";

export class Database implements Deserializable {
  db: any;

  constructor() {
    console.log('---Create DB Instance');
  }

  public deserialize(input: any) {
    Object.assign(this, input);
    return this;
  }

  /**
   * Checks if `odb` has been created and is open.
   * Will return `true` if checks complete, `false` otherwise.
   */
  public dbReady(): boolean {
    return !!(this.db && this.db.isOpen());
  }
}
