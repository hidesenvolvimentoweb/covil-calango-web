import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { environment } from "src/environments/environment";
import { RelatorioDiarioDTO } from "src/app/model/relatorio.dto";

@Injectable({ providedIn: "root" })
export class RelatorioService {
  private httpClient = inject(HttpClient);
  private readonly urlController = `${environment.url}/api/relatorio`;

  /** @param data dia no formato AAAA-MM-DD (fuso do estabelecimento); sem data, a API usa hoje. */
  getDiario(data?: string) {
    const params = data ? new HttpParams().set("data", data) : undefined;
    return this.httpClient.get<RelatorioDiarioDTO>(`${this.urlController}/diario`, { params });
  }
}
