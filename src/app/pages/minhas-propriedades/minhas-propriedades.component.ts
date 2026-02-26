import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Propriedade,
  PropriedadeService,
  CidadeBrasilApi,
} from '../../services/propriedade.service';
import { Talhao, TalhaoRequest, TalhaoService } from '../../services/talhao.service';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  catchError,
} from 'rxjs';

@Component({
  selector: 'app-minhas-propriedades',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './minhas-propriedades.component.html',
  styleUrl: './minhas-propriedades.component.scss',
})
export class MinhasPropriedadesComponent {
  propriedades = signal<Propriedade[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  /** Mapa: idPropriedade → lista de talhões carregados */
  talhoesMap = signal<Record<number, Talhao[]>>({});
  talhoesLoading = signal<Record<number, boolean>>({});
  talhoesError = signal<Record<number, string>>({});
  expandedIds = signal<Set<number>>(new Set());

  /** Estado de edição */
  editingId = signal<number | null>(null);
  editForm!: FormGroup;
  editLoading = signal(false);
  editError = signal('');

  /** Autocomplete de cidades (edição) */
  cidadesEncontradas = signal<CidadeBrasilApi[]>([]);
  buscandoCidades = signal(false);
  private cidadeSearch$ = new Subject<string>();

  /** Estado de exclusão */
  deletingId = signal<number | null>(null);
  confirmDeleteId = signal<number | null>(null);
  deleteError = signal('');

  /** Estado de alteração de status */
  togglingStatusId = signal<number | null>(null);

  /** Estado de edição de talhão */
  editingTalhaoId = signal<number | null>(null);
  talhaoEditForm!: FormGroup;
  talhaoEditLoading = signal(false);
  talhaoEditError = signal('');

  private propService = inject(PropriedadeService);
  private talhaoService = inject(TalhaoService);
  private fb = inject(FormBuilder);

  constructor() {
    this.carregarPropriedades();
    this.initEditForm();
    this.initTalhaoEditForm();

    // Busca de cidades com debounce
    this.cidadeSearch$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((termo) => {
          if (!termo || termo.length < 3) {
            return of([]);
          }
          this.buscandoCidades.set(true);
          return this.propService
            .buscarCidades(termo)
            .pipe(catchError(() => of([])));
        })
      )
      .subscribe((cidades) => {
        this.cidadesEncontradas.set(cidades);
        this.buscandoCidades.set(false);
      });
  }

  // ══════════════════════════════════════
  //  CARREGAR PROPRIEDADES
  // ══════════════════════════════════════

  carregarPropriedades(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.propService.minhasPropriedades().subscribe({
      next: (response) => {
        if (response.sucesso) {
          this.propriedades.set(response.propriedades ?? []);
        } else {
          const criticas =
            response.criticas?.join(', ') || 'Erro ao buscar propriedades.';
          this.errorMessage.set(criticas);
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        if (err.status === 401) {
          this.errorMessage.set('Sessão expirada. Faça login novamente.');
        } else if (err.status === 0) {
          this.errorMessage.set(
            'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
          );
        } else {
          this.errorMessage.set(
            'Ocorreu um erro inesperado ao carregar as propriedades.'
          );
        }
      },
    });
  }

  // ══════════════════════════════════════
  //  EDIÇÃO DE PROPRIEDADE
  // ══════════════════════════════════════

  private initEditForm(): void {
    this.editForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required]],
      cidade: ['', [Validators.required]],
      uf: ['', [Validators.required]],
      latitude: ['', [Validators.required]],
      longitude: ['', [Validators.required]],
      areaTotal: ['', [Validators.required, Validators.min(0.1)]],
      ativo: [true, [Validators.required]],
    });
  }

  /** Abre o formulário de edição para uma propriedade */
  iniciarEdicao(prop: Propriedade): void {
    this.editingId.set(prop.idPropriedade);
    this.editError.set('');
    this.cidadesEncontradas.set([]);

    this.editForm.patchValue({
      nome: prop.nome,
      descricao: prop.descricao,
      cidade: prop.cidade,
      uf: prop.uf,
      latitude: prop.latitude,
      longitude: prop.longitude,
      areaTotal: prop.areaTotal,
      ativo: prop.ativo,
    });
  }

  /** Cancela a edição */
  cancelarEdicao(): void {
    this.editingId.set(null);
    this.editError.set('');
    this.cidadesEncontradas.set([]);
  }

  /** Chamado ao digitar no campo cidade (edição) */
  onEditCidadeInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.cidadeSearch$.next(valor);
  }

  /** Seleciona uma cidade da lista (edição) */
  selecionarCidade(cidade: CidadeBrasilApi): void {
    this.editForm.patchValue({
      cidade: cidade.nome,
      uf: cidade.estado,
    });
    this.cidadesEncontradas.set([]);
  }

  /** Salva a propriedade editada */
  salvarEdicao(prop: Propriedade): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.editLoading.set(true);
    this.editError.set('');

    const form = this.editForm.value;
    const payload: Propriedade = {
      idPropriedade: prop.idPropriedade,
      idUsuario: prop.idUsuario,
      nome: form.nome,
      descricao: form.descricao,
      cidade: form.cidade,
      uf: form.uf,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      areaTotal: Number(form.areaTotal),
      ativo: form.ativo === true || form.ativo === 'true',
    };

    this.propService.atualizar(prop.idPropriedade, payload).subscribe({
      next: (response) => {
        this.editLoading.set(false);
        if (response.sucesso) {
          this.editingId.set(null);
          this.successMessage.set('Propriedade atualizada com sucesso!');
          this.carregarPropriedades();
          setTimeout(() => this.successMessage.set(''), 4000);
        } else {
          const msg =
            response.criticas?.join(', ') ||
            'Erro ao atualizar propriedade.';
          this.editError.set(msg);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.editLoading.set(false);
        if (err.status === 400) {
          const criticas = err.error?.criticas;
          const msg = Array.isArray(criticas)
            ? criticas.join(', ')
            : err.error?.message ||
              'Dados inválidos. Verifique as informações.';
          this.editError.set(msg);
        } else if (err.status === 401) {
          this.editError.set('Sessão expirada. Faça login novamente.');
        } else if (err.status === 0) {
          this.editError.set('Não foi possível conectar ao servidor.');
        } else {
          this.editError.set('Ocorreu um erro inesperado.');
        }
      },
    });
  }

  get ef() {
    return this.editForm.controls;
  }

  // ══════════════════════════════════════
  //  EXCLUSÃO DE PROPRIEDADE
  // ══════════════════════════════════════

  /** Exibe o diálogo de confirmação de exclusão */
  confirmarExclusao(idPropriedade: number): void {
    this.confirmDeleteId.set(idPropriedade);
    this.deleteError.set('');
  }

  /** Cancela a exclusão */
  cancelarExclusao(): void {
    this.confirmDeleteId.set(null);
    this.deleteError.set('');
  }

  /** Executa a exclusão da propriedade */
  excluirPropriedade(idPropriedade: number): void {
    this.deletingId.set(idPropriedade);
    this.deleteError.set('');

    this.propService.excluir(idPropriedade).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
        this.successMessage.set('Propriedade excluída com sucesso!');
        this.carregarPropriedades();
        setTimeout(() => this.successMessage.set(''), 4000);
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        if (err.status === 400) {
          const criticas = err.error?.criticas;
          this.deleteError.set(
            Array.isArray(criticas)
              ? criticas.join(', ')
              : 'Não foi possível excluir a propriedade.'
          );
        } else if (err.status === 401) {
          this.deleteError.set('Sessão expirada. Faça login novamente.');
        } else if (err.status === 0) {
          this.deleteError.set('Não foi possível conectar ao servidor.');
        } else {
          this.deleteError.set('Ocorreu um erro inesperado.');
        }
      },
    });
  }

  // ══════════════════════════════════════
  //  ALTERAÇÃO DE STATUS
  // ══════════════════════════════════════

  /** Toggle do status ativo/inativo */
  toggleStatus(prop: Propriedade): void {
    this.togglingStatusId.set(prop.idPropriedade);

    const novoStatus = !prop.ativo;

    this.propService
      .alterarStatus(prop.idPropriedade, novoStatus)
      .subscribe({
        next: (response) => {
          this.togglingStatusId.set(null);
          if (response.sucesso) {
            // Atualiza localmente sem recarregar tudo
            const lista = this.propriedades().map((p) =>
              p.idPropriedade === prop.idPropriedade
                ? { ...p, ativo: novoStatus }
                : p
            );
            this.propriedades.set(lista);
            this.successMessage.set(
              `Propriedade ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`
            );
            setTimeout(() => this.successMessage.set(''), 3000);
          } else {
            const msg =
              response.criticas?.join(', ') ||
              'Erro ao alterar status.';
            this.errorMessage.set(msg);
            setTimeout(() => this.errorMessage.set(''), 4000);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.togglingStatusId.set(null);
          if (err.status === 401) {
            this.errorMessage.set('Sessão expirada. Faça login novamente.');
          } else {
            this.errorMessage.set('Erro ao alterar status da propriedade.');
          }
          setTimeout(() => this.errorMessage.set(''), 4000);
        },
      });
  }

  // ══════════════════════════════════════
  //  TALHÕES
  // ══════════════════════════════════════

  toggleTalhoes(idPropriedade: number): void {
    const current = new Set(this.expandedIds());

    if (current.has(idPropriedade)) {
      current.delete(idPropriedade);
      this.expandedIds.set(current);
      return;
    }

    current.add(idPropriedade);
    this.expandedIds.set(current);

    const map = this.talhoesMap();
    if (map[idPropriedade] === undefined) {
      this.carregarTalhoes(idPropriedade);
    }
  }

  isExpanded(idPropriedade: number): boolean {
    return this.expandedIds().has(idPropriedade);
  }

  carregarTalhoes(idPropriedade: number): void {
    this.talhoesLoading.set({
      ...this.talhoesLoading(),
      [idPropriedade]: true,
    });
    const errMap = { ...this.talhoesError() };
    delete errMap[idPropriedade];
    this.talhoesError.set(errMap);

    this.talhaoService.listarPorPropriedade(idPropriedade).subscribe({
      next: (response) => {
        this.talhoesLoading.set({
          ...this.talhoesLoading(),
          [idPropriedade]: false,
        });

        if (response.sucesso) {
          this.talhoesMap.set({
            ...this.talhoesMap(),
            [idPropriedade]: response.talhoes ?? [],
          });
        } else {
          const msg =
            response.criticas?.join(', ') || 'Erro ao buscar talhões.';
          this.talhoesError.set({
            ...this.talhoesError(),
            [idPropriedade]: msg,
          });
          this.talhoesMap.set({
            ...this.talhoesMap(),
            [idPropriedade]: [],
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.talhoesLoading.set({
          ...this.talhoesLoading(),
          [idPropriedade]: false,
        });

        let msg = 'Erro ao carregar talhões.';
        if (err.status === 401) {
          msg = 'Sessão expirada. Faça login novamente.';
        } else if (err.status === 0) {
          msg = 'Não foi possível conectar ao servidor.';
        }

        this.talhoesError.set({
          ...this.talhoesError(),
          [idPropriedade]: msg,
        });
        this.talhoesMap.set({
          ...this.talhoesMap(),
          [idPropriedade]: [],
        });
      },
    });
  }

  getTalhoes(idPropriedade: number): Talhao[] {
    return this.talhoesMap()[idPropriedade] ?? [];
  }

  isTalhoesLoading(idPropriedade: number): boolean {
    return this.talhoesLoading()[idPropriedade] ?? false;
  }

  getTalhoesError(idPropriedade: number): string {
    return this.talhoesError()[idPropriedade] ?? '';
  }

  // ══════════════════════════════════════
  //  EDIÇÃO DE TALHÃO
  // ══════════════════════════════════════

  private initTalhaoEditForm(): void {
    this.talhaoEditForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cultura: ['', [Validators.required]],
      areaHa: ['', [Validators.required, Validators.min(0.01)]],
      ativo: [true, [Validators.required]],
    });
  }

  /** Abre o formulário de edição para um talhão */
  iniciarEdicaoTalhao(talhao: Talhao): void {
    this.editingTalhaoId.set(talhao.idTalhao);
    this.talhaoEditError.set('');

    this.talhaoEditForm.patchValue({
      nome: talhao.nome,
      cultura: talhao.cultura,
      areaHa: talhao.areaHa,
      ativo: talhao.ativo,
    });
  }

  /** Cancela a edição do talhão */
  cancelarEdicaoTalhao(): void {
    this.editingTalhaoId.set(null);
    this.talhaoEditError.set('');
  }

  /** Salva o talhão editado */
  salvarEdicaoTalhao(talhao: Talhao): void {
    if (this.talhaoEditForm.invalid) {
      this.talhaoEditForm.markAllAsTouched();
      return;
    }

    this.talhaoEditLoading.set(true);
    this.talhaoEditError.set('');

    const form = this.talhaoEditForm.value;
    const agora = new Date().toISOString();

    const payload: TalhaoRequest = {
      idTalhao: talhao.idTalhao,
      idPropriedade: talhao.idPropriedade,
      nome: form.nome,
      cultura: form.cultura,
      areaHa: Number(form.areaHa),
      ativo: form.ativo === true || form.ativo === 'true',
      dataHoraCriacao: talhao.dataHoraCriacao,
      dataHoraAtualizacao: agora,
    };

    this.talhaoService.atualizar(talhao.idTalhao, payload).subscribe({
      next: (response) => {
        this.talhaoEditLoading.set(false);
        if (response.sucesso) {
          this.editingTalhaoId.set(null);
          this.successMessage.set('Talhão atualizado com sucesso!');
          // Recarrega os talhões da propriedade
          this.carregarTalhoes(talhao.idPropriedade);
          setTimeout(() => this.successMessage.set(''), 4000);
        } else {
          const msg =
            response.criticas?.join(', ') || 'Erro ao atualizar talhão.';
          this.talhaoEditError.set(msg);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.talhaoEditLoading.set(false);
        if (err.status === 400) {
          const criticas = err.error?.criticas;
          const msg = Array.isArray(criticas)
            ? criticas.join(', ')
            : err.error?.message ||
              'Dados inválidos. Verifique as informações.';
          this.talhaoEditError.set(msg);
        } else if (err.status === 401) {
          this.talhaoEditError.set('Sessão expirada. Faça login novamente.');
        } else if (err.status === 0) {
          this.talhaoEditError.set('Não foi possível conectar ao servidor.');
        } else {
          this.talhaoEditError.set('Ocorreu um erro inesperado.');
        }
      },
    });
  }

  get tf() {
    return this.talhaoEditForm.controls;
  }
}
