export type StatusPacote = "AGUARDANDO_RETIRADA" | "RETIRADO" | "CANCELADO";

export const ROTULO_STATUS_PACOTE: Record<StatusPacote, string> = {
  AGUARDANDO_RETIRADA: "Aguardando retirada",
  RETIRADO: "Retirado",
  CANCELADO: "Cancelado",
};

export const ROTULO_CATEGORIA_PACOTE: Record<string, string> = {
  CARTA: "Carta",
  DECK: "Deck",
  PLAYMAT: "Playmat",
  ACESSORIO: "Acessório",
  PRODUTO_LACRADO: "Produto lacrado",
  BOARD_GAME: "Board game",
};

/** Pacote deixado na loja pelo app (GET /api/pacote). */
export interface PacoteDTO {
  id: number;
  /** Na listagem, vem vazio enquanto o pacote espera a retirada: quem recebe é que informa o código. */
  codigo?: string | null;
  categoria: string;
  descricao: string;
  destinatario: string;
  status: StatusPacote;
  /** Nome de quem deixou (o da comanda). */
  remetente?: string | null;
  comanda?: string | null;
  valorTaxa?: number | null;
  fotoDeposito?: string | null;
  fotoRetirada?: string | null;
  dataHoraDeposito?: string;
  dataHoraRetirada?: string | null;
  retiradoPor?: string | null;
  dataHoraCancelamento?: string | null;
}
