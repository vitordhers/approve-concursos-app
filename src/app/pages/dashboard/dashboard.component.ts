import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  effect,
  computed,
  OnDestroy,
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
import {
  faBookReader,
  faChartSimple,
  faListCheck,
  faPenToSquare,
  faClipboardQuestion,
  faMagnifyingGlass,
  faPenClip,
  faClockRotateLeft,
  faRightFromBracket,
  faScrewdriverWrench,
  faUsers,
  faPlus,
  faUserPen,
  faUsersLine,
  faBuilding,
  faListOl,
  faListUl,
  faSheetPlastic,
  faFileExcel,
} from '@fortawesome/free-solid-svg-icons';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { NavSection } from './interfaces/nav-section.interface';
import { NavSectionType } from './enums/nav-section-type.enum';
import { NavItemComponent } from '../../components/nav-item/nav-item.component';
import { UserService } from '../../services/user/user.service';
import { Subject, filter, map, takeUntil } from 'rxjs';
import { EntityRelationAdminService } from '../../services/admin/entity-relation.service';
import { EntityRelationService } from '../../services/entity-relations.service';

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

  private sections: NavSection[] = [
    {
      title: 'Admin',
      type: NavSectionType.EXPANSION_PANEL,
      uri: '/painel/admin',
      icon: faScrewdriverWrench,
      isAdmin: true,
      isSubsection: false,
      subsections: [
        {
          title: 'Usuários',
          type: NavSectionType.EXPANSION_PANEL,
          uri: '/painel/admin/usuarios',
          icon: faUsers,
          isSubsection: true,
          subsections: [
            {
              title: 'Criar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/usuarios/criar',
              icon: faPlus,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'usuarios', 'criar']);
              },
            },
            {
              title: 'Editar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/usuarios/editar',
              icon: faUserPen,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'usuarios', 'editar']);
              },
            },
          ],
        },
        {
          title: 'Questões',
          type: NavSectionType.EXPANSION_PANEL,
          uri: '/painel/admin/questoes',
          icon: faClipboardQuestion,
          isSubsection: true,
          subsections: [
            {
              title: 'Criar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/questoes/criar',
              icon: faPlus,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'questoes', 'criar']);
              },
            },
            {
              title: 'Adicionar com Excel',
              type: NavSectionType.LINK,
              uri: '/painel/admin/questoes/adicionar-por-excel',
              icon: faFileExcel,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'questoes', 'adicionar-por-excel']);
              },
            },
            {
              title: 'Editar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/questoes/editar',
              icon: faPenToSquare,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'questoes', 'editar']);
              },
            },
          ],
        },
        {
          title: 'Testes',
          type: NavSectionType.EXPANSION_PANEL,
          uri: '/painel/admin/testes',
          icon: faListUl,
          isSubsection: true,
          subsections: [
            {
              title: 'Simulados',
              type: NavSectionType.EXPANSION_PANEL,
              uri: '/painel/admin/testes/simulados',
              icon: faListCheck,
              isSubsection: true,
              subsections: [
                {
                  title: 'Criar',
                  type: NavSectionType.LINK,
                  uri: '/painel/admin/testes/simulados/criar',
                  icon: faPlus,
                  isSubsection: true,
                  action: () => {
                    this.router.navigate([
                      'painel',
                      'admin',
                      'testes',
                      'simulados',
                      'criar',
                    ]);
                  },
                },
                {
                  title: 'Editar',
                  type: NavSectionType.LINK,
                  uri: '/painel/admin/testes/simulados/editar',
                  icon: faPenToSquare,
                  isSubsection: true,
                  action: () => {
                    this.router.navigate([
                      'painel',
                      'admin',
                      'testes',
                      'simulados',
                      'editar',
                    ]);
                  },
                },
              ],
            },
            {
              title: 'Provas',
              type: NavSectionType.EXPANSION_PANEL,
              uri: '/painel/admin/testes/provas',
              icon: faListOl,
              isSubsection: true,
              subsections: [
                {
                  title: 'Criar',
                  type: NavSectionType.LINK,
                  uri: '/painel/admin/testes/provas/criar',
                  icon: faPlus,
                  isSubsection: true,
                  action: () => {
                    this.router.navigate([
                      'painel',
                      'admin',
                      'testes',
                      'provas',
                      'criar',
                    ]);
                  },
                },
                {
                  title: 'Editar',
                  type: NavSectionType.LINK,
                  uri: '/painel/admin/testes/provas/editar',
                  icon: faPenToSquare,
                  isSubsection: true,
                  action: () => {
                    this.router.navigate([
                      'painel',
                      'admin',
                      'testes',
                      'provas',
                      'editar',
                    ]);
                  },
                },
              ],
            },
          ],
        },
        {
          title: 'Disciplinas',
          type: NavSectionType.EXPANSION_PANEL,
          uri: '/painel/admin/disciplinas',
          icon: faSheetPlastic,
          isSubsection: true,
          subsections: [
            {
              title: 'Criar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/disciplinas/criar',
              icon: faPlus,
              isSubsection: true,
              action: () => {
                this.router.navigate([
                  'painel',
                  'admin',
                  'disciplinas',
                  'criar',
                ]);
              },
            },
            {
              title: 'Editar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/disciplinas/editar',
              icon: faPenToSquare,
              isSubsection: true,
              action: () => {
                this.router.navigate([
                  'painel',
                  'admin',
                  'disciplinas',
                  'editar',
                ]);
              },
            },
          ],
        },
        {
          title: 'Bancas',
          type: NavSectionType.EXPANSION_PANEL,
          uri: '/painel/admin/bancas',
          icon: faUsersLine,
          isSubsection: true,
          subsections: [
            {
              title: 'Criar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/bancas/criar',
              icon: faPlus,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'bancas', 'criar']);
              },
            },
            {
              title: 'Editar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/bancas/editar',
              icon: faPenToSquare,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'bancas', 'editar']);
              },
            },
          ],
        },
        {
          title: 'Órgãos',
          type: NavSectionType.EXPANSION_PANEL,
          uri: '/painel/admin/orgaos',
          icon: faBuilding,
          isSubsection: true,
          subsections: [
            {
              title: 'Criar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/orgaos/criar',
              icon: faPlus,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'orgaos', 'criar']);
              },
            },
            {
              title: 'Editar',
              type: NavSectionType.LINK,
              uri: '/painel/admin/orgaos/editar',
              icon: faPenToSquare,
              isSubsection: true,
              action: () => {
                this.router.navigate(['painel', 'admin', 'orgaos', 'editar']);
              },
            },
          ],
        },
      ],
    },
    {
      title: 'Painel de Estudos',
      type: NavSectionType.EXPANSION_PANEL,
      uri: '/painel/estudos',
      icon: faBookReader,
      isSubsection: false,
      isAdmin: false,
      subsections: [
        {
          title: 'Meu desempenho',
          type: NavSectionType.LINK,
          icon: faChartSimple,
          uri: '/painel/estudos#desempenho',
          action: () => {
            this.router.navigate(['painel', 'estudos'], {
              fragment: 'desempenho',
            });
          },
          isSubsection: true,
        },
        {
          title: 'Simulados',
          type: NavSectionType.LINK,
          icon: faListCheck,
          uri: '/painel/estudos#simulados',
          action: () => {
            this.router.navigate(['painel', 'estudos'], {
              fragment: 'simulados',
            });
          },
          isSubsection: true,
        },
        {
          title: 'Provas',
          type: NavSectionType.LINK,
          icon: faListOl,
          uri: '/painel/estudos#provas',
          action: () => {
            this.router.navigate(['painel', 'estudos'], { fragment: 'provas' });
          },
          isSubsection: true,
        },
      ],
    },
    {
      title: 'Questões',
      type: NavSectionType.EXPANSION_PANEL,
      uri: '/painel/questoes',
      icon: faClipboardQuestion,
      isSubsection: false,
      isAdmin: false,
      subsections: [
        {
          title: 'Resolver',
          type: NavSectionType.LINK,
          icon: faPenToSquare,
          uri: '/painel/questoes#filtro',
          action: () => {
            this.router.navigate(['painel', 'questoes'], {
              fragment: 'filtro',
            });
          },
          isSubsection: true,
        },
        // {
        //   title: 'Enviar',
        //   type: NavSectionType.LINK,
        //   icon: faPenClip,
        //   uri: '/painel/questoes#enviar',
        //   action: () => {
        //     this.router.navigate(['painel', 'questoes'], {
        //       fragment: 'enviar',
        //     });
        //   },
        //   isSubsection: true,
        // },
        {
          title: 'Buscar questões...',
          type: NavSectionType.SEARCH,
          icon: faMagnifyingGlass,
          uri: '/painel/questoes#buscar',
          action: (search?: string) => {
            this.router.navigate(['painel', 'questoes'], {
              fragment: 'buscar',
              queryParams: { busca: search },
            });
          },
          isSubsection: false,
        },
      ],
    },
    {
      title: 'Histórico',
      type: NavSectionType.LINK,
      uri: '/painel/historico',
      icon: faClockRotateLeft,
      isAdmin: false,
      isSubsection: false,
      action: () => {
        this.router.navigate(['painel', 'historico']);
      },
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private location: Location,
    public userService: UserService,
    private entityRelationsAdminService: EntityRelationAdminService,
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

  logout() {
    this.authService.logout();
  }

  toggleSideNav() {
    this.sideNavOpen.update((open) => !open);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
