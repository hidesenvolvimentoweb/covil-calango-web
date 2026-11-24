/* eslint-disable @typescript-eslint/naming-convention */
export enum TipoEventoEnum {
  TORNEIO = "TORNEIO",
  BOARD_GAMES = "BOARD_GAMES",
  OUTROS = "OUTROS",
}

export const fromTipoEventoEnumValue = (tipo?: string | null): string => {
  switch (tipo) {
    case TipoEventoEnum.TORNEIO:
      return "Torneio";
    case TipoEventoEnum.BOARD_GAMES:
      return "Board Games";
    case TipoEventoEnum.OUTROS:
      return "Outros";
    default:
      return "";
  }
};

/**
 * Cor do evento no calendário, por tipo. Fundos escuros o bastante para o texto branco
 * (mesma paleta dos selos e gráficos do sistema).
 */
export const corDoTipoEvento = (tipo?: string | null): string => {
  switch (tipo) {
    case TipoEventoEnum.TORNEIO:
      return "#1b7f4b";
    case TipoEventoEnum.BOARD_GAMES:
      return "#2f6fb3";
    default:
      return "#7b4fb5";
  }
};

export const TIPOS_EVENTO: { valor: TipoEventoEnum; rotulo: string }[] =
  Object.values(TipoEventoEnum).map((valor) => ({
    valor,
    rotulo: fromTipoEventoEnumValue(valor),
  }));
