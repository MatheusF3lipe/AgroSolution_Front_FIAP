import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface CadastroRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginRequest {
  Email: string;
  Password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/Usuarios';
  private readonly TOKEN_KEY = 'agro_token';

  /** Signal reativo que indica se o usuário está autenticado */
  isAuthenticated = signal(this.hasToken());

  constructor(private http: HttpClient) {}

  cadastro(dados: CadastroRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/Cadastro`, dados);
  }

  login(dados: LoginRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/Login`, dados).pipe(
      tap((response: any) => {
        // A API retorna: { success: true, data: null, message: "<JWT>" }
        const token = response?.message;
        if (token && typeof token === 'string') {
          this.setToken(token);
        }
      })
    );
  }

  /** Salva o token JWT no localStorage */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isAuthenticated.set(true);
  }

  /** Retorna o token JWT armazenado */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Remove o token e desloga o usuário */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
  }

  /** Decodifica o payload do JWT sem dependência externa */
  private decodeToken(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /** Retorna o ID do usuário a partir das claims do JWT */
  getUserId(): number | null {
    const payload = this.decodeToken();
    if (!payload) return null;

    // Claim padrão do .NET para nameidentifier
    const id =
      payload[
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ] ?? payload['sub'] ?? payload['nameid'];

    return id ? Number(id) : null;
  }

  /** Verifica se existe um token armazenado */
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
