/** Relatório do dia (API: RelatorioDiarioDTO). Valores em reais. */
export interface RelatorioDiarioDTO {
  data: string;
  /** Comandas fechadas no dia: o que entrou no caixa. */
  arrecadado: number;
  /** Pedidos do dia, exceto cancelados (inclui comandas ainda abertas). */
  vendido: number;
  ticketMedio: number;
  comandasAbertas: number;
  comandasFechadas: number;
  comandasAtendidas: number;
  permanenciaMediaMinutos: number | null;
  pedidosRegistrados: number;
  pedidosEntregues: number;
  pedidosCancelados: number;
  itensVendidos: number;
  pedidosPorStatus: ContagemDTO[];
  produtos: ProdutoVendidoDTO[];
  categorias: AgrupamentoDTO[];
  formasPagamento: AgrupamentoDTO[];
  porHora: HoraDTO[];
  tendencia: DiaDTO[];
}

export interface ContagemDTO {
  chave: string;
  rotulo: string;
  quantidade: number;
}

export interface ProdutoVendidoDTO {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  valor: number;
}

export interface AgrupamentoDTO {
  chave: string;
  rotulo: string;
  quantidade: number;
  valor: number;
}

export interface HoraDTO {
  hora: number;
  pedidos: number;
  vendido: number;
  arrecadado: number;
}

export interface DiaDTO {
  data: string;
  arrecadado: number;
  comandasFechadas: number;
}
