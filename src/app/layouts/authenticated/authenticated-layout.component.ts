import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss',
})
export class AuthenticatedLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);

  menuItems = [
    {
      label: 'Dashboard',
      route: '/app/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Cadastrar Propriedade',
      route: '/app/cadastrar-propriedade',
      icon: 'add-property',
    },
    {
      label: 'Cadastrar Talhão',
      route: '/app/cadastrar-talhao',
      icon: 'add-talhao',
    },
    {
      label: 'Minhas Propriedades',
      route: '/app/minhas-propriedades',
      icon: 'properties',
    },
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
