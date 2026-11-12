/**
 * Define como o valor do parâmetro é editado:
 * - TEXTO: campo simples;
 * - TEXTO_LONGO: área de texto extensa (ex.: base de conhecimento da IA);
 * - IMAGEM: a descrição guarda o caminho da imagem enviada ao servidor.
 */
export type TipoParametro = "TEXTO" | "TEXTO_LONGO" | "IMAGEM";

export const TIPOS_PARAMETRO: { valor: TipoParametro; rotulo: string }[] = [
  { valor: "TEXTO", rotulo: "Texto" },
  { valor: "TEXTO_LONGO", rotulo: "Texto longo" },
  { valor: "IMAGEM", rotulo: "Imagem" },
];

export interface ParametroDTO {
  id?: number;
  nome: string;
  descricao?: string;
  tipo?: TipoParametro;
}

export type ParametroRequestDTO = Pick<ParametroDTO, "nome" | "descricao" | "tipo">;
