import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { PagedResponseDTO } from "src/app/model/paged-response.dto";
import { ProdutoDTO, ProdutoRequestDTO } from "src/app/model/produtos.dto";
import { AbstractGenericClass } from "./generic.service";

@Injectable({ providedIn: "root" })
export class ProdutoApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/produto`;
  private readonly adminUrl = `${this.urlController}/admin`;

  create(request: ProdutoRequestDTO) {
    return this.httpClient.post<ProdutoDTO>(this.urlController, request);
  }

  update(id: number, request: ProdutoRequestDTO) {
    return this.httpClient.put<ProdutoDTO>(
      `${this.urlController}/${id}`,
      request,
    );
  }

  deleteById(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }

  getProdutosPage(
    filter: { nome?: string; categoria?: string } = {},
    page = 0,
    size = 10,
  ) {
    let params = new HttpParams().set("page", page).set("size", size);
    if (filter.nome) {
      params = params.set("nome", filter.nome);
    }
    if (filter.categoria) {
      params = params.set("categoria", filter.categoria);
    }
    return this.httpClient.get<PagedResponseDTO<ProdutoDTO>>(this.adminUrl, {
      params,
    });
  }

  getProdutoById(id: number) {
    return this.httpClient.get<ProdutoDTO>(`${this.adminUrl}/${id}`);
  }
}
