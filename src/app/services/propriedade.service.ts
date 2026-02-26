import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PropriedadeRequest {
  nome: string;
  descricao: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  areaTotal: number;
  ativo: boolean;
}

/** Modelo de uma propriedade retornada pela API */
export interface Propriedade {
  idPropriedade: number;
  idUsuario: number;
  nome: string;
  descricao: string;
  cidade: string;
  uf: string;
  latitude: number;
  longitude: number;
  areaTotal: number;
  ativo: boolean;
}

/** Resposta do endpoint GET /MinhasPropriedades */
export interface MinhasPropriedadesResponse {
  criticas: string[];
  sucesso: boolean;
  propriedades: Propriedade[];
}

export interface CidadeBrasilApi {
  nome: string;
  estado: string;
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class PropriedadeService {
  private readonly apiUrl = '/api/Propriedades';

  constructor(private http: HttpClient) {}

  /** POST /api/Propriedades/CadastrarPropriedades */
  cadastrar(dados: PropriedadeRequest): Observable<MinhasPropriedadesResponse> {
    return this.http.post<MinhasPropriedadesResponse>(
      `${this.apiUrl}/CadastrarPropriedades`,
      dados
    );
  }

  /** PUT /api/Propriedades/AtualizarPropriedades/{id} */
  atualizar(id: number, dados: Propriedade): Observable<MinhasPropriedadesResponse> {
    return this.http.put<MinhasPropriedadesResponse>(
      `${this.apiUrl}/AtualizarPropriedades/${id}`,
      dados
    );
  }

  /** DELETE /api/Propriedades/{id} */
  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /** PATCH /api/Propriedades/AlterarStatus/{idPropriedade} */
  alterarStatus(idPropriedade: number, ativo: boolean): Observable<MinhasPropriedadesResponse> {
    return this.http.patch<MinhasPropriedadesResponse>(
      `${this.apiUrl}/AlterarStatus/${idPropriedade}`,
      ativo
    );
  }

  /** Busca as propriedades do usuário logado */
  minhasPropriedades(): Observable<MinhasPropriedadesResponse> {
    return this.http.get<MinhasPropriedadesResponse>(
      `${this.apiUrl}/MinhasPropriedades`
    );
  }

  /** Busca cidades na BrasilAPI para preencher o select de UF */
  buscarCidades(nomeCidade: string): Observable<CidadeBrasilApi[]> {
    return this.http.get<CidadeBrasilApi[]>(
      `https://brasilapi.com.br/api/cptec/v1/cidade/${encodeURIComponent(nomeCidade)}`
    );
  }
}
