import { Injectable } from "@angular/core";
import { request } from "http";
import { PreferencesService } from "./preferences.service";

@Injectable()
export class WalletClientService {
  
  constructor(
    private _pref: PreferencesService
  ) { }
}
