import { Injectable } from "@angular/core";

const EVENTOS_DESBLOQUEIO = ["pointerdown", "keydown", "touchstart"];

/** Sequência de notas (frequência em Hz e duração em segundos) de cada aviso. */
interface Nota {
  frequencia: number;
  duracao: number;
}

/** Duas notas subindo: nova solicitação de comanda. */
const SOM_SOLICITACAO: Nota[] = [
  { frequencia: 660, duracao: 0.16 },
  { frequencia: 880, duracao: 0.26 },
];

/** Três notas repetidas, mais insistentes: novo pedido para a cozinha. */
const SOM_PEDIDO: Nota[] = [
  { frequencia: 988, duracao: 0.12 },
  { frequencia: 988, duracao: 0.12 },
  { frequencia: 1319, duracao: 0.3 },
];

const INTERVALO_ENTRE_NOTAS = 0.05;
const VOLUME = 0.25;

/**
 * Avisos sonoros da equipe, gerados com a Web Audio API (sem arquivos de áudio).
 *
 * O navegador só libera o áudio depois de uma interação do usuário com a página. Por isso o contexto de áudio é
 * desbloqueado no primeiro clique ou tecla: até lá (ex.: logo após recarregar a página), o aviso não toca.
 */
@Injectable({ providedIn: "root" })
export class AvisoSonoroService {
  private contexto?: AudioContext;

  constructor() {
    const desbloquear = () => {
      void this.obterContexto()?.resume().catch(() => undefined);
      EVENTOS_DESBLOQUEIO.forEach((evento) =>
        document.removeEventListener(evento, desbloquear, true),
      );
    };
    EVENTOS_DESBLOQUEIO.forEach((evento) =>
      document.addEventListener(evento, desbloquear, true),
    );
  }

  tocarNovaSolicitacao(): void {
    this.tocar(SOM_SOLICITACAO);
  }

  tocarNovoPedido(): void {
    this.tocar(SOM_PEDIDO);
  }

  private tocar(notas: Nota[]): void {
    const contexto = this.obterContexto();
    if (!contexto || contexto.state !== "running") {
      return;
    }
    let inicio = contexto.currentTime;
    for (const nota of notas) {
      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();
      oscilador.type = "sine";
      oscilador.frequency.value = nota.frequencia;
      // Ataque e decaimento curtos evitam o estalo no começo e no fim de cada nota.
      ganho.gain.setValueAtTime(0.0001, inicio);
      ganho.gain.exponentialRampToValueAtTime(VOLUME, inicio + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + nota.duracao);
      oscilador.connect(ganho).connect(contexto.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + nota.duracao);
      inicio += nota.duracao + INTERVALO_ENTRE_NOTAS;
    }
  }

  private obterContexto(): AudioContext | undefined {
    if (!this.contexto && typeof AudioContext !== "undefined") {
      this.contexto = new AudioContext();
    }
    return this.contexto;
  }
}
