/**
 * Funcionamento da loja para os eventos (GET /api/evento/configuracao). Os valores vêm da tela de parâmetros:
 * LOJA_HORA_ABERTURA, LOJA_DIAS_FECHADOS, EVENTO_DURACAO_PADRAO_HORAS e EVENTO_INTERVALO_HORARIOS_MINUTOS.
 */
export interface EventoConfiguracaoDTO {
  /** Horário sugerido para o início de um evento ("14:00"). */
  horaAbertura: string;
  /** Dias sem expediente, na numeração ISO (1 = segunda ... 7 = domingo). */
  diasFechados: number[];
  duracaoPadraoMinutos: number;
  intervaloHorariosMinutos: number;
}

/** Usada se a configuração não puder ser carregada (mesmos padrões da API). */
export const CONFIGURACAO_EVENTO_PADRAO: EventoConfiguracaoDTO = {
  horaAbertura: "14:00",
  diasFechados: [1],
  duracaoPadraoMinutos: 240,
  intervaloHorariosMinutos: 30,
};

/** Dia da semana do JavaScript/FullCalendar (0 = domingo) para a numeração ISO (7 = domingo). */
const diaIso = (data: Date): number => data.getDay() || 7;

export const lojaFechadaNoDia = (configuracao: EventoConfiguracaoDTO, data: Date): boolean =>
  configuracao.diasFechados.includes(diaIso(data));

/** Dias com expediente no formato do FullCalendar (0 = domingo ... 6 = sábado). */
export const diasAbertosFullCalendar = (configuracao: EventoConfiguracaoDTO): number[] =>
  [0, 1, 2, 3, 4, 5, 6].filter((dia) => !configuracao.diasFechados.includes(dia || 7));

/** Data com o horário de abertura da loja. */
export const comHoraAbertura = (configuracao: EventoConfiguracaoDTO, data: Date): Date => {
  const [horas, minutos] = configuracao.horaAbertura.split(":").map(Number);
  const resultado = new Date(data);
  resultado.setHours(horas || 0, minutos || 0, 0, 0);
  return resultado;
};
