import { Injectable, NgZone, Renderer2 } from '@angular/core';
import { PlatformService } from './platform.service';

@Injectable({
  providedIn: 'root',
})
export class RecaptchaBadgeService {
  constructor(
    private platformService: PlatformService,
    private ngZone: NgZone
  ) {}

  displayBadge() {
    if (!this.platformService.isBrowser) return;

    this.ngZone.runOutsideAngular(() => {
      const element = document
        .getElementsByClassName('grecaptcha-badge')
        .item(0) as HTMLDivElement;
      if (!element) return;
      element.style.display = 'block';
    });
  }

  hideBadge() {
    if (!this.platformService.isBrowser) return;
    this.ngZone.runOutsideAngular(() => {
      const element = document
        .getElementsByClassName('grecaptcha-badge')
        .item(0) as HTMLDivElement;
      if (!element) return;
      element.style.display = 'none';
    });
  }
}
