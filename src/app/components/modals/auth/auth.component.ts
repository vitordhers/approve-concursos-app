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
} from '@fortawesome/free-solid-svg-icons';
import { CpfDirective } from '../../../shared/directives/cpf.directive';
import { EMPTY, Subject, from, switchMap, takeUntil, tap } from 'rxjs';
import { StorageService } from '../../../services/storage.service';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AUTOCOMPLETE_STORAGE_KEY } from './constants/autocomplete-storage-key.const';
import { DialogData } from './interface/dialog-data.interface';
import { AutocompleteOptions } from './interface/autocomplete-options.interface';

import { matchPasswordsValidator } from './functions/match-passwords-validator.function';
import { EMAIL_REGEX } from './constants/email-regex.const';
import { STRONG_PASSWORD_REGEX } from './constants/strong-password-regex.const';
import { AuthService } from '../../../services/auth/auth.service';
import { fireToast } from '../../../notification/functions/fire-toast.function';
import { SignInDto } from '../../../services/auth/interfaces/signin-dto.interface';
import { SignUpDto } from '../../../services/user/interfaces/signup-dto.interface';
import { UserService } from '../../../services/user/user.service';
import { environment } from '../../../../environments/environment';
import { PlatformService } from '../../../services/platform.service';
import { RecaptchaBadgeService } from '../../../services/recaptcha-badge.service';
import { Router } from '@angular/router';

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

  currentTabIndex = signal(1);

  useAutoComplete = signal(false);

  toolbarTitle = computed(() => {
    switch (this.currentTabIndex()) {
      case 0:
        return 'Cadastre-se';
      case 1:
        return 'Login';
      case 2:
        return 'Recuperar Senha';
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
      default:
        return this.faUser;
    }
  });

  showSignInPassword = signal(false);
  showSignUpPassword = signal(false);
  showSignUpConfirmPassword = signal(false);

  signInLoading = signal(false);
  signUpLoading = signal(false);
  recoverPasswordLoading = signal(false);

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

  passwordRecoverForm = new FormGroup({
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

  constructor(
    @Inject(DIALOG_DATA) public data: DialogData,
    private dialogRef: DialogRef<undefined, AuthComponent>,
    private storageService: StorageService,
    private authService: AuthService,
    private userService: UserService,
    private platformService: PlatformService,
    private recaptchaBadgeService: RecaptchaBadgeService,
    private router: Router
  ) {
    this.currentTabIndex.update(() => data.initialTabIndex);
    const loadedOptions = this.storageService.getKey<AutocompleteOptions>(
      AUTOCOMPLETE_STORAGE_KEY
    );
    if (!loadedOptions || !loadedOptions.remember) {
      const options: AutocompleteOptions = { remember: false };
      this.storageService.setKey(AUTOCOMPLETE_STORAGE_KEY, options);
      return;
    }

    this.signInForm.controls['rememberMe'].patchValue(loadedOptions.remember);
    this.useAutoComplete.update(() => false);
  }

  ngOnInit(): void {
    this.recaptchaBadgeService.displayBadge();
    this.signUpForm.controls['password'].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.signUpForm.controls['confirmPassword'].updateValueAndValidity();
      });
  }

  toggleShowPassword(toggleId: 'signup' | 'signupConfirm' | 'signin') {
    switch (toggleId) {
      case 'signup':
        return this.showSignUpPassword.update((show) => !show);
      case 'signupConfirm':
        return this.showSignUpConfirmPassword.update((show) => !show);
      case 'signin':
        return this.showSignInPassword.update((show) => !show);
    }
  }

  setTabIndex(index: number) {
    this.currentTabIndex.update(() => index);
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
        tap((_) => {
          this.signInLoading.update(() => true);
        }),
        switchMap((recaptcha) => {
          if (!recaptcha) return EMPTY;
          const signInDto: SignInDto = {
            email: email as string,
            password: password as string,
            recaptcha,
          };
          return this.authService.signIn$(signInDto);
        })
      )
      .subscribe({
        next: (result) => {
          this.signInLoading.update(() => false);
          if (!result?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }
          fireToast('Sucesso 😉', 'Seja bem-vindo!', 'success');
          this.dismiss();
          this.router.navigate(['painel'], { fragment: 'desempenho' });
        },
        error: (err) => {
          console.error(err);
          this.signInLoading.update(() => false);
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
    from(
      grecaptcha.execute(environment.googleRecaptchaSiteKey, {
        action: 'login',
      })
    )
      .pipe(
        tap((_) => {
          this.signUpLoading.update(() => true);
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
          return this.userService.signUp$(signUpDto);
        })
      )
      .subscribe({
        next: (result) => {
          this.signUpLoading.update(() => false);
          if (!result?.success) {
            return fireToast(
              'Erro 😞',
              'por gentileza, tente novamente',
              'error'
            );
          }
          fireToast('Sucesso 😉', 'Seja bem-vindo!', 'success');
          this.dismiss();
          this.router.navigate(['painel'], { fragment: 'desempenho' });
        },
        error: (err) => {
          console.error(err);
          this.signUpLoading.update(() => false);
          return fireToast(
            'Erro 😞',
            'por gentileza, tente novamente',
            'error'
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.recaptchaBadgeService.hideBadge();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
