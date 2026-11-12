import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { AbstractGenericClass } from "./generic.service";
import { PagedResponseDTO } from "src/app/model/paged-response.dto";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import {
  SolicitacaoCadastroDTO,
  SolicitacaoCadastroFilterDTO,
  SolicitacaoCadastroRequestDTO,
} from "src/app/model/solicitacao-cadastro.dto";

@Injectable({ providedIn: "root" })
export class SolicitacaoCadastroService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/solicitacao-cadastro`;

  solicitar(request: SolicitacaoCadastroRequestDTO) {
    return this.httpClient.post<SolicitacaoCadastroDTO>(
      this.urlController,
      request,
    );
  }

  getSolicitacoesPage(
    filter: SolicitacaoCadastroFilterDTO = {},
    page = 0,
    size = 10,
  ) {
    let params = new HttpParams().set("page", page).set("size", size);
    if (filter?.nome) {
      params = params.set("nome", filter.nome);
    }
    if (filter?.email) {
      params = params.set("email", filter.email);
    }
    return this.httpClient.get<PagedResponseDTO<SolicitacaoCadastroDTO>>(
      this.urlController,
      { params },
    );
  }

  finalizar(id: number, perfilId: number) {
    return this.httpClient.post<UsuarioDTO>(
      `${this.urlController}/${id}/finalizar`,
      { perfilId },
    );
  }

  recusar(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }
}
