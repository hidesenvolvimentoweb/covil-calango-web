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
}
