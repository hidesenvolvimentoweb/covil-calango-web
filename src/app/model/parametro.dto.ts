export interface ParametroDTO {
  id?: number;
  nome: string;
  descricao?: string;
}

export type ParametroRequestDTO = Pick<ParametroDTO, "nome" | "descricao">;
