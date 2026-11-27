import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { AbstractGenericClass } from "./generic.service";

/** Avisos de abertura e fechamento da cozinha (mesma mensagem de GET /api/cozinha). */
export const TOPICO_COZINHA = "/topic/cozinha";

export interface CozinhaDTO {
  aberta: boolean;
}

/** Com a cozinha fechada, os produtos "Preparado na cozinha" não podem ser pedidos. */
@Injectable({ providedIn: "root" })
export class CozinhaApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/cozinha`;

  getSituacao() {
    return this.httpClient.get<CozinhaDTO>(this.urlController);
  }

  definirAberta(aberta: boolean) {
    return this.httpClient.put<CozinhaDTO>(this.urlController, { aberta });
  }
}
