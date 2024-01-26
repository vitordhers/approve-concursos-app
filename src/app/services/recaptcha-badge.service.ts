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
      const logoElement = element
        .getElementsByClassName('grecaptcha-logo')
        .item(0) as HTMLDivElement;
      if (!element || !logoElement) return;
      logoElement.style.opacity = '1';
      element.style.display = 'block';
      element.style.zIndex = '2000';
    });
  }

  hideBadge() {
    if (!this.platformService.isBrowser) return;
    this.ngZone.runOutsideAngular(() => {
      const element = document
        .getElementsByClassName('grecaptcha-badge')
        .item(0) as HTMLDivElement;
      if (!element) return;
      const logoElement = element
        .getElementsByClassName('grecaptcha-logo')
        .item(0) as HTMLDivElement;
      if (!element || !logoElement) return;
      logoElement.style.opacity = '0';
      setTimeout(() => {
        element.style.display = 'none';
        element.style.zIndex = '0';
      }, 300);
    });
  }
}
