import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  CidadeBrasilApi,
  PropriedadeRequest,
  PropriedadeService,
} from '../../services/propriedade.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

@Component({
  selector: 'app-cadastrar-propriedade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastrar-propriedade.component.html',
  styleUrl: './cadastrar-propriedade.component.scss',
})
export class CadastrarPropriedadeComponent {
  propriedadeForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  /** Cidades retornadas pela BrasilAPI */
  cidadesEncontradas = signal<CidadeBrasilApi[]>([]);
  buscandoCidades = signal(false);

  private cidadeSearch$ = new Subject<string>();
  private propService = inject(PropriedadeService);

  constructor(private fb: FormBuilder) {
    this.propriedadeForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: ['', [Validators.required]],
      cidade: ['', [Validators.required]],
      uf: ['', [Validators.required]],
      latitude: ['', [Validators.required]],
      longitude: ['', [Validators.required]],
      areaTotal: ['', [Validators.required, Validators.min(0.1)]],
      ativo: [true, [Validators.required]],
      talhoes: this.fb.array([]),
    });

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
          return this.propService.buscarCidades(termo).pipe(
            catchError(() => of([]))
          );
        })
      )
      .subscribe((cidades) => {
        this.cidadesEncontradas.set(cidades);
        this.buscandoCidades.set(false);
      });
  }

  get talhoes(): FormArray {
    return this.propriedadeForm.get('talhoes') as FormArray;
  }

  adicionarTalhao(): void {
    const talhao = this.fb.group({
      nome: ['', [Validators.required]],
      area: ['', [Validators.required, Validators.min(0.01)]],
      cultura: ['', [Validators.required]],
    });
    this.talhoes.push(talhao);
  }

  removerTalhao(index: number): void {
    this.talhoes.removeAt(index);
  }

  /** Chamado ao digitar no campo cidade */
  onCidadeInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.cidadeSearch$.next(valor);
  }

  /** Seleciona uma cidade da lista */
  selecionarCidade(cidade: CidadeBrasilApi): void {
    this.propriedadeForm.patchValue({
      cidade: cidade.nome,
      uf: cidade.estado,
    });
    this.cidadesEncontradas.set([]);
  }

  onSubmit(): void {
    if (this.propriedadeForm.invalid) {
      this.propriedadeForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const form = this.propriedadeForm.value;

    const payload: PropriedadeRequest = {
      nome: form.nome,
      descricao: form.descricao,
      cidade: form.cidade,
      uf: form.uf,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      areaTotal: Number(form.areaTotal),
      ativo: form.ativo === true || form.ativo === 'true',
    };

    this.propService.cadastrar(payload).subscribe({
      next: () => {
        this.successMessage.set('Propriedade cadastrada com sucesso!');
        this.isLoading.set(false);
        this.propriedadeForm.reset({ ativo: true });
        this.talhoes.clear();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);

        if (err.status === 400) {
          const msg =
            err.error?.message ||
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
    return this.propriedadeForm.controls;
  }
}
