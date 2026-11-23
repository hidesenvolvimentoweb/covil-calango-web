import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { Chart, ChartConfiguration, registerables } from "chart.js";

Chart.register(...registerables);

/** Fonte e cores padrão dos gráficos, alinhadas ao tema (Plus Jakarta Sans). */
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.color = "#5a6a85";
Chart.defaults.maintainAspectRatio = false;

/**
 * Envolve um gráfico do Chart.js (https://www.chartjs.org/). Recebe a configuração pronta e recria o gráfico quando
 * ela muda; a altura vem do contêiner.
 */
@Component({
  selector: "app-grafico",
  standalone: true,
  template: `<div class="grafico" [style.height.px]="altura"><canvas #canvas [attr.aria-label]="descricao" role="img"></canvas></div>`,
})
export class GraficoComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) public config!: ChartConfiguration;
  @Input() public altura = 280;
  /** Texto alternativo do gráfico, para leitores de tela. */
  @Input() public descricao = "";

  @ViewChild("canvas") private canvas?: ElementRef<HTMLCanvasElement>;
  private grafico?: Chart;

  ngAfterViewInit(): void {
    this.desenhar();
  }

  ngOnChanges(): void {
    if (this.canvas) {
      this.desenhar();
    }
  }

  ngOnDestroy(): void {
    this.grafico?.destroy();
  }

  /**
   * Imagem PNG do gráfico (para o PDF), sobre fundo branco e sem a animação de entrada.
   * Vazia se o gráfico ainda não foi desenhado.
   */
  imagem(): { dados: string; largura: number; altura: number } | undefined {
    const canvas = this.canvas?.nativeElement;
    if (!this.grafico || !canvas) {
      return undefined;
    }
    this.grafico.stop();
    this.grafico.update("none");
    const copia = document.createElement("canvas");
    copia.width = canvas.width;
    copia.height = canvas.height;
    const contexto = copia.getContext("2d");
    if (!contexto) {
      return undefined;
    }
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, copia.width, copia.height);
    contexto.drawImage(canvas, 0, 0);
    return { dados: copia.toDataURL("image/png"), largura: copia.width, altura: copia.height };
  }

  private desenhar(): void {
    this.grafico?.destroy();
    if (this.canvas && this.config) {
      this.grafico = new Chart(this.canvas.nativeElement, this.config);
    }
  }
}
