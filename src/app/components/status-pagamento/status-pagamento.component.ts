import { Component, Input } from "@angular/core";
import { ComandaDTO } from "src/app/model/comanda.dto";
import { StatusPagamentoEnum } from "src/app/enums/status-pagamento.enum";
import {
  FormaPagamentoEnum,
  fromFormaPagamentoEnumValue,
} from "src/app/enums/forma-pagamento.enum";
import {
  fromStatusComandaEnumValue,
  StatusComandaEnum,
} from "src/app/enums/status-comanda.enum";

const CLASSE_PAGO = "bg-light-success text-success";
const CLASSE_AGUARDANDO = "bg-light-warning text-warning";
const CLASSE_NEUTRA = "bg-light-secondary text-secondary";
const CLASSE_ESTORNADO = "bg-light-error text-error";

interface Situacao {
  rotulo: string;
  classe: string;
}

/**
 * Selo com a situação do pagamento da comanda: "Pago (Pix | Débito | Crédito | Dinheiro)" quando fechada,
 * "Aguardando pagamento" com um PIX gerado no app ainda não pago, ou "Não pago".
 */
@Component({
  selector: "app-status-pagamento",
  standalone: true,
  template: `<span class="status-pagamento {{ situacao.classe }}">{{ situacao.rotulo }}</span>`,
})
export class StatusPagamentoComponent {
  @Input()
  public comanda?: ComandaDTO | null;

  get situacao(): Situacao {
    const comanda = this.comanda;
    const statusPagamento = comanda?.ultimoPagamento?.status;
    if (statusPagamento === StatusPagamentoEnum.ESTORNADO) {
      return { rotulo: "Estornado", classe: CLASSE_ESTORNADO };
    }
    // Comandas pagas pelo app antes da forma de pagamento existir não têm forma registrada.
    const forma =
      comanda?.formaPagamento ??
      (statusPagamento === StatusPagamentoEnum.PAGO ? FormaPagamentoEnum.PIX : null);
    if (forma) {
      return { rotulo: `Pago (${fromFormaPagamentoEnumValue(forma)})`, classe: CLASSE_PAGO };
    }
    if (comanda?.status === fromStatusComandaEnumValue(StatusComandaEnum.FECHADA)) {
      // Fechada antes desta versão, sem a forma de pagamento informada.
      return { rotulo: "Pago", classe: CLASSE_PAGO };
    }
    if (statusPagamento === StatusPagamentoEnum.PENDENTE) {
      return { rotulo: "Aguardando pagamento", classe: CLASSE_AGUARDANDO };
    }
    return { rotulo: "Não pago", classe: CLASSE_NEUTRA };
  }
}
