import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import {
  EMPTY,
  Subject as RxJsSubject,
  from,
  switchMap,
  takeUntil,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  faFont,
  faFingerprint,
  faArrowLeft,
  faSave,
  faTrash,
  faClock,
  faImage,
  faEnvelope,
  faIdCard,
  faLock,
  faEyeSlash,
  faEye,
  faCrown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fireToast } from '../../../../../../notification/functions/fire-toast.function';
import { fireGenericError } from '../../../../../../notification/functions/fire-generic-error.function';
import { fireGenericSuccess } from '../../../../../../notification/functions/fire-generic-success.function';
import Swal from 'sweetalert2';
import localePtBr from '@angular/common/locales/pt';
import { Subject } from '../../../../../../models/subject.model';
import { userRecordLabels } from '../../../../../../shared/constants/user-record-labels.const';
import { EMAIL_REGEX } from '../../../../../../components/modals/auth/constants/email-regex.const';
import { STRONG_PASSWORD_REGEX } from '../../../../../../components/modals/auth/constants/strong-password-regex.const';
import { matchPasswordsValidator } from '../../../../../../components/modals/auth/functions/match-passwords-validator.function';
import { UserAdminService } from '../../../../../../services/admin/users/users.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AddUserDto } from '../../../../../../services/admin/users/interfaces/add-user-dto.interface';
import { EditUserDto } from '../../../../../../services/admin/users/interfaces/edit-user-dto.interface';
import { MatSelectModule } from '@angular/material/select';
import { CpfDirective } from '../../../../../../shared/directives/cpf.directive';
import { USER_ROLES_WITH_LABELS } from '../../../../../../shared/config/user-roles-with-labels.const';
import { PlatformService, ScreenSizes } from '../../../../../../services/platform.service';

registerLocaleData(localePtBr);

@Component({
  selector: 'subject-add-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    FontAwesomeModule,
    MatProgressSpinnerModule,
    CpfDirective,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
  templateUrl: './add-edit.component.html',
  styleUrl: './add-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEditComponent implements OnInit, OnDestroy {
  faFont = faFont;
  faFingerprint = faFingerprint;
  faArrowLeft = faArrowLeft;
  faSave = faSave;
  faTrash = faTrash;
  faClock = faClock;
  faImage = faImage;
  faEnvelope = faEnvelope;
  faIdCard = faIdCard;
  faLock = faLock;
  faEyeSlash = faEyeSlash;
  faEye = faEye;
  faCrown = faCrown;

  labels = userRecordLabels;

  loading = signal(false);

  userRolesWithLabels = USER_ROLES_WITH_LABELS;

  private destroy$ = new RxJsSubject<void>();

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
    }),
    email: new FormControl<string>('', {
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
      validators: [Validators.pattern(STRONG_PASSWORD_REGEX)],
    }),
    confirmPassword: new FormControl<string | undefined>(undefined, {
      nonNullable: true,
      validators: [matchPasswordsValidator('password', 'confirmPassword')],
    }),
    role: new FormControl<number>(0, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  updatedUser: WritableSignal<Subject | undefined> = signal(undefined);
  isEdit = computed(() => !!this.updatedUser());

  isScreenSmall = computed(() => {
    return this.platformService.currentScreenSize() <= ScreenSizes.SMALL;
  });

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userService: UserAdminService,
    private cd: ChangeDetectorRef,
    private platformService: PlatformService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((paramMap) => {
          const id = paramMap.get('id');
          if (!id) {
            this.loading.set(false);
            return EMPTY;
          }
          this.loading.set(true);
          return this.userService.getOne(id);
        })
      )
      .subscribe({
        next: (record) => {
          this.loading.set(false);
          this.updatedUser.set(record);
          if (!record) return;
          this.form.controls['name'].patchValue(record.name);
          this.form.controls['email'].patchValue(record.email);
          this.form.controls['cpf'].patchValue(record.cpf);
          this.form.controls['role'].patchValue(record.role);
          this.form.updateValueAndValidity();
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        },
      });
  }

  toggleShowPassword() {
    return this.showPassword.update((show) => !show);
  }

  toggleShowConfirmPassword() {
    return this.showConfirmPassword.update((show) => !show);
  }

  save() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      console.log(this.form.errors);
      return;
    }
    const { name, email, cpf, password, role } = this.form.getRawValue();

    const updatedUser = this.updatedUser();
    if (!updatedUser) {
      if (!password) return fireToast('Erro', 'ajuste seu formulário', 'error');
      const addUserDto: AddUserDto = {
        name,
        email,
        cpf,
        password,
        role,
      };
      return this.userService.add(addUserDto).subscribe({
        next: (result) => {
          if (!result.success) {
            return fireGenericError(
              { name },
              this.labels.labelCapitalized,
              this.isEdit()
                ? this.labels.defArticle === 'o'
                  ? 'atualizado'
                  : 'atualizada'
                : this.labels.defArticle === 'o'
                ? 'criado'
                : 'criada'
            );
          }
          fireGenericSuccess(
            { name },
            this.labels.labelCapitalized,
            this.isEdit()
              ? this.labels.defArticle === 'o'
                ? 'atualizado'
                : 'atualizada'
              : this.labels.defArticle === 'o'
              ? 'criado'
              : 'criada'
          );
          this.navigateToList();
        },
        error: (err) => {
          fireGenericError(
            { name },
            this.labels.labelCapitalized,
            this.isEdit()
              ? this.labels.defArticle === 'o'
                ? 'atualizado'
                : 'atualizada'
              : this.labels.defArticle === 'o'
              ? 'criado'
              : 'criada',
            err
          );
        },
      });
    }
    const editUserDto: EditUserDto = {
      name,
      email,
      cpf,
      password,
      role,
    };

    return this.userService.edit(updatedUser.id, editUserDto).subscribe({
      next: (result) => {
        if (!result.success) {
          return fireGenericError(
            { name },
            this.labels.labelCapitalized,
            this.isEdit()
              ? this.labels.defArticle === 'o'
                ? 'atualizado'
                : 'atualizada'
              : this.labels.defArticle === 'o'
              ? 'criado'
              : 'criada'
          );
        }
        fireGenericSuccess(
          { name },
          this.labels.labelCapitalized,
          this.isEdit()
            ? this.labels.defArticle === 'o'
              ? 'atualizado'
              : 'atualizada'
            : this.labels.defArticle === 'o'
            ? 'criado'
            : 'criada'
        );
        this.navigateToList();
      },
      error: (err) => {
        fireGenericError(
          { name },
          this.labels.labelCapitalized,
          this.isEdit()
            ? this.labels.defArticle === 'o'
              ? 'atualizado'
              : 'atualizada'
            : this.labels.defArticle === 'o'
            ? 'criado'
            : 'criada',
          err
        );
      },
    });
  }

  async remove() {
    const updatedSubject = this.updatedUser();
    if (!this.isEdit || !updatedSubject) return;
    const { isConfirmed } = await Swal.fire({
      title: `Tem certeza que deseja excluir ${this.labels.indefArticle} ${this.labels.labelCapitalized} do banco de dados?`,
      icon: 'question',
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
      heightAuto: false,
    });
    if (!isConfirmed) return;
    this.loading.set(true);
    const { id, name } = updatedSubject;
    if (!id) return;
    this.userService.remove(id).subscribe({
      next: (result) => {
        this.loading.set(false);
        if (!result.success) {
          return fireGenericError(
            { name },
            `${this.labels.defArticle.toLocaleUpperCase()} ${
              this.labels.labelCapitalized
            }`,
            this.labels.defArticle === 'o' ? 'deletado' : 'deletada'
          );
        }
        fireGenericSuccess(
          { name },
          `${this.labels.defArticle.toLocaleUpperCase()} ${
            this.labels.labelCapitalized
          }`,
          this.labels.defArticle === 'o' ? 'deletado' : 'deletada'
        );
        this.navigateToList();
      },
      error: (err) => {
        this.loading.set(false);
        fireGenericError(
          { name },
          `${this.labels.defArticle.toLocaleUpperCase()} ${
            this.labels.labelCapitalized
          }`,
          this.labels.defArticle === 'o' ? 'deletado' : 'deletada',
          err
        );
      },
    });
  }

  navigateToList() {
    this.router.navigate(['painel', 'admin', this.labels.uri, 'editar']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
