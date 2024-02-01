import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PlatformService, ScreenSizes } from './platform.service';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(
    private dialog: MatDialog,
    private platformService: PlatformService
  ) {}

  openModal<C, D, R>(
    component: ComponentType<C>,
    data?: D,
    config?: MatDialogConfig<D>
  ) {
    const dialogRef = this.dialog.open<C, D, R>(component, {
      maxWidth: '100%',
      width:
        this.platformService.currentScreenSize() <= ScreenSizes.SMALL
          ? '100%'
          : '768px',
      ...config,
      data,
    });

    return dialogRef.afterClosed();
  }
}
