import { Injectable, inject } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient } from "@angular/common/http";
import { SocialAuthService } from "@abacritt/angularx-social-login";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import { LoginDTO } from "src/app/model/login.dto";

@Injectable({ providedIn: "root" })
export class AuthService {
  private httpClient = inject(HttpClient);
  private socialAuthService = inject(SocialAuthService);

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

  /**
   * Desvincula a conta Google da sessão local: limpa o usuário guardado pela biblioteca de login social
   * (que seria reenviado à tela de login e faria o login automático de novo) e desativa a seleção
   * automática de conta do Google. Sem login Google ativo, a biblioteca rejeita a chamada; nada a fazer.
   */
  desvincularGoogle(): void {
    this.socialAuthService.signOut().catch(() => undefined);
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
