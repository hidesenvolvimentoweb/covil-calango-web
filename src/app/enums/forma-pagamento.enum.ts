/* eslint-disable @typescript-eslint/naming-convention */
/** Como a comanda foi paga, como devolvido pela API (FormaPagamentoEnum). */
export enum FormaPagamentoEnum {
  PIX = "PIX",
  DEBITO = "DEBITO",
  CREDITO = "CREDITO",
  DINHEIRO = "DINHEIRO",
}

export const fromFormaPagamentoEnumValue = (forma?: string | null): string => {
  switch (forma) {
    case FormaPagamentoEnum.PIX:
      return "Pix";
    case FormaPagamentoEnum.DEBITO:
      return "Débito";
    case FormaPagamentoEnum.CREDITO:
      return "Crédito";
    case FormaPagamentoEnum.DINHEIRO:
      return "Dinheiro";
    default:
      return "";
  }
};

/** Opções oferecidas ao fechar a comanda no balcão. */
export const FORMAS_PAGAMENTO = Object.values(FormaPagamentoEnum).map((valor) => ({
  valor,
  rotulo: fromFormaPagamentoEnumValue(valor),
}));
