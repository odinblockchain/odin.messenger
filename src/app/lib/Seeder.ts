import SecureRandom from './SecureRandom';
import { Observable, EventData } from "data/observable";
import * as shajs from 'sha.js'

export default class Seeder extends Observable {
  public seedCount: number;
  public lastInputTime: number;
  public lastMoveX: number;
  public lastMoveY: number;
  public seedPoints: any[];
  public secureRandom: SecureRandom;
  public seedLimit: number;
  public poolHex;
  public poolFilled: boolean;
  public poolBusy: boolean;

  constructor(maxSeedLimit?: number) {
    super();

    this.poolFilled     = false;
    this.poolBusy       = false;
    this.seedCount      = 0;
    this.lastInputTime  = new Date().getTime();
    this.lastMoveX      = 0;
    this.lastMoveY      = 0;
    this.seedPoints     = [];
    this.secureRandom   = new SecureRandom();
    this.seedLimit      = (maxSeedLimit)
                            ? Math.max(this.RNGLimit(), maxSeedLimit)
                            : this.RNGLimit();

    if (maxSeedLimit) this.seedLimit = Math.max(this.seedLimit, maxSeedLimit);

    console.log(`\t Seeder created... Limit:${this.seedLimit}`);
    this.set('poolHex', '0x00');
    this.set('seedCount', this.seedCount);
    this.set('seedLimit', this.seedLimit);
    this.set('poolBusy', false);
  }

  private RNGLimit(): number {
    return 10 + Math.floor(this.randomBytes(12)[11]);
  }

  public complete = function() {
    this.set('poolBusy', true);
    let eventData: EventData = {
      eventName: 'complete',
      object: this
    };

    this.notify(eventData);
    this.poolFilled = true;
  }

  // Generate an array of any length of random bytes
  public randomBytes = function(n: number) {
    let bytes;
    for (bytes = []; n > 0; n--) {
      bytes.push(Math.floor(Math.random() * 256));
    }

    return bytes;
  }

  // Convert a byte array to a hex string
  public bytesToHex = function(bytes) {
    let hex: any[], i: number;

    for (hex = [], i = 0; i < bytes.length; i++) {
      hex.push((bytes[i] >>> 4).toString(16));
      hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join("");
  }

  public sha256Seed = function() {
    // return this.poolHex;
    return shajs('sha256').update(this.poolHex).digest('hex')
  }

  public getBytes = function() {
    return this.secureRandom.getByte()
  }

  public seed = function(moveX, moveY) {
    if (!this.poolBusy) this.set('poolBusy', true);

    let timestamp = new Date().getTime();

    if (!moveX || !moveY) return;
    if (this.seedCount === this.seedLimit) return;
    if ((timestamp - this.lastInputTime) < 60) return;
    if (Math.abs(this.lastMoveX - moveX) < 5 && this.lastMoveX != 0) return;
    if (Math.abs(this.lastMoveY - moveY) < 5 && this.lastMoveY != 0) return;

    this.secureRandom.seedTime();
    this.secureRandom.seedInt16((moveX * moveY));
    this.seedCount++;
    this.lastInputTime = new Date().getTime();
    this.lastMoveX = moveX;
    this.lastMoveY = moveY;
    this.showPool();
    this.set('seedCount', this.seedCount);

    if (this.seedCount >= this.seedLimit && !this.poolFilled) {
      this.poolFilled = true;

      let eventData: EventData = {
        eventName: 'complete',
        object: this
      }

      this.notify(eventData);
    }
  }

  public showPool = function() {
    if (this.secureRandom.poolCopyOnInit != null) {
      this.poolHex = this.bytesToHex(this.secureRandom.poolCopyOnInit);
    } else {
      this.poolHex = this.bytesToHex(this.secureRandom.pool);
    }

    this.set('poolHex', this.poolHex);
  }
}
