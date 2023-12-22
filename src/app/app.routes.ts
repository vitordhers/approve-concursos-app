import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: 'painel',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (c) => c.DashboardComponent
          ),
        children: [
          {
            path: 'estudos',
            loadComponent: () =>
              import('./pages/study/study.component').then(
                (c) => c.StudyComponent
              ),
          },
          {
            path: 'questoes',
            loadComponent: () =>
              import('./pages/questions/questions.component').then(
                (c) => c.QuestionsComponent
              ),
          },
          {
            path: 'historico',
            loadComponent: () =>
              import('./pages/history/history.component').then(
                (c) => c.HistoryComponent
              ),
          },
          {
            path: 'admin',
            loadComponent: () =>
              import('./pages/admin/admin.component').then(
                (c) => c.AdminComponent
              ),
            children: [
              {
                path: 'usuarios',
                loadComponent: () =>
                  import('./pages/admin/pages/users/users.component').then(
                    (c) => c.UsersComponent
                  ),
                children: [
                  { path: '', redirectTo: 'editar', pathMatch: 'full' },
                  {
                    path: 'editar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/users/pages/list/list.component'
                      ).then((c) => c.ListComponent),
                  },
                  {
                    path: 'editar/:id',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/users/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                  {
                    path: 'criar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/users/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                ],
              },
              {
                path: 'orgaos',
                loadComponent: () =>
                  import(
                    './pages/admin/pages/institutions/institutions.component'
                  ).then((c) => c.InstitutionsComponent),
                children: [
                  { path: '', redirectTo: 'editar', pathMatch: 'full' },
                  {
                    path: 'editar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/institutions/pages/list/list.component'
                      ).then((c) => c.ListComponent),
                  },
                  {
                    path: 'editar/:id',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/institutions/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                  {
                    path: 'criar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/institutions/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                ],
              },
              {
                path: 'bancas',
                loadComponent: () =>
                  import('./pages/admin/pages/boards/boards.component').then(
                    (c) => c.BoardsComponent
                  ),
                children: [
                  { path: '', redirectTo: 'editar', pathMatch: 'full' },
                  {
                    path: 'editar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/boards/pages/list/list.component'
                      ).then((c) => c.ListComponent),
                  },
                  {
                    path: 'editar/:id',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/boards/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                  {
                    path: 'criar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/boards/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                ],
              },
              {
                path: 'questoes',
                loadComponent: () =>
                  import(
                    './pages/admin/pages/questions/questions.component'
                  ).then((c) => c.QuestionsComponent),
                children: [
                  { path: '', redirectTo: 'editar', pathMatch: 'full' },
                  {
                    path: 'editar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/questions/pages/list/list.component'
                      ).then((c) => c.ListComponent),
                  },
                  {
                    path: 'editar/:id',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/questions/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                  {
                    path: 'criar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/questions/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                ],
              },
              {
                path: 'disciplinas',
                loadComponent: () =>
                  import(
                    './pages/admin/pages/subjects/subjects.component'
                  ).then((c) => c.SubjectsComponent),
                children: [
                  { path: '', redirectTo: 'editar', pathMatch: 'full' },
                  {
                    path: 'editar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/subjects/pages/list/list.component'
                      ).then((c) => c.ListComponent),
                  },
                  {
                    path: 'editar/:id',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/subjects/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                  {
                    path: 'criar',
                    loadComponent: () =>
                      import(
                        './pages/admin/pages/subjects/pages/add-edit/add-edit.component'
                      ).then((c) => c.AddEditComponent),
                  },
                ],
              },
              {
                path: 'testes',
                loadComponent: () =>
                  import('./pages/admin/pages/exams/exams.component').then(
                    (c) => c.ExamsComponent
                  ),
                children: [
                  { path: '', redirectTo: 'simulados', pathMatch: 'full' },
                  {
                    path: 'simulados',
                    children: [
                      {
                        path: 'editar',
                        loadComponent: () =>
                          import(
                            './pages/admin/pages/exams/pages/list/list.component'
                          ).then((c) => c.ListComponent),
                      },
                      {
                        path: 'editar/:id',
                        loadComponent: () =>
                          import(
                            './pages/admin/pages/exams/pages/add-edit/add-edit.component'
                          ).then((c) => c.AddEditComponent),
                      },
                      {
                        path: 'criar',
                        loadComponent: () =>
                          import(
                            './pages/admin/pages/exams/pages/add-edit/add-edit.component'
                          ).then((c) => c.AddEditComponent),
                      },
                    ],
                  },
                  {
                    path: 'provas',
                    children: [
                      {
                        path: 'editar',
                        loadComponent: () =>
                          import(
                            './pages/admin/pages/exams/pages/list/list.component'
                          ).then((c) => c.ListComponent),
                      },
                      {
                        path: 'editar/:id',
                        loadComponent: () =>
                          import(
                            './pages/admin/pages/exams/pages/add-edit/add-edit.component'
                          ).then((c) => c.AddEditComponent),
                      },
                      {
                        path: 'criar',
                        loadComponent: () =>
                          import(
                            './pages/admin/pages/exams/pages/add-edit/add-edit.component'
                          ).then((c) => c.AddEditComponent),
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { path: '', redirectTo: 'estudos#desempenho', pathMatch: 'full' },
        ],
        providers: [HttpClientModule],
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((c) => c.HomeComponent),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'home', pathMatch: 'full' },
];
