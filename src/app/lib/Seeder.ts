import SecureRandom from './SecureRandom';
import { Observable, EventData } from "data/observable";
// import * from 'nativescript-nodeify';
// import * as createHash from 'create-hash';
// import * as cryptoBrowserify from 'crypto-browserify';
import * as shajs from 'sha.js'

export default class Seeder extends Observable {
  public seedCount = 0;
  public lastInputTime = new Date().getTime();
  public lastMoveX = 0;
  public lastMoveY = 0;
  public seedPoints = [];
  public secureRandom = new SecureRandom();
  public seedLimit;
  public poolHex;
  public poolFilled : boolean = false;
  public poolBusy : boolean = false;

  constructor() {

    super();

    // console.log(sha256);
    
    this.seedLimit = (function(_this) {
      let num = _this.randomBytes(12)[11];
      return 10 + Math.floor(num);
    })(this);

    console.log(`\t Seeder created... Limit:${this.seedLimit}`);
    this.set('poolHex', '0x00');
    this.set('seedCount', this.seedCount);
    this.set('seedLimit', this.seedLimit);
    this.set('poolBusy', false);
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
  public randomBytes = function(n) {

    let bytes;
    for (bytes = []; n > 0; n--) {
      bytes.push(Math.floor(Math.random() * 256));
    }

    return bytes;
  }

  // Convert a byte array to a hex string
  public bytesToHex = function(bytes) {

    let hex, i;

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
    if (Math.abs(this.lastMoveY - moveY) < 5 && this.lastMoveY != 0) return

    this.secureRandom.seedTime();
    this.secureRandom.seedInt16((moveX * moveY));
    this.seedCount++;
    this.lastInputTime = new Date().getTime();
    this.lastMoveX = moveX;
    this.lastMoveY = moveY;
    this.showPool();
    this.set('seedCount', this.seedCount);

    if (this.seedCount === this.seedLimit) {
      let eventData: EventData = {
        eventName: 'complete',
        object: this
      }

      this.notify(eventData)
      this.poolFilled = true
    }
  }

  public showPool = function() {

    if (this.secureRandom.poolCopyOnInit != null) {
      this.poolHex = this.bytesToHex(this.secureRandom.poolCopyOnInit);
    }
    else {
      this.poolHex = this.bytesToHex(this.secureRandom.pool);
    }

    this.set('poolHex', this.poolHex);
  }
}
