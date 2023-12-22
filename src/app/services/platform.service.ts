import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';

enum Breakpoints {
  SMALL = '(max-width: 768px)',
  MEDIUM = '(min-width: 768.01px) and (max-width: 1280px)',
  LARGE = '(min-width: 1280.01px)',
}

export enum ScreenSizes {
  SMALL,
  MEDIUM,
  LARGE,
  UNKNOWN,
}

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  currentScreenSize = ScreenSizes.UNKNOWN;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private breakpointObserver: BreakpointObserver
  ) {
    this.observeScreenSize();
  }

  displayNameMap = new Map([
    [Breakpoints.SMALL, ScreenSizes.SMALL],
    [Breakpoints.MEDIUM, ScreenSizes.MEDIUM],
    [Breakpoints.LARGE, ScreenSizes.LARGE],
  ]);

  get isBrowser() {
    return this.platformId === 'browser';
  }

  observeScreenSize() {
    if (!this.isBrowser) return;
    this.breakpointObserver
      .observe([Breakpoints.SMALL, Breakpoints.MEDIUM, Breakpoints.LARGE])
      .subscribe((result) => {
        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this.currentScreenSize =
              this.displayNameMap.get(query as Breakpoints) ??
              ScreenSizes.UNKNOWN;
          }
        }
      });
  }
}
