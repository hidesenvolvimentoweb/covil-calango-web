import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { EMPTY, expand, reduce } from "rxjs";
import { environment } from "src/environments/environment";
import { AbstractGenericClass } from "./generic.service";
import { PerfilDTO, PerfilRequestDTO } from "src/app/model/perfil.dto";
import { PagedResponseDTO } from "src/app/model/paged-response.dto";

@Injectable({ providedIn: "root" })
export class PerfilApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/perfil`;

  create(request: PerfilRequestDTO) {
    return this.httpClient.post<PerfilDTO>(this.urlController, request);
  }

  update(id: number, request: PerfilRequestDTO) {
    return this.httpClient.put<PerfilDTO>(
      `${this.urlController}/${id}`,
      request,
    );
  }

  deleteById(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }

  getPerfisPage(filter: { name?: string } = {}, page = 0, size = 10) {
    let params = new HttpParams().set("page", page).set("size", size);
    if (filter?.name) {
      params = params.set("name", filter.name);
    }
    return this.httpClient.get<PagedResponseDTO<PerfilDTO>>(
      this.urlController,
      { params },
    );
  }

  getAllPerfis() {
    const loadPage = (page: number) => this.getPerfisPage({}, page, 100);
    return loadPage(0).pipe(
      expand((response) =>
        response.last ? EMPTY : loadPage(response.number + 1),
      ),
      reduce(
        (perfis, response) => perfis.concat(response.content),
        [] as PerfilDTO[],
      ),
    );
  }

  getPerfilById(id: number) {
    return this.httpClient.get<PerfilDTO>(`${this.urlController}/${id}`);
  }
}
