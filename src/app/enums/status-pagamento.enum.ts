/* eslint-disable @typescript-eslint/naming-convention */
/** Status do pagamento pelo app, como devolvido pela API (StatusPagamentoEnum). */
export enum StatusPagamentoEnum {
  PENDENTE = "PENDENTE",
  PAGO = "PAGO",
  EXPIRADO = "EXPIRADO",
  CANCELADO = "CANCELADO",
  ESTORNADO = "ESTORNADO",
}

export const fromStatusPagamentoEnumValue = (status?: string): string => {
  switch (status) {
    case StatusPagamentoEnum.PENDENTE:
      return "PIX pendente";
    case StatusPagamentoEnum.PAGO:
      return "Pago via PIX";
    case StatusPagamentoEnum.EXPIRADO:
      return "PIX expirado";
    case StatusPagamentoEnum.CANCELADO:
      return "PIX cancelado";
    case StatusPagamentoEnum.ESTORNADO:
      return "Estornado";
    default:
      return "";
  }
};
