import { ComandaDTO } from "src/app/model/comanda.dto";
import { StatusPagamentoEnum } from "src/app/enums/status-pagamento.enum";
import { FORMAS_PAGAMENTO, FormaPagamentoEnum } from "src/app/enums/forma-pagamento.enum";
import { AlertService } from "src/app/services/alert.service";

const FORMATO_REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const OPCOES_FORMA_PAGAMENTO: Record<string, string> = Object.fromEntries(
  FORMAS_PAGAMENTO.map((opcao) => [opcao.valor, opcao.rotulo]),
);

/** Mensagem do fechamento: valor a receber e, se houver, o aviso de que o pagamento pendente no app será cancelado. */
export const mensagemFecharComanda = (comanda: ComandaDTO): string => {
  const valor = `Valor da comanda: ${FORMATO_REAL.format(comanda.valorTotal ?? 0)}.`;
  if (comanda.ultimoPagamento?.status !== StatusPagamentoEnum.PENDENTE) {
    return `${valor} Como o cliente pagou?`;
  }
  return `${valor} O pagamento que o cliente gerou no app será cancelado. Como ele pagou no balcão?`;
};

/** Pergunta como o cliente pagou e só então chama o fechamento com a forma escolhida. */
export const escolherFormaPagamento = (
  alertService: AlertService,
  comanda: ComandaDTO,
  fechar: (forma: FormaPagamentoEnum) => void,
): void =>
  alertService.showEscolha(
    `Fechar comanda ${comanda.numero}`,
    mensagemFecharComanda(comanda),
    OPCOES_FORMA_PAGAMENTO,
    (valor) => fechar(valor as FormaPagamentoEnum),
  );
