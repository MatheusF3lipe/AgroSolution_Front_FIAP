import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MinhasPropriedadesResponse } from './propriedade.service';

/** DTO usado tanto para cadastro quanto para atualização de talhão */
export interface TalhaoRequest {
  idTalhao: number;
  idPropriedade: number;
  nome: string;
  cultura: string;
  areaHa: number;
  ativo: boolean;
  dataHoraCriacao: string;
  dataHoraAtualizacao: string;
}

/** Modelo de um talhão retornado pela API */
export interface Talhao {
  idTalhao: number;
  idPropriedade: number;
  nome: string;
  cultura: string;
  areaHa: number;
  ativo: boolean;
  dataHoraCriacao: string;
  dataHoraAtualizacao: string;
}

/** Resposta padrão dos endpoints de talhões */
export interface TalhoesResponse {
  criticas: string[];
  sucesso: boolean;
  talhoes: Talhao[];
}

/** Resumo da propriedade para popular o select */
export interface PropriedadeResumo {
  idPropriedade: number;
  nome: string;
}

@Injectable({
  providedIn: 'root',
})
export class TalhaoService {
  private readonly apiUrl = '/api/Talhoes';
  private readonly propriedadesUrl = '/api/Propriedades';

  constructor(private http: HttpClient) {}

  /** POST /api/Talhoes/CadastrarTalhao */
  cadastrar(dados: TalhaoRequest): Observable<TalhoesResponse> {
    return this.http.post<TalhoesResponse>(
      `${this.apiUrl}/CadastrarTalhao`,
      dados
    );
  }

  /** PUT /api/Talhoes/AtualizarTalhao/{id} */
  atualizar(id: number, dados: TalhaoRequest): Observable<TalhoesResponse> {
    return this.http.put<TalhoesResponse>(
      `${this.apiUrl}/AtualizarTalhao/${id}`,
      dados
    );
  }

  /** GET /api/Talhoes/Propriedade/{idPropriedade} */
  listarPorPropriedade(idPropriedade: number): Observable<TalhoesResponse> {
    return this.http.get<TalhoesResponse>(
      `${this.apiUrl}/Propriedade/${idPropriedade}`
    );
  }

  /** Busca as propriedades do usuário para popular o select */
  listarPropriedades(): Observable<MinhasPropriedadesResponse> {
    return this.http.get<MinhasPropriedadesResponse>(
      `${this.propriedadesUrl}/MinhasPropriedades`
    );
  }
}
