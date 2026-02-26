import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  private authService = inject(AuthService);

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService
      .login({ Email: email, Password: password })
      .subscribe({
        next: () => {
          this.router.navigate(['/app/dashboard']);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);

          if (err.status === 401 || err.status === 400) {
            this.errorMessage.set('E-mail ou senha inválidos. Tente novamente.');
          } else if (err.status === 0) {
            this.errorMessage.set(
              'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
            );
          } else {
            this.errorMessage.set(
              'Ocorreu um erro inesperado. Tente novamente mais tarde.'
            );
          }
        },
      });
  }

  get f() {
    return this.loginForm.controls;
  }
}
