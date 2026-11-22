import { StatusPagamentoEnum } from "../enums/status-pagamento.enum";

/** Resumo do pagamento da comanda pelo app (a API não envia o QR Code para a equipe). */
export class PagamentoDTO {
  public id?: number;
  public comanda?: string;
  public metodo?: string;
  public status?: StatusPagamentoEnum;
  public valor?: number;
  public dataHoraCriacao?: string;
  public dataHoraExpiracao?: string;
  public dataHoraPagamento?: string;
}
