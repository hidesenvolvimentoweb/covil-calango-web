import { ComandaDTO } from "src/app/model/comanda.dto";
import { StatusPagamentoEnum } from "src/app/enums/status-pagamento.enum";

const FORMATO_REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Mensagem de confirmação do fechamento; avisa que um PIX pendente será cancelado pela API. */
export const mensagemFecharComanda = (comanda: ComandaDTO): string => {
  const pagamento = comanda.ultimoPagamento;
  if (pagamento?.status !== StatusPagamentoEnum.PENDENTE) {
    return "Tem certeza que deseja fechar a comanda?";
  }
  return `O cliente tem um PIX pendente de ${FORMATO_REAL.format(pagamento.valor ?? 0)}. `
    + "Ao fechar a comanda o PIX será cancelado. Confirma o fechamento (pagamento recebido no balcão)?";
};
