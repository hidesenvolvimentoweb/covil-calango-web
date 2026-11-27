/* eslint-disable @typescript-eslint/naming-convention */
/** Status do pagamento pelo app, como devolvido pela API (StatusPagamentoEnum). */
export enum StatusPagamentoEnum {
  PENDENTE = "PENDENTE",
  PAGO = "PAGO",
  EXPIRADO = "EXPIRADO",
  CANCELADO = "CANCELADO",
  /** Cartão recusado pelo banco ou pela análise de segurança; a comanda continua aberta. */
  RECUSADO = "RECUSADO",
  ESTORNADO = "ESTORNADO",
}

/** Como o cliente pagou pelo app (MetodoPagamentoEnum da API). */
export enum MetodoPagamentoEnum {
  PIX = "PIX",
  CARTAO_CREDITO = "CARTAO_CREDITO",
  CARTEIRA_MERCADO_PAGO = "CARTEIRA_MERCADO_PAGO",
}

export const fromMetodoPagamentoEnumValue = (metodo?: string): string => {
  switch (metodo) {
    case MetodoPagamentoEnum.PIX:
      return "PIX";
    case MetodoPagamentoEnum.CARTAO_CREDITO:
      return "Cartão";
    case MetodoPagamentoEnum.CARTEIRA_MERCADO_PAGO:
      return "Conta do Mercado Pago";
    default:
      return "";
  }
};

/** Rótulo do status; o meio de pagamento só aparece quando pago (ver StatusPagamentoComponent). */
export const fromStatusPagamentoEnumValue = (status?: string): string => {
  switch (status) {
    case StatusPagamentoEnum.PENDENTE:
      return "Aguardando pagamento";
    case StatusPagamentoEnum.PAGO:
      return "Pago";
    case StatusPagamentoEnum.EXPIRADO:
      return "Expirado";
    case StatusPagamentoEnum.CANCELADO:
      return "Cancelado";
    case StatusPagamentoEnum.RECUSADO:
      return "Cartão recusado";
    case StatusPagamentoEnum.ESTORNADO:
      return "Estornado";
    default:
      return "";
  }
};
