import { UsuarioDTO } from "./usuario.dto";
import { PagamentoDTO } from "./pagamento.dto";
import { FormaPagamentoEnum } from "../enums/forma-pagamento.enum";

export class ComandaDTO {
  public id?: number;
  public numero?: number | string;
  public usuario?: UsuarioDTO;
  public nomeCliente?: string;
  public dataHoraEntrada?: Date;
  public dataHoraSaida?: Date;
  public status?: string;
  public pedidos?: any[];
  public valorTotal?: number;
  /** Última tentativa de pagamento pelo app; ausente se o cliente ainda não tentou pagar. */
  public ultimoPagamento?: PagamentoDTO;
  /** Como a comanda fechada foi paga; ausente enquanto aberta. */
  public formaPagamento?: FormaPagamentoEnum | null;
}
