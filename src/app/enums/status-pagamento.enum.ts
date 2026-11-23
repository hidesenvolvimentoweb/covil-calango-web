/* eslint-disable @typescript-eslint/naming-convention */
/** Status do pagamento pelo app, como devolvido pela API (StatusPagamentoEnum). */
export enum StatusPagamentoEnum {
  PENDENTE = "PENDENTE",
  PAGO = "PAGO",
  EXPIRADO = "EXPIRADO",
  CANCELADO = "CANCELADO",
  ESTORNADO = "ESTORNADO",
}

/** Rótulo do status; o meio de pagamento só aparece quando pago (ver StatusPagamentoComponent). */
export const fromStatusPagamentoEnumValue = (status?: string): string => {
  switch (status) {
    case StatusPagamentoEnum.PENDENTE:
      return "Aguardando pagamento";
    case StatusPagamentoEnum.PAGO:
      return "Pago (Pix)";
    case StatusPagamentoEnum.EXPIRADO:
      return "Expirado";
    case StatusPagamentoEnum.CANCELADO:
      return "Cancelado";
    case StatusPagamentoEnum.ESTORNADO:
      return "Estornado";
    default:
      return "";
  }
};
