import { Observable } from "tns-core-modules/ui/page/page";
import { hasKey } from "tns-core-modules/application-settings";

export class Identity extends Observable {
  store: any;
  fetch: any;

  masterSeed: string;
  mnemonicPhrase: string;
  seedHex: string;
  activeAccountIndex: number;
  fcmToken: string;

  constructor(props?: any) {
    super();
    
    this.masterSeed = '';
    this.mnemonicPhrase = '';
    this.seedHex = '';
    this.activeAccountIndex = 0;
    this.fcmToken = '';

    this.deserialize(props);
  }

  /**
   *  Logs `entry` to the console via `console.log`. 
   * 
   * @param entry The string to output to the console
   */
  protected log(entry: string): void {
    console.log(`[Identity] ${entry}`);
  }

  setFcmToken(token: string) {
    this.fcmToken = token;
    this.save();
  }

  save() {
    this.store({
      masterSeed:         this.masterSeed,
      seedHex:            this.seedHex,
      mnemonicPhrase:     this.mnemonicPhrase,
      activeAccountIndex: this.activeAccountIndex,
      fcmToken:           this.fcmToken
    });
  
    this.log(`Integrity check — saved:${hasKey('identity')}`);
    this.log(JSON.stringify(this.fetch()));
  }

  serialize() {
    return {
      masterSeed: this.masterSeed,
      mnemonicPhrase: this.mnemonicPhrase,
      activeAccountIndex: this.activeAccountIndex,
      fcmToken: this.fcmToken
    }
  }

  deserialize(input: any = {}) {
    Object.assign(this, input);
    return this;
  }
}
