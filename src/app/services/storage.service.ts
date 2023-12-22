import { Injectable } from '@angular/core';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(private platformService: PlatformService) {}

  getKey<T = any>(key: string): T | undefined {
    if (!this.platformService.isBrowser) return;
    const itemString = localStorage.getItem(key);
    if (!itemString) {
      console.warn(
        'StorageService getKey:',
        { key, itemString },
        'is missing!'
      );
      return;
    }
    try {
      const item: T = JSON.parse(itemString);
      return item;
    } catch (error) {
      console.error(
        `StorageService getKey: ${{ key, itemString }} parsing error`
      );
      return;
    }
  }

  setKey(key: string, payload: any) {
    if (!this.platformService.isBrowser) return;
    try {
      const item = JSON.stringify(payload);
      localStorage.setItem(key, item);
    } catch (error) {
      console.error(
        `StorageService setKey: ${{ key, payload }} stringifying error`
      );
    }
  }

  removeKey(key: string) {
    if (!this.platformService.isBrowser) return;
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`StorageService removeKey: key ${key} removed`);
      return;
    }
    console.warn(
      `StorageService removeKey: key ${key} wasn't found in storage`
    );
  }
}
