import { MetodoPagamentoEnum, StatusPagamentoEnum } from "../enums/status-pagamento.enum";

/** Resumo do pagamento da comanda pelo app (a API não envia o QR Code nem o link de pagamento para a equipe). */
export class PagamentoDTO {
  public id?: number;
  public comanda?: string;
  public metodo?: MetodoPagamentoEnum;
  public status?: StatusPagamentoEnum;
  public valor?: number;
  /** Bandeira (ex.: visa) e últimos 4 dígitos do cartão, quando pago com cartão. */
  public cartaoBandeira?: string;
  public cartaoFinal?: string;
  /** CREDITO ou DEBITO, conforme o cartão usado. */
  public cartaoTipo?: "CREDITO" | "DEBITO";
  /** Motivo da recusa do cartão. */
  public mensagemRecusa?: string;
  public dataHoraCriacao?: string;
  public dataHoraExpiracao?: string;
  public dataHoraPagamento?: string;
}
