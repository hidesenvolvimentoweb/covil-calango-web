import { Component, OnDestroy, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TablerIconsModule } from "angular-tabler-icons";
import { ChartConfiguration, ChartType } from "chart.js";
import { StompSubscription } from "@stomp/stompjs";
import { EMPTY, Subject, Subscription, catchError, debounceTime, switchMap } from "rxjs";
import { MaterialModule } from "src/app/material.module";
import { GraficoComponent } from "src/app/components/grafico/grafico.component";
import { RelatorioDiarioDTO } from "src/app/model/relatorio.dto";
import { RelatorioService } from "src/app/services/http-services/relatorio.service";
import { WebsocketService } from "src/app/services/http-services/websocket.service";
import { AlertService } from "src/app/services/alert.service";
import {
  RelatorioPdfService,
  SecaoPdf,
  formatarData,
} from "src/app/services/relatorio-pdf.service";

/** Paleta dos gráficos (contraste suficiente sobre o fundo branco). */
const CORES = ["#1b7f4b", "#2f6fb3", "#a15c00", "#7b4fb5", "#00838f", "#b3261e", "#5f6b73", "#c2185b"];
const COR_PRINCIPAL = CORES[0];
const COR_SECUNDARIA = CORES[1];
/** Cores fixas por forma de pagamento e por status do pedido, iguais em todos os dias. */
const COR_FORMA: Record<string, string> = {
  PIX: "#00838f",
  DEBITO: "#2f6fb3",
  CREDITO: "#7b4fb5",
  DINHEIRO: "#1b7f4b",
  NAO_INFORMADA: "#5f6b73",
};
const COR_STATUS: Record<string, string> = {
  SOLICITADO: "#a15c00",
  EM_ANDAMENTO: "#2f6fb3",
  PRONTO: "#7b4fb5",
  FINALIZADO: "#1b7f4b",
  CANCELADO: "#b3261e",
};
const MAXIMO_PRODUTOS_NO_GRAFICO = 10;

/** Seções do relatório (uma por gráfico), na ordem da tela e do PDF completo. */
export type SecaoRelatorio = "produtos" | "formas" | "horas" | "status" | "categorias" | "tendencia";
const SECOES: SecaoRelatorio[] = ["produtos", "formas", "horas", "status", "categorias", "tendencia"];
const TITULOS_SECAO: Record<SecaoRelatorio, string> = {
  produtos: "Produtos que saíram",
  formas: "Arrecadado por forma de pagamento",
  horas: "Movimento por hora",
  status: "Pedidos por status",
  categorias: "Vendas por categoria",
  tendencia: "Arrecadado nos últimos 7 dias",
};
const SUBTITULOS_SECAO: Record<SecaoRelatorio, string> = {
  produtos: "Unidades vendidas no dia (pedidos não cancelados)",
  formas: "Comandas fechadas no dia",
  horas: "Pedidos feitos e valor arrecadado em cada hora",
  status: "Situação atual dos pedidos do dia",
  categorias: "Valor vendido em cada categoria",
  tendencia: "Até o dia selecionado",
};
/** Eventos próximos (ex.: vários pedidos seguidos) viram uma única consulta. */
const ATRASO_ATUALIZACAO_MS = 1000;
const TOPICOS_ATUALIZACAO = ["/topic/comandas", "/topic/pedidos", "/topic/pagamentos"];

/** As opções específicas de cada tipo (ex.: cutout da rosca) só são aceitas na configuração tipada. */
const comoGrafico = <T extends ChartType>(config: ChartConfiguration<T>): ChartConfiguration =>
  config as unknown as ChartConfiguration;

const REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatarReal = (valor: number | string) => REAL.format(Number(valor) || 0);

/** Dia local no formato AAAA-MM-DD (o mesmo do input type="date"). */
const hojeIso = (): string => {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
};

/**
 * Relatórios do dia no Dashboard: indicadores, produtos que saíram, arrecadação por forma de pagamento, movimento
 * por hora, pedidos por status, vendas por categoria e a arrecadação dos últimos 7 dias. Os números vêm prontos da
 * API (/api/relatorio/diario). Vendo o dia de hoje, a tela se atualiza com os eventos de comandas, pedidos e
 * pagamentos.
 */
@Component({
  selector: "app-relatorio-diario",
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, TablerIconsModule, GraficoComponent],
  templateUrl: "./relatorio-diario.component.html",
})
export class RelatorioDiarioComponent implements OnInit, OnDestroy {
  private relatorioService = inject(RelatorioService);
  private websocketService = inject(WebsocketService);
  private alertService = inject(AlertService);
  private relatorioPdfService = inject(RelatorioPdfService);

  public readonly hoje = hojeIso();
  public data = this.hoje;
  public carregando = false;
  public relatorio?: RelatorioDiarioDTO;

  public graficoProdutos?: ChartConfiguration;
  public graficoFormas?: ChartConfiguration;
  public graficoHoras?: ChartConfiguration;
  public graficoStatus?: ChartConfiguration;
  public graficoCategorias?: ChartConfiguration;
  public graficoTendencia?: ChartConfiguration;

  /** Relatório sendo exportado em PDF (desabilita os botões e mostra "Gerando..."). */
  public gerandoPdf: SecaoRelatorio | "completo" | null = null;

  @ViewChild("gProdutos") private gProdutos?: GraficoComponent;
  @ViewChild("gFormas") private gFormas?: GraficoComponent;
  @ViewChild("gHoras") private gHoras?: GraficoComponent;
  @ViewChild("gStatus") private gStatus?: GraficoComponent;
  @ViewChild("gCategorias") private gCategorias?: GraficoComponent;
  @ViewChild("gTendencia") private gTendencia?: GraficoComponent;

  private atualizacoes$ = new Subject<void>();
  private inscricaoAtualizacoes?: Subscription;
  private inscricoesTopicos: StompSubscription[] = [];

  get vendoHoje(): boolean {
    return this.data === this.hoje;
  }

  get temFechamentos(): boolean {
    return (this.relatorio?.comandasFechadas ?? 0) > 0;
  }

  get temPedidos(): boolean {
    return (this.relatorio?.pedidosRegistrados ?? 0) > 0;
  }

  get temVendas(): boolean {
    return (this.relatorio?.produtos.length ?? 0) > 0;
  }

  ngOnInit(): void {
    this.inscricaoAtualizacoes = this.atualizacoes$
      .pipe(
        debounceTime(ATRASO_ATUALIZACAO_MS),
        switchMap(() =>
          this.relatorioService.getDiario(this.data).pipe(catchError(() => EMPTY)),
        ),
      )
      .subscribe((relatorio) => this.exibir(relatorio));
    this.carregar();
    this.escutarAtualizacoes();
  }

  ngOnDestroy(): void {
    this.inscricaoAtualizacoes?.unsubscribe();
    this.inscricoesTopicos.forEach((inscricao) => inscricao.unsubscribe());
  }

  carregar(): void {
    if (!this.data) {
      return;
    }
    this.carregando = true;
    this.relatorioService.getDiario(this.data).subscribe({
      next: (relatorio) => {
        this.exibir(relatorio);
        this.carregando = false;
      },
      error: (error) => {
        this.carregando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível gerar o relatório.",
        );
      },
    });
  }

  irParaHoje(): void {
    this.data = this.hoje;
    this.carregar();
  }

  /** Avança ou volta um dia (sem passar de hoje). */
  mudarDia(dias: number): void {
    const [ano, mes, dia] = this.data.split("-").map(Number);
    const novaData = new Date(ano, mes - 1, dia + dias);
    const iso = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, "0")}-${String(
      novaData.getDate(),
    ).padStart(2, "0")}`;
    if (iso <= this.hoje) {
      this.data = iso;
      this.carregar();
    }
  }

  formatarReal(valor: number): string {
    return formatarReal(valor);
  }

  /** Ex.: 105 → "1h 45min". */
  formatarDuracao(minutos: number | null): string {
    if (minutos == null) {
      return "—";
    }
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas ? `${horas}h ${String(resto).padStart(2, "0")}min` : `${resto}min`;
  }

  /**
   * Exporta em PDF o relatório completo (indicadores e todas as seções) ou só a seção de um gráfico. Cada seção leva
   * o gráfico como aparece na tela e uma tabela com os números.
   */
  async exportarPdf(alvo: SecaoRelatorio | "completo"): Promise<void> {
    const relatorio = this.relatorio;
    if (!relatorio || this.gerandoPdf) {
      return;
    }
    this.gerandoPdf = alvo;
    try {
      const secoes = alvo === "completo" ? SECOES : [alvo];
      const titulo = alvo === "completo" ? "Relatório do dia" : TITULOS_SECAO[alvo];
      const sufixo = alvo === "completo" ? "" : `-${alvo}`;
      await this.relatorioPdfService.gerar({
        titulo,
        relatorio,
        secoes: secoes.map((secao) => this.montarSecaoPdf(secao, relatorio)),
        incluirIndicadores: alvo === "completo",
        nomeArquivo: `relatorio${sufixo}-${relatorio.data}.pdf`,
      });
      this.alertService.showToast("PDF gerado!");
    } catch {
      this.alertService.showError("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      this.gerandoPdf = null;
    }
  }

  /** Participação de uma forma de pagamento no arrecadado do dia. */
  percentual(valor: number): string {
    const total = this.relatorio?.arrecadado ?? 0;
    return total > 0 ? `${Math.round((valor / total) * 100)}%` : "0%";
  }

  /** Só atualiza sozinho vendo o dia de hoje: dias anteriores não mudam. */
  private escutarAtualizacoes(): void {
    this.websocketService.createWebSocketConnection().subscribe(() => {
      const client = this.websocketService.getClient();
      this.inscricoesTopicos = TOPICOS_ATUALIZACAO.map((topico) =>
        client.subscribe(topico, () => {
          if (this.vendoHoje) {
            this.atualizacoes$.next();
          }
        }),
      );
    });
  }

  private montarSecaoPdf(secao: SecaoRelatorio, r: RelatorioDiarioDTO): SecaoPdf {
    const base = { titulo: TITULOS_SECAO[secao], subtitulo: SUBTITULOS_SECAO[secao] };
    const percentual = (parte: number, total: number) =>
      total > 0 ? `${Math.round((parte / total) * 100)}%` : "0%";
    switch (secao) {
      case "produtos":
        return {
          ...base,
          imagem: this.gProdutos?.imagem(),
          cabecalho: ["Produto", "Categoria", "Unidades", "Valor"],
          linhas: r.produtos.map((p) => [p.nome, p.categoria, String(p.quantidade), formatarReal(p.valor)]),
          rodape: ["Total", "", String(r.itensVendidos), formatarReal(r.vendido)],
          vazio: "Nenhum produto vendido neste dia.",
        };
      case "formas": {
        const formas = r.formasPagamento.filter((f) => f.quantidade > 0);
        return {
          ...base,
          imagem: this.gFormas?.imagem(),
          cabecalho: ["Forma de pagamento", "Comandas", "Valor", "Participação"],
          linhas: formas.map((f) => [f.rotulo, String(f.quantidade), formatarReal(f.valor),
            percentual(f.valor, r.arrecadado)]),
          rodape: ["Total", String(r.comandasFechadas), formatarReal(r.arrecadado), "100%"],
          vazio: "Nenhuma comanda fechada neste dia.",
        };
      }
      case "horas":
        return {
          ...base,
          imagem: this.gHoras?.imagem(),
          cabecalho: ["Hora", "Pedidos", "Vendido", "Arrecadado"],
          linhas: r.porHora
            .filter((h) => h.pedidos > 0 || h.arrecadado > 0)
            .map((h) => {
              const hora = String(h.hora).padStart(2, "0");
              return [`${hora}h às ${hora}h59`, String(h.pedidos), formatarReal(h.vendido), formatarReal(h.arrecadado)];
            }),
          vazio: "Sem movimento neste dia.",
        };
      case "status": {
        const status = r.pedidosPorStatus.filter((s) => s.quantidade > 0);
        return {
          ...base,
          imagem: this.gStatus?.imagem(),
          cabecalho: ["Status", "Pedidos", "Participação"],
          linhas: status.map((s) => [s.rotulo, String(s.quantidade), percentual(s.quantidade, r.pedidosRegistrados)]),
          rodape: ["Total", String(r.pedidosRegistrados), "100%"],
          vazio: "Nenhum pedido neste dia.",
        };
      }
      case "categorias":
        return {
          ...base,
          imagem: this.gCategorias?.imagem(),
          cabecalho: ["Categoria", "Unidades", "Valor", "Participação"],
          linhas: r.categorias.map((c) => [c.rotulo, String(c.quantidade), formatarReal(c.valor),
            percentual(c.valor, r.vendido)]),
          rodape: ["Total", String(r.itensVendidos), formatarReal(r.vendido), "100%"],
          vazio: "Nenhuma venda neste dia.",
        };
      case "tendencia": {
        const total = r.tendencia.reduce((soma, d) => soma + d.arrecadado, 0);
        const comandas = r.tendencia.reduce((soma, d) => soma + d.comandasFechadas, 0);
        return {
          ...base,
          imagem: this.gTendencia?.imagem(),
          cabecalho: ["Dia", "Comandas fechadas", "Arrecadado"],
          linhas: r.tendencia.map((d) => [formatarData(d.data), String(d.comandasFechadas), formatarReal(d.arrecadado)]),
          rodape: ["Total", String(comandas), formatarReal(total)],
        };
      }
    }
  }

  private exibir(relatorio: RelatorioDiarioDTO): void {
    this.relatorio = relatorio;
    this.graficoProdutos = this.montarGraficoProdutos(relatorio);
    this.graficoFormas = comoGrafico(this.montarGraficoFormas(relatorio));
    this.graficoHoras = this.montarGraficoHoras(relatorio);
    this.graficoStatus = comoGrafico(this.montarGraficoStatus(relatorio));
    this.graficoCategorias = this.montarGraficoCategorias(relatorio);
    this.graficoTendencia = this.montarGraficoTendencia(relatorio);
  }

  private montarGraficoProdutos(relatorio: RelatorioDiarioDTO): ChartConfiguration {
    const produtos = relatorio.produtos.slice(0, MAXIMO_PRODUTOS_NO_GRAFICO);
    return {
      type: "bar",
      data: {
        labels: produtos.map((p) => p.nome),
        datasets: [
          {
            label: "Unidades",
            data: produtos.map((p) => p.quantidade),
            backgroundColor: COR_PRINCIPAL,
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) =>
                `${item.formattedValue} un. · ${formatarReal(produtos[item.dataIndex].valor)}`,
            },
          },
        },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    };
  }

  private montarGraficoFormas(relatorio: RelatorioDiarioDTO): ChartConfiguration<"doughnut"> {
    const formas = relatorio.formasPagamento.filter((f) => f.quantidade > 0);
    return {
      type: "doughnut",
      data: {
        labels: formas.map((f) => f.rotulo),
        datasets: [
          {
            data: formas.map((f) => f.valor),
            backgroundColor: formas.map((f) => COR_FORMA[f.chave] ?? CORES[6]),
            borderWidth: 2,
          },
        ],
      },
      options: {
        cutout: "60%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (item) =>
                ` ${formatarReal(Number(item.raw))} · ${formas[item.dataIndex].quantidade} comanda(s)`,
            },
          },
        },
      },
    };
  }

  /** Mostra só o intervalo de horas com movimento (ex.: 17h às 23h), não as 24 horas. */
  private montarGraficoHoras(relatorio: RelatorioDiarioDTO): ChartConfiguration {
    const comMovimento = relatorio.porHora.filter((h) => h.pedidos > 0 || h.arrecadado > 0);
    const primeira = comMovimento.length ? comMovimento[0].hora : 0;
    const ultima = comMovimento.length ? comMovimento[comMovimento.length - 1].hora : 23;
    const horas = relatorio.porHora.filter((h) => h.hora >= primeira && h.hora <= ultima);
    return {
      type: "bar",
      data: {
        labels: horas.map((h) => `${String(h.hora).padStart(2, "0")}h`),
        datasets: [
          {
            type: "bar",
            label: "Pedidos",
            data: horas.map((h) => h.pedidos),
            backgroundColor: COR_SECUNDARIA,
            borderRadius: 6,
            yAxisID: "pedidos",
          },
          {
            type: "line",
            label: "Arrecadado",
            data: horas.map((h) => h.arrecadado),
            borderColor: COR_PRINCIPAL,
            backgroundColor: COR_PRINCIPAL,
            tension: 0.3,
            yAxisID: "valor",
          },
        ],
      },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (item) =>
                item.dataset.yAxisID === "valor"
                  ? ` Arrecadado: ${formatarReal(Number(item.raw))}`
                  : ` Pedidos: ${item.formattedValue}`,
            },
          },
        },
        scales: {
          pedidos: { position: "left", beginAtZero: true, ticks: { precision: 0 } },
          valor: {
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { callback: (valor) => formatarReal(valor) },
          },
        },
      },
    };
  }

  private montarGraficoStatus(relatorio: RelatorioDiarioDTO): ChartConfiguration<"doughnut"> {
    const status = relatorio.pedidosPorStatus.filter((s) => s.quantidade > 0);
    return {
      type: "doughnut",
      data: {
        labels: status.map((s) => s.rotulo),
        datasets: [
          {
            data: status.map((s) => s.quantidade),
            backgroundColor: status.map((s) => COR_STATUS[s.chave] ?? CORES[6]),
            borderWidth: 2,
          },
        ],
      },
      options: { cutout: "60%", plugins: { legend: { position: "bottom" } } },
    };
  }

  private montarGraficoCategorias(relatorio: RelatorioDiarioDTO): ChartConfiguration {
    const categorias = relatorio.categorias;
    return {
      type: "bar",
      data: {
        labels: categorias.map((c) => c.rotulo),
        datasets: [
          {
            label: "Vendido",
            data: categorias.map((c) => c.valor),
            backgroundColor: categorias.map((_, indice) => CORES[indice % CORES.length]),
            borderRadius: 6,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) =>
                ` ${formatarReal(Number(item.raw))} · ${categorias[item.dataIndex].quantidade} un.`,
            },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (valor) => formatarReal(valor) } } },
      },
    };
  }

  private montarGraficoTendencia(relatorio: RelatorioDiarioDTO): ChartConfiguration {
    const dias = relatorio.tendencia;
    return {
      type: "line",
      data: {
        labels: dias.map((d) => {
          const [, mes, dia] = d.data.split("-");
          return `${dia}/${mes}`;
        }),
        datasets: [
          {
            label: "Arrecadado",
            data: dias.map((d) => d.arrecadado),
            borderColor: COR_PRINCIPAL,
            backgroundColor: "rgba(27, 127, 75, 0.12)",
            fill: true,
            tension: 0.3,
            pointRadius: dias.map((d) => (d.data === relatorio.data ? 6 : 3)),
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) =>
                ` ${formatarReal(Number(item.raw))} · ${dias[item.dataIndex].comandasFechadas} comanda(s)`,
            },
          },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (valor) => formatarReal(valor) } } },
      },
    };
  }
}
