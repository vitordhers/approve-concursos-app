import { CommonModule, registerLocaleData } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import localePtBr from '@angular/common/locales/pt';

import { UserService } from '../../../services/user/user.service';
import { Subject, takeUntil } from 'rxjs';
import { DialogRef } from '@angular/cdk/dialog';
import { fireToast } from '../../../notification/functions/fire-toast.function';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

registerLocaleData(localePtBr);
@Component({
  selector: 'app-pending-payment-modal',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, FontAwesomeModule],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './pending-payment.component.html',
  styleUrl: './pending-payment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingPaymentModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private dueTimestamp: WritableSignal<number | undefined> = signal(undefined);
  dueDate = computed(() => {
    const timestamp = this.dueTimestamp();
    if (!timestamp) return;

    return new Date(timestamp);
  });

  user = computed(() => this.userService.user());

  paymentLink = environment.paymentLink;

  faStar = faStar;

  constructor(
    private userService: UserService,
    private dialogRef: DialogRef<undefined, PendingPaymentModalComponent>
  ) {}

  ngOnInit(): void {
    this.userService.listenToSse();

    this.userService.listenToPayments$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message) => {
        if (message.type === 'unsubscribe') {
          this.closeDialogAndDisplayPaidMessage();
        }

        if (message.type === 'initial_payload') {
          if (
            typeof message.data === 'string' ||
            !('nextDueDate' in message.data)
          )
            return;

          this.dueTimestamp.set(message.data['nextDueDate']);
        }
      });
  }

  closeDialogAndDisplayPaidMessage() {
    fireToast(
      'Sucesso 😉',
      'Seu pagamento foi aceito com sucesso, aproveite a plataforma',
      'success'
    );
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
