export class ProdutoDTO {
  public id?: number;
  public nome?: string;
  public categoria?: string;
  public imagem?: string;
  public valor?: number;
  public ingredientes?: string;
  public prazo?: number;
}

export interface ProdutoRequestDTO {
  nome: string;
  categoria?: string;
  imagem?: string;
  valor: number;
  ingredientes?: string;
  prazo?: number | null;
}
