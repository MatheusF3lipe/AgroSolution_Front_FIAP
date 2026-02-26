import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TalhaoService, TalhaoRequest, TalhoesResponse } from '../../services/talhao.service';

@Component({
  selector: 'app-cadastrar-talhao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastrar-talhao.component.html',
  styleUrl: './cadastrar-talhao.component.scss',
})
export class CadastrarTalhaoComponent implements OnInit {
  talhaoForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  /** Lista de propriedades do usuário para o select (somente ativas) */
  propriedades = signal<{ idPropriedade: number; nome: string; ativo: boolean }[]>([]);
  carregandoPropriedades = signal(false);

  private fb = inject(FormBuilder);
  private talhaoService = inject(TalhaoService);

  constructor() {
    this.talhaoForm = this.fb.group({
      idPropriedade: ['', [Validators.required]],
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cultura: ['', [Validators.required]],
      areaHa: ['', [Validators.required, Validators.min(0.01)]],
      ativo: [true, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.carregarPropriedades();
  }

  /** Carrega as propriedades do usuário para preencher o select */
  carregarPropriedades(): void {
    this.carregandoPropriedades.set(true);
    this.talhaoService.listarPropriedades().subscribe({
      next: (data: any) => {
        // A API retorna: { criticas, sucesso, propriedades: [...] }
        const lista = Array.isArray(data) ? data : data?.propriedades ?? [];
        // Filtra somente propriedades ativas
        const ativas = lista.filter((p: any) => p.ativo === true);
        this.propriedades.set(ativas);
        this.carregandoPropriedades.set(false);
      },
      error: () => {
        this.carregandoPropriedades.set(false);
        this.propriedades.set([]);
      },
    });
  }

  onSubmit(): void {
    if (this.talhaoForm.invalid) {
      this.talhaoForm.markAllAsTouched();
      this.errorMessage.set('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const form = this.talhaoForm.value;
    const agora = new Date().toISOString();

    const payload: TalhaoRequest = {
      idTalhao: 0,
      idPropriedade: Number(form.idPropriedade),
      nome: form.nome,
      cultura: form.cultura,
      areaHa: Number(form.areaHa),
      ativo: form.ativo === true || form.ativo === 'true',
      dataHoraCriacao: agora,
      dataHoraAtualizacao: agora,
    };

    this.talhaoService.cadastrar(payload).subscribe({
      next: (response: TalhoesResponse) => {
        this.isLoading.set(false);
        if (response.sucesso) {
          this.successMessage.set('Talhão cadastrado com sucesso!');
          this.talhaoForm.reset({ ativo: true, idPropriedade: '' });
        } else {
          const msg = response.criticas?.join(', ') || 'Erro ao cadastrar talhão.';
          this.errorMessage.set(msg);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);

        if (err.status === 400) {
          const criticas = err.error?.criticas;
          const msg = Array.isArray(criticas)
            ? criticas.join(', ')
            : err.error?.message ||
              err.error?.title ||
              (typeof err.error === 'string' ? err.error : null) ||
              'Dados inválidos. Verifique as informações e tente novamente.';
          this.errorMessage.set(msg);
        } else if (err.status === 401) {
          this.errorMessage.set('Sessão expirada. Faça login novamente.');
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
    return this.talhaoForm.controls;
  }
}
