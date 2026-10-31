import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { EMPTY, expand, reduce } from "rxjs";
import { environment } from "src/environments/environment";
import { AbstractGenericClass } from "./generic.service";
import { PerfilDTO } from "src/app/model/perfil.dto";
import { PermissaoDTO, PermissaoRequestDTO } from "src/app/model/permissao.dto";
import { PagedResponseDTO } from "src/app/model/paged-response.dto";

@Injectable({ providedIn: "root" })
export class PermissaoApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/permissao`;

  create(request: PermissaoRequestDTO) {
    return this.httpClient.post<PermissaoDTO>(this.urlController, request);
  }

  update(id: number, request: PermissaoRequestDTO) {
    return this.httpClient.put<PermissaoDTO>(
      `${this.urlController}/${id}`,
      request,
    );
  }

  deleteById(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }

  getPermissoesPage(filter: { name?: string } = {}, page = 0, size = 10) {
    let params = new HttpParams().set("page", page).set("size", size);
    if (filter?.name) {
      params = params.set("name", filter.name);
    }
    return this.httpClient.get<PagedResponseDTO<PermissaoDTO>>(
      this.urlController,
      { params },
    );
  }

  getAllPermissoes() {
    const loadPage = (page: number) => this.getPermissoesPage({}, page, 100);
    return loadPage(0).pipe(
      expand((response) =>
        response.last ? EMPTY : loadPage(response.number + 1),
      ),
      reduce(
        (permissoes, response) => permissoes.concat(response.content),
        [] as PermissaoDTO[],
      ),
    );
  }

  getPermissaoById(id: number) {
    return this.httpClient.get<PermissaoDTO>(`${this.urlController}/${id}`);
  }

  associateWithProfile(permissaoId: number, perfilId: number) {
    return this.httpClient.post<PerfilDTO>(
      `${this.urlController}/${permissaoId}/perfis/${perfilId}`,
      {},
    );
  }

  disassociateFromProfile(permissaoId: number, perfilId: number) {
    return this.httpClient.delete<PerfilDTO>(
      `${this.urlController}/${permissaoId}/perfis/${perfilId}`,
    );
  }
}
