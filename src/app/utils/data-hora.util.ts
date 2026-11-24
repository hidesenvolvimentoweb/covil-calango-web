const doisDigitos = (valor: number): string => String(valor).padStart(2, "0");

/**
 * Data e hora locais no formato aceito pela API (LocalDateTime, sem fuso): "2026-11-28T19:00:00".
 * O toISOString() não serve: converteria para UTC e o evento das 19h seria gravado às 22h.
 */
export const formatarDataHoraLocal = (data: Date): string =>
  `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}` +
  `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}:00`;

/** Valor para um input datetime-local ("2026-11-28T19:00"). */
export const paraInputDataHora = (data: Date): string => formatarDataHoraLocal(data).slice(0, 16);
