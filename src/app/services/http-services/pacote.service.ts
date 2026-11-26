import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { PacoteDTO, StatusPacote } from "src/app/model/pacote.dto";
import { AbstractGenericClass } from "./generic.service";

/** Atualizações dos pacotes (deixados, retirados e cancelados), para a equipe com web-pacotes. */
export const TOPICO_PACOTES = "/topic/pacotes";

@Injectable({ providedIn: "root" })
export class PacoteApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/pacote`;

  getPacotes(status: StatusPacote[]) {
    let params = new HttpParams();
    status.forEach((valor) => (params = params.append("status", valor)));
    return this.httpClient.get<PacoteDTO[]>(this.urlController, { params });
  }

  /** Pacote do código informado por quem vai receber. */
  getByCodigo(codigo: string) {
    return this.httpClient.get<PacoteDTO>(`${this.urlController}/codigo/${encodeURIComponent(codigo)}`);
  }

  /** Dá baixa na retirada com o código e a foto do item entregue. */
  retirar(id: number, codigo: string, foto: Blob) {
    const dados = new FormData();
    dados.append("codigo", codigo);
    dados.append("foto", foto, "retirada.jpg");
    return this.httpClient.post<PacoteDTO>(`${this.urlController}/${id}/retirada`, dados);
  }

  /** Cancela (ou recusa) um pacote ainda não retirado; a taxa sai da comanda aberta. */
  cancelar(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }
}
