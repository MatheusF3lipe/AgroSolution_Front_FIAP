import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrl: './cadastro.component.scss',
})
export class CadastroComponent {
  cadastroForm: FormGroup;
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  private authService = inject(AuthService);

  constructor(private fb: FormBuilder, private router: Router) {
    this.cadastroForm = this.fb.group(
      {
        nome: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        termos: [false, [Validators.requiredTrue]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  /** Validador customizado para confirmar se as senhas coincidem */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Limpa o erro de mismatch se existia, mantendo outros erros
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { nome, email, password } = this.cadastroForm.value;

    this.authService
      .cadastro({ nome, email, senha: password })
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Conta criada com sucesso! Redirecionando para o login...'
          );
          this.isLoading.set(false);

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);

          if (err.status === 400) {
            // Erro de validação do backend (ex: e-mail já cadastrado)
            const msg =
              err.error?.message ||
              err.error?.title ||
              (typeof err.error === 'string' ? err.error : null) ||
              'Dados inválidos. Verifique as informações e tente novamente.';
            this.errorMessage.set(msg);
          } else if (err.status === 409) {
            this.errorMessage.set('Este e-mail já está cadastrado.');
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
    return this.cadastroForm.controls;
  }
}
