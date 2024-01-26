import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  computed,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../services/auth/auth.service';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import {
  NavSection,
  NavigationPayload,
} from './interfaces/nav-section.interface';
import { NavItemComponent } from '../../components/nav-item/nav-item.component';
import { UserService } from '../../services/user/user.service';
import { Subject, filter, map, takeUntil } from 'rxjs';
import { EntityRelationService } from '../../services/entity-relations.service';
import { NAV_SECTIONS } from '../../shared/config/nav-sections.const';
import { UserRole } from '../../shared/enums/user-role.enum';
import { ModalService } from '../../services/modal.service';
import { PendingPaymentModalComponent } from '../../components/modals/pending-payment/pending-payment.component';
import { MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatListModule,
    MatSidenavModule,
    MatButtonModule,
    MatExpansionModule,
    FontAwesomeModule,
    MatFormFieldModule,
    MatInputModule,
    HeaderComponent,
    NavItemComponent,
    PendingPaymentModalComponent,
  ],
  providers: [Location],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  faRightFromBracket = faRightFromBracket;
  currentUrl = signal('/painel/estudos#desempenho');

  private destroy$ = new Subject<void>();

  sideNavOpen = signal(true);

  displayedSections = computed(() => {
    const isAdmin = this.userService.isAdmin();
    return this.sections.filter((s) => isAdmin || !s.isAdmin);
  });

  private sections: NavSection[] = NAV_SECTIONS;

  userName = computed(() => {
    const user = this.userService.user();
    if (!user) return;
    return user.name;
  });

  private userRole = computed(
    () => this.userService.user()?.role || UserRole.NON_VALIDATED_USER
  );

  userRoleEffect = effect(() => {
    const userRole = this.userRole();

    if (userRole === UserRole.NON_VALIDATED_USER) {
      this.router.navigate(['home']);
      return;
    }

    if (userRole === UserRole.VALIDATED_USER) {
      const dialogConfig: MatDialogConfig<undefined> = { disableClose: true };
      this.modalService.openModal<
        PendingPaymentModalComponent,
        undefined,
        MatDialogConfig<undefined>
      >(PendingPaymentModalComponent, undefined, dialogConfig);
    }
  });

  loggedIn = computed(() => this.userService.isLoggedIn());

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location,
    private userService: UserService,
    private modalService: ModalService,
    private entityRelationsService: EntityRelationService
  ) {}

  ngOnInit(): void {
    this.currentUrl.set(this.location.path(true));

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((event) => event instanceof NavigationEnd),
        map((e) => e as NavigationEnd)
      )
      .subscribe(({ url }: NavigationEnd) => this.currentUrl.set(url));
  }

  handleNavigation(payload: NavigationPayload) {
    this.router.navigate(payload.params || [], {
      fragment: payload.fragment,
      queryParams: payload.queryParams,
    });
  }

  logout() {
    this.authService.logout();
  }

  toggleSideNav() {
    this.sideNavOpen.update((open) => !open);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }
}
