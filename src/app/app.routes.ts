import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { AuthenticatedLayoutComponent } from './layouts/authenticated/authenticated-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CadastrarPropriedadeComponent } from './pages/cadastrar-propriedade/cadastrar-propriedade.component';
import { MinhasPropriedadesComponent } from './pages/minhas-propriedades/minhas-propriedades.component';
import { CadastrarTalhaoComponent } from './pages/cadastrar-talhao/cadastrar-talhao.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  {
    path: 'app',
    component: AuthenticatedLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cadastrar-propriedade', component: CadastrarPropriedadeComponent },
      { path: 'minhas-propriedades', component: MinhasPropriedadesComponent },
      { path: 'cadastrar-talhao', component: CadastrarTalhaoComponent },
    ],
  },
];
