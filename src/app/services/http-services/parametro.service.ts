import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { ParametroDTO, ParametroRequestDTO } from "src/app/model/parametro.dto";
import { PagedResponseDTO } from "src/app/model/paged-response.dto";
import { AbstractGenericClass } from "./generic.service";

@Injectable({ providedIn: "root" })
export class ParametroApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/parametros`;
  private readonly adminUrl = `${this.urlController}/admin`;

  create(request: ParametroRequestDTO) {
    return this.httpClient.post<ParametroDTO>(this.urlController, request);
  }

  update(id: number, request: ParametroRequestDTO) {
    return this.httpClient.put<ParametroDTO>(
      `${this.urlController}/${id}`,
      request,
    );
  }

  uploadImagem(id: number, arquivo: File) {
    const formData = new FormData();
    formData.append("file", arquivo);
    return this.httpClient.post<ParametroDTO>(
      `${this.urlController}/${id}/imagem`,
      formData,
    );
  }

  removerImagem(id: number) {
    return this.httpClient.delete<ParametroDTO>(
      `${this.urlController}/${id}/imagem`,
    );
  }

  deleteById(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }

  getParametrosPage(
    filter: { nome?: string; descricao?: string } = {},
    page = 0,
    size = 10,
  ) {
    let params = new HttpParams().set("page", page).set("size", size);
    if (filter.nome) {
      params = params.set("nome", filter.nome);
    }
    if (filter.descricao) {
      params = params.set("descricao", filter.descricao);
    }
    return this.httpClient.get<PagedResponseDTO<ParametroDTO>>(this.adminUrl, {
      params,
    });
  }

  getParametroById(id: number) {
    return this.httpClient.get<ParametroDTO>(`${this.adminUrl}/${id}`);
  }
}
