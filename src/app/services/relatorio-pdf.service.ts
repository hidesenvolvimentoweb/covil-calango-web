import { Injectable } from "@angular/core";
import type { jsPDF } from "jspdf";
import { RelatorioDiarioDTO } from "src/app/model/relatorio.dto";

/** Imagem de um gráfico (GraficoComponent.imagem). */
export interface ImagemGrafico {
  dados: string;
  largura: number;
  altura: number;
}

/** Uma seção do PDF: título, gráfico e a tabela com os números do gráfico. */
export interface SecaoPdf {
  titulo: string;
  subtitulo: string;
  imagem?: ImagemGrafico;
  cabecalho: string[];
  linhas: string[][];
  rodape?: string[];
  /** Texto exibido no lugar do gráfico e da tabela quando não há dados. */
  vazio?: string;
}

export interface OpcoesPdf {
  /** Ex.: "Relatório do dia" ou "Produtos que saíram". */
  titulo: string;
  relatorio: RelatorioDiarioDTO;
  secoes: SecaoPdf[];
  incluirIndicadores: boolean;
  nomeArquivo: string;
}

type Rgb = [number, number, number];

/** Mesmas cores do sistema (selos e gráficos). */
const VERDE: Rgb = [27, 127, 75];
const VERDE_CLARO: Rgb = [237, 247, 241];
const TEXTO: Rgb = [42, 53, 71];
const TEXTO_SECUNDARIO: Rgb = [90, 106, 133];
const BORDA: Rgb = [226, 232, 240];
const BRANCO: Rgb = [255, 255, 255];

const MARGEM = 14;
const ALTURA_CABECALHO = 30;
const ALTURA_RODAPE = 12;
const ALTURA_MAXIMA_GRAFICO = 85;
const NOME_ESTABELECIMENTO = "Covil do Calango";
const LOGO = "assets/images/covil-calango-logo.jpg";

const REAL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** "2026-11-23" → "23/11/2026". */
export const formatarData = (iso: string): string => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
};

export const formatarReal = (valor: number): string => REAL.format(Number(valor) || 0);

type AutoTable = typeof import("jspdf-autotable").default;

/**
 * O pacote principal do jspdf-autotable é UMD: conforme o empacotador, o default do import dinâmico chega como a
 * função ou como o objeto do módulo (com a função em .default).
 */
const resolverAutoTable = (modulo: unknown): AutoTable => {
  const padrao = (modulo as { default?: unknown }).default;
  if (typeof padrao === "function") {
    return padrao as AutoTable;
  }
  const interno = (padrao as { default?: unknown } | undefined)?.default;
  if (typeof interno === "function") {
    return interno as AutoTable;
  }
  throw new Error("jspdf-autotable não carregado");
};

/**
 * Gera os PDFs dos relatórios no navegador (jsPDF + jspdf-autotable), com o cabeçalho na cor do sistema, os
 * indicadores do dia, os gráficos já desenhados na tela e uma tabela com os números de cada gráfico.
 * As bibliotecas só são baixadas no primeiro PDF, para não pesar no carregamento do Dashboard.
 */
@Injectable({ providedIn: "root" })
export class RelatorioPdfService {
  private logo?: Promise<string | undefined>;

  async gerar(opcoes: OpcoesPdf): Promise<void> {
    const [{ jsPDF: JsPdf }, moduloAutoTable, logo] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      this.carregarLogo(),
    ]);
    const autoTable = resolverAutoTable(moduloAutoTable);
    const doc = new JsPdf({ unit: "mm", format: "a4" });
    const largura = doc.internal.pageSize.getWidth();
    const larguraUtil = largura - MARGEM * 2;
    let y = this.desenharCabecalho(doc, opcoes, logo);

    if (opcoes.incluirIndicadores) {
      y = this.desenharIndicadores(doc, opcoes.relatorio, y);
    }

    for (const secao of opcoes.secoes) {
      const alturaGrafico = secao.imagem
        ? Math.min(ALTURA_MAXIMA_GRAFICO, (secao.imagem.altura / secao.imagem.largura) * larguraUtil)
        : 0;
      // Título + gráfico juntos na mesma página; a tabela pode continuar na seguinte.
      y = this.garantirEspaco(doc, y, 16 + alturaGrafico + 20, opcoes, logo);
      y = this.desenharTituloSecao(doc, secao, y);

      if (secao.vazio && !secao.linhas.length) {
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...TEXTO_SECUNDARIO);
        doc.text(secao.vazio, MARGEM, y + 4);
        y += 14;
        continue;
      }

      if (secao.imagem) {
        const larguraGrafico = Math.min(larguraUtil, (secao.imagem.largura / secao.imagem.altura) * alturaGrafico);
        doc.addImage(secao.imagem.dados, "PNG", (largura - larguraGrafico) / 2, y, larguraGrafico, alturaGrafico);
        y += alturaGrafico + 6;
      }

      autoTable(doc, {
        startY: y,
        head: [secao.cabecalho],
        body: secao.linhas,
        foot: secao.rodape ? [secao.rodape] : undefined,
        margin: { left: MARGEM, right: MARGEM, top: ALTURA_CABECALHO + 8, bottom: ALTURA_RODAPE + 6 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9, textColor: TEXTO, lineColor: BORDA, lineWidth: 0.2, cellPadding: 2.5 },
        headStyles: { fillColor: VERDE, textColor: BRANCO, fontStyle: "bold" },
        footStyles: { fillColor: VERDE_CLARO, textColor: TEXTO, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        // Primeira coluna (nome) à esquerda; números à direita.
        columnStyles: Object.fromEntries(
          secao.cabecalho.map((_, indice) => [indice, { halign: indice === 0 ? "left" : "right" }]),
        ),
        didDrawPage: () => this.desenharCabecalhoCompacto(doc, opcoes, logo),
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    }

    this.desenharRodapes(doc, opcoes);
    doc.save(opcoes.nomeArquivo);
  }

  private desenharCabecalho(doc: jsPDF, opcoes: OpcoesPdf, logo?: string): number {
    const largura = doc.internal.pageSize.getWidth();
    doc.setFillColor(...VERDE).rect(0, 0, largura, ALTURA_CABECALHO + 6, "F");
    let x = MARGEM;
    if (logo) {
      doc.addImage(logo, "JPEG", MARGEM, 7, 22, 22);
      x += 28;
    }
    doc.setTextColor(...BRANCO);
    doc.setFont("helvetica", "bold").setFontSize(18).text(opcoes.titulo, x, 16);
    doc.setFont("helvetica", "normal").setFontSize(10)
      .text(`${NOME_ESTABELECIMENTO} · ${formatarData(opcoes.relatorio.data)}`, x, 23);
    doc.setFontSize(8).text(`Gerado em ${this.agora()}`, largura - MARGEM, 23, { align: "right" });
    return ALTURA_CABECALHO + 16;
  }

  /** Faixa estreita nas páginas seguintes (a primeira já tem o cabeçalho completo). */
  private desenharCabecalhoCompacto(doc: jsPDF, opcoes: OpcoesPdf, logo?: string): void {
    if (doc.getCurrentPageInfo().pageNumber === 1) {
      return;
    }
    const largura = doc.internal.pageSize.getWidth();
    doc.setFillColor(...VERDE).rect(0, 0, largura, 16, "F");
    let x = MARGEM;
    if (logo) {
      doc.addImage(logo, "JPEG", MARGEM, 3, 10, 10);
      x += 14;
    }
    doc.setTextColor(...BRANCO).setFont("helvetica", "bold").setFontSize(11).text(opcoes.titulo, x, 10);
    doc.setFont("helvetica", "normal").setFontSize(9)
      .text(formatarData(opcoes.relatorio.data), largura - MARGEM, 10, { align: "right" });
  }

  private desenharIndicadores(doc: jsPDF, r: RelatorioDiarioDTO, y: number): number {
    const indicadores: [string, string, string][] = [
      ["Arrecadado", formatarReal(r.arrecadado), `${r.comandasFechadas} comanda(s) fechada(s)`],
      ["Ticket médio", formatarReal(r.ticketMedio), `Permanência: ${this.duracao(r.permanenciaMediaMinutos)}`],
      ["Vendido em pedidos", formatarReal(r.vendido), `${r.itensVendidos} item(ns) · ${r.pedidosRegistrados} pedido(s)`],
      ["Comandas atendidas", String(r.comandasAtendidas),
        `${r.pedidosEntregues} entregue(s) · ${r.pedidosCancelados} cancelado(s)`],
    ];
    const larguraUtil = doc.internal.pageSize.getWidth() - MARGEM * 2;
    const espaco = 4;
    const larguraCaixa = (larguraUtil - espaco * 3) / 4;
    const alturaCaixa = 24;
    indicadores.forEach(([rotulo, valor, detalhe], indice) => {
      const x = MARGEM + indice * (larguraCaixa + espaco);
      doc.setDrawColor(...BORDA).setFillColor(...BRANCO).roundedRect(x, y, larguraCaixa, alturaCaixa, 2, 2, "FD");
      doc.setFillColor(...VERDE).rect(x, y + 3, 1.2, alturaCaixa - 6, "F");
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...TEXTO_SECUNDARIO).text(rotulo, x + 4, y + 7);
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...TEXTO).text(valor, x + 4, y + 14.5);
      doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...TEXTO_SECUNDARIO)
        .text(doc.splitTextToSize(detalhe, larguraCaixa - 6), x + 4, y + 19.5);
    });
    return y + alturaCaixa + 10;
  }

  private desenharTituloSecao(doc: jsPDF, secao: SecaoPdf, y: number): number {
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...TEXTO).text(secao.titulo, MARGEM, y);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...TEXTO_SECUNDARIO).text(secao.subtitulo, MARGEM, y + 5);
    doc.setDrawColor(...BORDA).setLineWidth(0.3)
      .line(MARGEM, y + 8, doc.internal.pageSize.getWidth() - MARGEM, y + 8);
    return y + 13;
  }

  /** Abre uma nova página quando o próximo bloco não cabe na atual. */
  private garantirEspaco(doc: jsPDF, y: number, necessario: number, opcoes: OpcoesPdf, logo?: string): number {
    const limite = doc.internal.pageSize.getHeight() - ALTURA_RODAPE - 6;
    if (y + necessario <= limite) {
      return y;
    }
    doc.addPage();
    this.desenharCabecalhoCompacto(doc, opcoes, logo);
    return 26;
  }

  private desenharRodapes(doc: jsPDF, opcoes: OpcoesPdf): void {
    const total = doc.getNumberOfPages();
    const largura = doc.internal.pageSize.getWidth();
    const altura = doc.internal.pageSize.getHeight();
    for (let pagina = 1; pagina <= total; pagina++) {
      doc.setPage(pagina);
      doc.setDrawColor(...BORDA).setLineWidth(0.3).line(MARGEM, altura - ALTURA_RODAPE, largura - MARGEM, altura - ALTURA_RODAPE);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...TEXTO_SECUNDARIO);
      doc.text(`${NOME_ESTABELECIMENTO} · ${opcoes.titulo} · ${formatarData(opcoes.relatorio.data)}`,
        MARGEM, altura - ALTURA_RODAPE + 6);
      doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - ALTURA_RODAPE + 6, { align: "right" });
    }
  }

  private carregarLogo(): Promise<string | undefined> {
    this.logo ??= fetch(LOGO)
      .then((resposta) => (resposta.ok ? resposta.blob() : Promise.reject()))
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = () => resolve(String(leitor.result));
            leitor.onerror = reject;
            leitor.readAsDataURL(blob);
          }),
      )
      // Sem a logo o PDF continua sendo gerado.
      .catch(() => undefined);
    return this.logo;
  }

  private agora(): string {
    return new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }).replace(",", " às");
  }

  private duracao(minutos: number | null): string {
    if (minutos == null) {
      return "—";
    }
    const horas = Math.floor(minutos / 60);
    return horas ? `${horas}h ${String(minutos % 60).padStart(2, "0")}min` : `${minutos}min`;
  }
}
