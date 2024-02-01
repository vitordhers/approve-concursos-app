import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faArrowLeft,
  faRightToBracket,
  faUser,
  faFont,
  faIdCard,
  faXmark,
  faPaperPlane,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { CpfDirective } from '../../../shared/directives/cpf.directive';
import { EMPTY, Subject, from, switchMap, take, takeUntil, tap } from 'rxjs';
import { StorageService } from '../../../services/storage.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AUTOCOMPLETE_STORAGE_KEY } from './constants/autocomplete-storage-key.const';
import { AuthDialogData } from './interface/auth-dialog-data.interface';
import { AutocompleteOptions } from './interface/autocomplete-options.interface';
import { matchPasswordsValidator } from './functions/match-passwords-validator.function';
import { EMAIL_REGEX } from './constants/email-regex.const';
import { STRONG_PASSWORD_REGEX } from './constants/strong-password-regex.const';
import { AuthService } from '../../../services/auth/auth.service';
import { fireToast } from '../../../notification/functions/fire-toast.function';
import { SignInDto } from '../../../services/auth/interfaces/signin-dto.interface';
import { UserService } from '../../../services/user/user.service';
import { environment } from '../../../../environments/environment';
import { PlatformService } from '../../../services/platform.service';
import { RecaptchaBadgeService } from '../../../services/recaptcha-badge.service';
import { Router } from '@angular/router';
import { SignUpDto } from '../../../services/auth/interfaces/signup-dto.interface';
import { LoaderComponent } from '../../loader/loader.component';
import { VerifyEmailDto } from '../../../services/auth/interfaces/verify-email-dto.interface';
import Swal from 'sweetalert2';
import { RecoverPasswordDto } from '../../../services/auth/interfaces/recover-password-dto.interface';
import { ResendConfirmationEmailDto } from '../../../services/auth/interfaces/resend-confirmation-email-dto.interface';
import { RedefinePasswordDto } from '../../../services/user/interfaces/redefine-password-dto.interface';

declare const grecaptcha: {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatTabsModule,
    FontAwesomeModule,
    MatCheckboxModule,
    CpfDirective,
    MatProgressSpinnerModule,
    LoaderComponent,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent implements OnInit, OnDestroy {
  faEnvelope = faEnvelope;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  faRightToBracket = faRightToBracket;
  faUser = faUser;
  faFont = faFont;
  faIdCard = faIdCard;
  faXmark = faXmark;
  faPaperPlane = faPaperPlane;
  faCheckDouble = faCheckDouble;

  currentTabIndex = signal(1);

  useAutoComplete = signal(false);

  toolbarTitle = computed(() => {
    switch (this.currentTabIndex()) {
      case 0:
        return 'Cadastre-se';
      case 1:
        return 'Login';
      case 2:
        return 'Recuperar senha';
      case 3:
        return 'Reenviar e-mail de confirmação';
      case 4:
        return 'Redefinir senha';
      case 5:
        return 'Verificando e-mail';
      default:
        return 'Cadastre-se';
    }
  });

  toolbarIcon = computed(() => {
    switch (this.currentTabIndex()) {
      case 0:
        return this.faUser;
      case 1:
        return this.faRightToBracket;
      case 2:
        return this.faEnvelope;
      case 3:
        return this.faLock;
      case 4:
        return this.faLock;
      case 5:
        return this.faCheckDouble;
      default:
        return this.faUser;
    }
  });

  showSignInPassword = signal(false);
  showSignUpPassword = signal(false);
  showSignUpConfirmPassword = signal(false);
  showRedefinePassword = signal(false);
  showRedefineConfirmPassword = signal(false);

  signInLoading = signal(false);
  signUpLoading = signal(false);
  recoverPasswordLoading = signal(false);
  resendVerifyEmailLoading = signal(false);
  redefinePasswordLoading = signal(false);

  destroy$ = new Subject<void>();

  signInForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(EMAIL_REGEX),
      ],
    }),
    password: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(STRONG_PASSWORD_REGEX),
      ],
    }),
    rememberMe: new FormControl<boolean>(false, { nonNullable: true }),
  });

  signUpForm = new FormGroup({
    name: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
    }),
    email: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(EMAIL_REGEX),
      ],
    }),
    cpf: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [Validators.minLength(14), Validators.maxLength(14)],
    }),
    password: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(STRONG_PASSWORD_REGEX),
      ],
    }),
    confirmPassword: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        matchPasswordsValidator('password', 'confirmPassword'),
      ],
    }),
  });

  passwordRecoveryForm = new FormGroup({
    email: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(EMAIL_REGEX),
      ],
    }),
  });

  resendConfirmationEmailForm = new FormGroup({
    email: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        Validators.pattern(EMAIL_REGEX),
      ],
    }),
  });

  redefinePasswordForm = new FormGroup({
    password: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(STRONG_PASSWORD_REGEX),
      ],
    }),
    confirmPassword: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [
        Validators.required,
        matchPasswordsValidator('password', 'confirmPassword'),
      ],
    }),
  });

  constructor(
    @Inject(DIALOG_DATA) public data: AuthDialogData,
    private dialogRef: DialogRef<undefined, AuthComponent>,
    private storageService: StorageService,
    private authService: AuthService,
    private userService: UserService,
    private platformService: PlatformService,
    private recaptchaBadgeService: RecaptchaBadgeService,
    private router: Router
  ) {
    this.currentTabIndex.set(data.initialTabIndex);

    const loadedOptions = this.storageService.getKey<AutocompleteOptions>(
      AUTOCOMPLETE_STORAGE_KEY
    );
    if (!loadedOptions || !loadedOptions.remember) {
      const options: AutocompleteOptions = { remember: false };
      this.storageService.setKey(AUTOCOMPLETE_STORAGE_KEY, options);
      return;
    }

    this.signInForm.controls['rememberMe'].patchValue(loadedOptions.remember);
    this.useAutoComplete.set(false);
  }

  ngOnInit(): void {
    this.recaptchaBadgeService.displayBadge();

    this.signUpForm.controls['password'].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.signUpForm.controls['confirmPassword'].updateValueAndValidity();
      });

    if (this.currentTabIndex() === 2 && this.data.recoverPasswordEmail) {
      this.passwordRecoveryForm.controls['email'].patchValue(
        this.data.recoverPasswordEmail
      );
    }

    if (this.currentTabIndex() === 3 && this.data.resendConfirmationTo) {
      this.resendConfirmationEmailForm.controls['email'].patchValue(
        this.data.resendConfirmationTo
      );
    }

    if (this.currentTabIndex() === 5) {
      this.verifyUser();
    }
  }

  toggleShowPassword(
    toggleId:
      | 'signUp'
      | 'signUpConfirm'
      | 'signin'
      | 'redefine'
      | 'redefineConfirm'
  ) {
    switch (toggleId) {
      case 'signUp':
        return this.showSignUpPassword.update((show) => !show);
      case 'signUpConfirm':
        return this.showSignUpConfirmPassword.update((show) => !show);
      case 'signin':
        return this.showSignInPassword.update((show) => !show);
      case 'redefine':
        return this.showRedefinePassword.update((show) => !show);
      case 'redefineConfirm':
        return this.showRedefineConfirmPassword.update((show) => !show);
    }
  }

  setTabIndex(index: number) {
    this.currentTabIndex.set(index);
  }

  dismiss() {
    this.dialogRef.close();
  }

  signIn() {
    if (!this.platformService.isBrowser || !grecaptcha) return;
    if (!this.signInForm.valid) {
      return this.signInForm.markAllAsTouched();
    }
    const { email, password } = this.signInForm.value;
    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        take(1),
        tap((_) => {
          this.signInLoading.set(true);
        }),
        switchMap((recaptcha) => {
          if (!recaptcha) return EMPTY;
          const signInDto: SignInDto = {
            email: email as string,
            password: password as string,
            recaptcha,
          };
          return this.authService.signIn(signInDto);
        })
      )
      .subscribe({
        next: (result) => {
          this.signInLoading.set(false);
          if (!result?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }

          if ('nonValidatedUser' in result && result.nonValidatedUser) {
            fireToast(
              'Atenção 👀',
              `Para fazer o login, você deve primeiro confirmar seu e-mail`,
              'info'
            );
            this.setTabIndex(3);
            return;
          }

          fireToast('Sucesso 😉', 'Seja bem-vindo!', 'success');
          this.dismiss();
          this.router.navigate(['painel'], { fragment: 'desempenho' });
        },
        error: (err) => {
          console.error(err);
          this.signInLoading.set(false);
          return fireToast(
            'Erro 😞',
            'por gentileza, tente novamente',
            'error'
          );
        },
      });
  }

  signUp() {
    if (!this.platformService.isBrowser || !grecaptcha) return;
    if (!this.platformService.isBrowser) return;
    if (!this.signUpForm.valid) {
      return this.signUpForm.markAllAsTouched();
    }
    const { name, email, password, cpf } = this.signUpForm.value;
    if (!email) {
      return this.signUpForm.markAllAsTouched();
    }
    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        take(1),
        tap((_) => {
          this.signUpLoading.set(true);
        }),
        switchMap((recaptcha) => {
          if (!recaptcha) return EMPTY;
          const signUpDto: SignUpDto = {
            name: name as string,
            email: email as string,
            password: password as string,
            cpf,
            recaptcha,
          };
          return this.userService.signUp(signUpDto);
        })
      )
      .subscribe({
        next: (result) => {
          this.signUpLoading.set(false);
          if (!result?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }

          Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 8000,
            timerProgressBar: true,
            didOpen: (t) => {
              t.addEventListener('mouseenter', Swal.stopTimer);
              t.addEventListener('mouseleave', Swal.resumeTimer);
            },
            heightAuto: false,
            title: 'Cadastro efetuado com sucesso',
            html: `Enviamos a confirmação do seu cadastro para <b>${email}</b>, confirme o cadastro antes de fazer o login.`,
            icon: 'info',
          });
          this.dismiss();
          this.signUpLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.signUpLoading.set(false);
          return fireToast(
            'Erro 😞',
            'por gentileza, tente novamente',
            'error'
          );
        },
      });
  }

  recoverPassword() {
    const { email } = this.passwordRecoveryForm.value;
    if (!this.platformService.isBrowser || !grecaptcha || !email) return;
    if (!this.platformService.isBrowser) return;
    if (this.passwordRecoveryForm.invalid) {
      this.passwordRecoveryForm.markAllAsTouched();
    }

    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        take(1),
        tap((_) => {
          this.recoverPasswordLoading.set(true);
        }),
        switchMap((recaptcha) => {
          console.log({ recaptcha });
          if (!recaptcha) return EMPTY;
          const recoverPasswordDto: RecoverPasswordDto = {
            email,
            recaptcha,
          };
          return this.authService.recoverPassword(recoverPasswordDto);
        })
      )
      .subscribe({
        next: (response) => {
          if (!response || !response.body || !response.body?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }

          if (response.body.data && response.body.data.nonValidatedUser) {
            fireToast(
              'Atenção 👀',
              `Para redefinir sua senha, você deve primeiro confirmar seu e-mail`,
              'info'
            );
            this.setTabIndex(3);
            return;
          }

          fireToast(
            'Sucesso 😉',
            `E-mail enviado com sucesso! Verifique seu endereço e-mail para os próximos passos`,
            'success'
          );
          this.recoverPasswordLoading.set(false);
          this.dismiss();
        },
        error: (err) => {
          this.recoverPasswordLoading.set(false);
        },
      });
  }

  verifyUser() {
    const { verifyToken: token } = this.data;
    if (!token) return;

    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        take(1),
        switchMap((recaptcha) => {
          console.log({ recaptcha });
          if (!recaptcha) return EMPTY;
          const verifyUserDto: VerifyEmailDto = {
            token,
            recaptcha,
          };
          return this.authService.verifyUser(verifyUserDto);
        })
      )
      .subscribe({
        next: (response) => {
          if (!response || !response.body || !response.body?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }

          fireToast(
            'Sucesso 😉',
            `E-mail verificado com sucesso! Faça o login para começar a utilizar a plataforma`,
            'success'
          );
          this.setTabIndex(1);
        },
        error: (err) => {
          console.error('verifyUser error', { err });
          fireToast(
            'Erro 😞',
            'por gentileza, verifique se seu código ainda é válido',
            'error'
          );
          this.dismiss();
        },
      });
  }

  resendVerifyEmail() {
    const { email } = this.resendConfirmationEmailForm.value;
    if (!this.platformService.isBrowser || !grecaptcha || !email) return;
    if (!this.platformService.isBrowser) return;
    if (this.resendConfirmationEmailForm.invalid) {
      this.resendConfirmationEmailForm.markAllAsTouched();
    }

    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        take(1),
        tap((_) => {
          this.resendVerifyEmailLoading.set(true);
        }),
        switchMap((recaptcha) => {
          if (!recaptcha) return EMPTY;
          const recoverPasswordDto: ResendConfirmationEmailDto = {
            email,
            recaptcha,
          };
          return this.authService.resendConfirmationEmail(recoverPasswordDto);
        })
      )
      .subscribe({
        next: (response) => {
          if (!response || !response.body || !response.body?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }

          fireToast(
            'Sucesso 😉',
            `E-mail enviado com sucesso! Verifique seu endereço e-mail para os próximos passos`,
            'success'
          );
          this.resendVerifyEmailLoading.set(false);
          this.setTabIndex(1);
        },
        error: (err) => {
          this.resendVerifyEmailLoading.set(false);
        },
      });
  }

  redefinePassword() {
    const { password } = this.redefinePasswordForm.value;
    const { redefinePasswordToken: token } = this.data;

    if (!this.platformService.isBrowser || !grecaptcha || !password || !token)
      return;
    if (!this.platformService.isBrowser) return;
    if (this.passwordRecoveryForm.invalid) {
      this.passwordRecoveryForm.markAllAsTouched();
    }

    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        take(1),
        tap((_) => {
          this.redefinePasswordLoading.set(true);
        }),
        switchMap((recaptcha) => {
          if (!recaptcha) return EMPTY;
          const recoverPasswordDto: RedefinePasswordDto = {
            password,
            recaptcha,
            token,
          };
          return this.userService.redefinePassword(recoverPasswordDto);
        })
      )
      .subscribe({
        next: (response) => {
          if (!response || !response.body || !response.body?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }

          if (response.body.data && response.body.data.nonValidatedUser) {
            fireToast(
              'Atenção 👀',
              `Para redefinir sua senha, você deve primeiro confirmar seu e-mail`,
              'info'
            );
            this.setTabIndex(3);
            return;
          }

          fireToast(
            'Sucesso 😉',
            `Senha redefinida com sucesso! Acesse sua conta`,
            'success'
          );
          this.redefinePasswordLoading.set(false);
          this.setTabIndex(1);
        },
        error: (err) => {
          this.redefinePasswordLoading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.recaptchaBadgeService.hideBadge();
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
