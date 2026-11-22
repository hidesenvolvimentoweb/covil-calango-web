import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { PagamentoDTO } from "src/app/model/pagamento.dto";

/** Tópico do websocket com as atualizações de todos os pagamentos (equipe). */
export const TOPICO_PAGAMENTOS = "/topic/pagamentos";

@Injectable({ providedIn: "root" })
export class PagamentoService {
  private httpClient = inject(HttpClient);
  private urlController = `${environment.url}/api/pagamento`;

  /** Cancela o PIX pendente da comanda. Se ele já tinha sido pago, a API devolve o pagamento aprovado. */
  cancelarPix(numeroComanda: number | string) {
    return this.httpClient.delete<PagamentoDTO>(
      `${this.urlController}/comanda/${numeroComanda}/pix`,
    );
  }
}
