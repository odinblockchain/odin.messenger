import { Deserializable } from "./deserializable.model";
import { Inject, Optional } from "@angular/core";
import { Subject } from "rxjs";

export class Database implements Deserializable {
  private eventStream: Subject<string>;
  public db: any;

  constructor(
    @Inject('modelId') @Optional() public modelId?: string) {
    this.modelId = modelId || 'Database';
    this.eventStream = new Subject();

    this.log('[Init]');
    this.emit(`Init`);
  }

  get eventStream$() {
    return this.eventStream.asObservable();
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

  /**
   * (protected) Logs `entry` to the console via `console.log`. Will prefix the log with
   * `serviceId` to namespace the log output.
   * 
   * @param entry The string to output to the console
   */
  protected log(entry: string): void {
    const subId = (this.modelId === 'Database') ? '::Model' : '';
    console.log(`[${this.modelId}${subId}] ${entry}`);
  }

  /**
   * (protected) Logs `entry` to the console via `console.dir`. This method is for outputting
   * Objects/Arrays.
   * 
   * @param entry Array|Object|Any
   */
  protected dir(entry: any): void {
    const subId = (this.modelId === 'Database') ? '::Model' : '';
    console.log(`[${this.modelId}${subId}] Inspect ---`);
    console.dir(entry);
    console.log('———————');
  }

  /**
   * (protected) Emits `eventName` through the `eventStream` `ReplaySubject`. Anyone listening
   * will receive `eventName` and all previous events.
   * 
   * Will also prefix all events with `serviceId`.
   * 
   * @param eventName Name of the event
   */
  public emit(eventName: string): void {
    this.eventStream.next(eventName);
  }
}
