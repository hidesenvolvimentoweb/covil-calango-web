import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { EMPTY, expand, reduce } from "rxjs";
import { environment } from "src/environments/environment";
import { AbstractGenericClass } from "./generic.service";
import { PerfilDTO } from "src/app/model/perfil.dto";
import { UsuarioDTO, UsuarioRequestDTO } from "src/app/model/usuario.dto";
import { PagedResponseDTO } from "src/app/model/paged-response.dto";

@Injectable({ providedIn: "root" })
export class UsuarioAdminService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/usuario`;

  create(request: UsuarioRequestDTO) {
    return this.httpClient.post<UsuarioDTO>(this.urlController, request);
  }

  update(id: number, request: UsuarioRequestDTO) {
    return this.httpClient.put<UsuarioDTO>(
      `${this.urlController}/${id}`,
      request,
    );
  }

  deleteById(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }

  getUsuariosPage(
    filter: { nome?: string; email?: string; contato?: string } = {},
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
    if (filter?.contato) {
      params = params.set("contato", filter.contato);
    }
    return this.httpClient.get<PagedResponseDTO<UsuarioDTO>>(
      this.urlController,
      { params },
    );
  }

  getAllUsuarios() {
    const loadPage = (page: number) => this.getUsuariosPage({}, page, 100);
    return loadPage(0).pipe(
      expand((response) =>
        response.last ? EMPTY : loadPage(response.number + 1),
      ),
      reduce(
        (usuarios, response) => usuarios.concat(response.content),
        [] as UsuarioDTO[],
      ),
    );
  }

  getUsuarioById(id: number) {
    return this.httpClient.get<UsuarioDTO>(`${this.urlController}/${id}`);
  }

  associateProfile(usuarioId: number, perfilId: number) {
    return this.httpClient.post<UsuarioDTO>(
      `${this.urlController}/${usuarioId}/perfis/${perfilId}`,
      {},
    );
  }

  disassociateProfile(usuarioId: number, perfilId: number) {
    return this.httpClient.delete<UsuarioDTO>(
      `${this.urlController}/${usuarioId}/perfis/${perfilId}`,
    );
  }
}
