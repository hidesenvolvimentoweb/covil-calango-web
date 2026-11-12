import { Injectable, inject } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import { LoginDTO } from "src/app/model/login.dto";

@Injectable({ providedIn: "root" })
export class AuthService {
  private httpClient = inject(HttpClient);

  private urlController = `${environment.url}/api/auth`;

  login(body: LoginDTO) {
    return this.httpClient.post<UsuarioDTO>(
      `${this.urlController}/login`,
      body,
    );
  }

  /** Pede à API para apagar o cookie de sessão (HttpOnly, inacessível ao JavaScript). */
  logout() {
    return this.httpClient.post<void>(`${this.urlController}/logout`, {});
  }

  esqueciSenha(email: string) {
    return this.httpClient.post<void>(`${this.urlController}/esqueci-senha`, {
      email,
    });
  }

  redefinirSenha(token: string, password: string, senhaTemporaria?: string) {
    return this.httpClient.post<void>(`${this.urlController}/redefinir-senha`, {
      token,
      password,
      senhaTemporaria,
    });
  }
}
