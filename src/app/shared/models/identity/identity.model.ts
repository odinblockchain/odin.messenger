import { Observable } from "tns-core-modules/ui/page/page";
import { hasKey } from "tns-core-modules/application-settings";

export class Identity extends Observable {
  store: any;
  fetch: any;

  masterSeed: string;
  mnemonicPhrase: string;
  seedHex: string;
  activeAccountIndex: number;

  constructor(props?: any) {
    super();
    
    this.masterSeed = '';
    this.mnemonicPhrase = '';
    this.seedHex = '';
    this.activeAccountIndex = 0;

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

  save() {
    this.store({
      masterSeed:         this.masterSeed,
      seedHex:            this.seedHex,
      mnemonicPhrase:     this.mnemonicPhrase,
      activeAccountIndex: this.activeAccountIndex
    });
  
    this.log(`[Identity] Integrity check — saved?${hasKey('identity')}`);
    this.log(this.fetch());
  }

  serialize() {
    return {
      masterSeed: this.masterSeed,
      mnemonicPhrase: this.mnemonicPhrase,
      activeAccountIndex: this.activeAccountIndex
    }
  }

  deserialize(input: any = {}) {
    Object.assign(this, input);
    return this;
  }
}
