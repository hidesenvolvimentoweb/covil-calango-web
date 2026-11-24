import { ComandaDTO } from "./comanda.dto";
import { ProdutoDTO } from "./produtos.dto";

export class PedidoDTO {
  public id?: number;
  public status?: string;
  public dataHora?: Date;
  public observacao?: string;
  public produto?: ProdutoDTO;
  /** Nome do item sem produto, como a inscrição em um evento ("Evento - Torneio Locals"). */
  public descricao?: string;
  public quantidade?: number;
  public comanda?: ComandaDTO;

  constructor(formGroupValue?: any) {
    this.observacao = formGroupValue?.observacao;
    this.quantidade = formGroupValue?.quantidade;
    this.produto = formGroupValue?.produto;
    this.comanda = formGroupValue?.comanda;
  }
}
