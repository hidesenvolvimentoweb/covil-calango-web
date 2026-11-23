import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { AbstractGenericClass } from "./generic.service";
import { HttpParams } from "@angular/common/http";
import { ComandaDTO } from "src/app/model/comanda.dto";
import { FormaPagamentoEnum } from "src/app/enums/forma-pagamento.enum";

@Injectable({ providedIn: "root" })
export class ComandaService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/comanda`;

  getAllByParams(params: HttpParams) {
    return this.httpClient.get<ComandaDTO[]>(`${this.urlController}`, {
      params,
    });
  }

  getByNumero(numero: any, params: HttpParams = new HttpParams()) {
    return this.httpClient.get<ComandaDTO[]>(
      `${this.urlController}/${numero}`,
      { params },
    );
  }

  /** Fecha a comanda no balcão, informando como o cliente pagou. */
  fecharComanda(numero: any, formaPagamento: FormaPagamentoEnum) {
    return this.httpClient.put<void>(`${this.urlController}/fechar/${numero}`, {
      formaPagamento,
    });
  }
}
