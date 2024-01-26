import { NavSectionType } from '../../pages/dashboard/enums/nav-section-type.enum';
import { NavSection } from '../../pages/dashboard/interfaces/nav-section.interface';
import {
  faBookReader,
  faChartSimple,
  faListCheck,
  faPenToSquare,
  faClipboardQuestion,
  faMagnifyingGlass,
  faClockRotateLeft,
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

export const NAV_SECTIONS: NavSection[] = [
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
            navigationPayload: {
              params: ['painel', 'admin', 'usuarios', 'criar'],
            },
          },
          {
            title: 'Editar',
            type: NavSectionType.LINK,
            uri: '/painel/admin/usuarios/editar',
            icon: faUserPen,
            isSubsection: true,
            navigationPayload: {
              params: ['painel', 'admin', 'usuarios', 'editar'],
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
            navigationPayload: {
              params: ['painel', 'admin', 'questoes', 'criar'],
            },
          },
          {
            title: 'Adicionar com Excel',
            type: NavSectionType.LINK,
            uri: '/painel/admin/questoes/adicionar-por-excel',
            icon: faFileExcel,
            isSubsection: true,
            navigationPayload: {
              params: ['painel', 'admin', 'questoes', 'adicionar-por-excel'],
            },
          },
          {
            title: 'Editar',
            type: NavSectionType.LINK,
            uri: '/painel/admin/questoes/editar',
            icon: faPenToSquare,
            isSubsection: true,
            navigationPayload: {
              params: ['painel', 'admin', 'questoes', 'editar'],
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
                navigationPayload: {
                  params: ['painel', 'admin', 'testes', 'simulados', 'criar'],
                },
              },
              {
                title: 'Editar',
                type: NavSectionType.LINK,
                uri: '/painel/admin/testes/simulados/editar',
                icon: faPenToSquare,
                isSubsection: true,
                navigationPayload: {
                  params: ['painel', 'admin', 'testes', 'simulados', 'editar'],
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
                navigationPayload: {
                  params: ['painel', 'admin', 'testes', 'provas', 'criar'],
                },
              },
              {
                title: 'Editar',
                type: NavSectionType.LINK,
                uri: '/painel/admin/testes/provas/editar',
                icon: faPenToSquare,
                isSubsection: true,
                navigationPayload: {
                  params: ['painel', 'admin', 'testes', 'provas', 'editar'],
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
            navigationPayload: {
              params: ['painel', 'admin', 'disciplinas', 'criar'],
            },
          },
          {
            title: 'Editar',
            type: NavSectionType.LINK,
            uri: '/painel/admin/disciplinas/editar',
            icon: faPenToSquare,
            isSubsection: true,
            navigationPayload: {
              params: ['painel', 'admin', 'disciplinas', 'editar'],
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
            navigationPayload: {
              params: ['painel', 'admin', 'bancas', 'criar'],
            },
          },
          {
            title: 'Editar',
            type: NavSectionType.LINK,
            uri: '/painel/admin/bancas/editar',
            icon: faPenToSquare,
            isSubsection: true,
            navigationPayload: {
              params: ['painel', 'admin', 'bancas', 'editar'],
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
            navigationPayload: {
              params: ['painel', 'admin', 'orgaos', 'criar'],
            },
          },
          {
            title: 'Editar',
            type: NavSectionType.LINK,
            uri: '/painel/admin/orgaos/editar',
            icon: faPenToSquare,
            isSubsection: true,
            navigationPayload: {
              params: ['painel', 'admin', 'orgaos', 'editar'],
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
        navigationPayload: {
          params: ['painel', 'estudos'],
          fragment: 'desempenho',
        },

        isSubsection: true,
      },
      {
        title: 'Simulados',
        type: NavSectionType.LINK,
        icon: faListCheck,
        uri: '/painel/estudos#simulados',
        navigationPayload: {
          params: ['painel', 'estudos'],
          fragment: 'simulados',
        },
        isSubsection: true,
      },
      {
        title: 'Provas',
        type: NavSectionType.LINK,
        icon: faListOl,
        uri: '/painel/estudos#provas',
        navigationPayload: {
          params: ['painel', 'estudos'],
          fragment: 'provas',
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
        navigationPayload: {
          params: ['painel', 'questoes'],
          fragment: 'filtro',
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
        navigationPayload: (search: string) => {
          return {
            params: ['painel', 'questoes'],
            fragment: 'buscar',
            queryParams: { busca: search },
          };
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
    navigationPayload: {
      params: ['painel', 'historico'],
    },
  },
];
