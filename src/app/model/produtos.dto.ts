import { CategoriaProdutoEnum } from "../enums/categoria-produto.enum";

export class ProdutoDTO {
  public id?: number;
  public nome?: string;
  public categoria?: CategoriaProdutoEnum;
  public imagem?: string;
  public valor?: number;
  public ingredientes?: string;
  public prazo?: number;
  /** Preparado na cozinha: só pode ser pedido com a cozinha aberta. */
  public usaCozinha?: boolean;
  /** Unidades disponíveis para venda; nulo quando o produto não tem controle de estoque. */
  public estoque?: number | null;
}

export interface ProdutoRequestDTO {
  nome: string;
  categoria: CategoriaProdutoEnum;
  imagem?: string;
  valor: number;
  ingredientes?: string;
  prazo?: number | null;
  usaCozinha?: boolean;
  estoque?: number | null;
  /**
   * Na alteração, a API só grava o estoque quando este campo é verdadeiro: salvar o produto por outro motivo não
   * desfaz as vendas feitas desde que o formulário foi aberto.
   */
  alterarEstoque?: boolean;
}
