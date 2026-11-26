import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { StompSubscription } from "@stomp/stompjs";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import {
  PacoteDTO,
  ROTULO_CATEGORIA_PACOTE,
  ROTULO_STATUS_PACOTE,
  StatusPacote,
} from "src/app/model/pacote.dto";
import { AlertService } from "src/app/services/alert.service";
import { PacoteApiService, TOPICO_PACOTES } from "src/app/services/http-services/pacote.service";
import { WebsocketService } from "src/app/services/http-services/websocket.service";
import { resolverUrlImagem } from "src/app/utils/imagem.util";
import { reduzirImagem } from "src/app/utils/reduzir-imagem.util";
import { DetalharPacoteModal } from "./detalhar-pacote.modal";

type FiltroStatus = StatusPacote | "TODOS";

/**
 * Pacotes deixados pelos clientes no app. Na retirada, quem recebe informa o código: o atendente busca o pacote,
 * confere o item pela foto de quem deixou, tira a foto do item entregue e dá baixa.
 */
@Component({
  selector: "app-pacotes",
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./pacotes.page.html",
})
export class PacotesPage implements OnInit, OnDestroy {
  private pacoteService = inject(PacoteApiService);
  private alertService = inject(AlertService);
  private websocketService = inject(WebsocketService);
  private dialog = inject(MatDialog);

  public readonly rotuloStatus = ROTULO_STATUS_PACOTE;
  public readonly filtros: { valor: FiltroStatus; rotulo: string }[] = [
    { valor: "AGUARDANDO_RETIRADA", rotulo: "Aguardando retirada" },
    { valor: "RETIRADO", rotulo: "Retirados" },
    { valor: "CANCELADO", rotulo: "Cancelados" },
    { valor: "TODOS", rotulo: "Todos" },
  ];
  public filtro: FiltroStatus = "AGUARDANDO_RETIRADA";
  public pacotes: PacoteDTO[] = [];
  public carregando = false;

  // Retirada
  public codigo = "";
  public buscando = false;
  public pacoteEncontrado?: PacoteDTO;
  public fotoRetirada?: Blob;
  public previewRetirada?: string;
  public preparandoFoto = false;
  public dandoBaixa = false;

  private inscricao?: StompSubscription;

  ngOnInit(): void {
    this.consultar();
    this.websocketService.createWebSocketConnection().subscribe(() => {
      this.inscricao = this.websocketService.getClient().subscribe(TOPICO_PACOTES, () => this.consultar(false));
    });
  }

  ngOnDestroy(): void {
    this.inscricao?.unsubscribe();
    this.liberarPreview();
  }

  consultar(mostrarCarregando = true): void {
    this.carregando = mostrarCarregando;
    const status: StatusPacote[] = this.filtro === "TODOS" ? [] : [this.filtro];
    this.pacoteService.getPacotes(status).subscribe({
      next: (pacotes) => {
        this.pacotes = pacotes;
        this.carregando = false;
      },
      error: () => (this.carregando = false),
    });
  }

  alterarFiltro(filtro: FiltroStatus): void {
    this.filtro = filtro;
    this.consultar();
  }

  buscarPorCodigo(): void {
    const codigo = this.codigo.replace(/[\s-]/g, "").toUpperCase();
    if (!codigo || this.buscando) {
      return;
    }
    this.buscando = true;
    this.limparRetirada(false);
    this.pacoteService.getByCodigo(codigo).subscribe({
      next: (pacote) => {
        this.buscando = false;
        this.pacoteEncontrado = pacote;
      },
      error: (error) => {
        this.buscando = false;
        this.alertService.showError("Pacote não encontrado", error.error?.message ?? "Confira o código informado.");
      },
    });
  }

  async selecionarFotoRetirada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = "";
    if (!arquivo) {
      return;
    }
    if (!arquivo.type.startsWith("image/")) {
      this.alertService.showError("Erro", "Selecione uma foto (JPG, PNG ou WebP).");
      return;
    }
    this.preparandoFoto = true;
    this.fotoRetirada = await reduzirImagem(arquivo);
    this.preparandoFoto = false;
    this.liberarPreview();
    this.previewRetirada = URL.createObjectURL(this.fotoRetirada);
  }

  darBaixa(): void {
    const pacote = this.pacoteEncontrado;
    if (!pacote?.codigo || !this.fotoRetirada || this.dandoBaixa) {
      return;
    }
    this.alertService.showConfirmation(
      "Confirmar retirada",
      `Entregar o pacote ${pacote.codigo} para ${pacote.destinatario}?`,
      () => {
        this.dandoBaixa = true;
        this.pacoteService.retirar(pacote.id, pacote.codigo!, this.fotoRetirada!).subscribe({
          next: () => {
            this.dandoBaixa = false;
            this.alertService.showToast("Retirada registrada!");
            this.limparRetirada();
            this.consultar(false);
          },
          error: (error) => {
            this.dandoBaixa = false;
            this.alertService.showError("Erro", error.error?.message ?? "Não foi possível registrar a retirada.");
          },
        });
      },
    );
  }

  limparRetirada(limparCodigo = true): void {
    if (limparCodigo) {
      this.codigo = "";
    }
    this.pacoteEncontrado = undefined;
    this.fotoRetirada = undefined;
    this.liberarPreview();
  }

  cancelar(pacote: PacoteDTO): void {
    const taxa = pacote.valorTaxa ? " A taxa sai da comanda, se ela ainda estiver aberta." : "";
    this.alertService.showConfirmation(
      "Cancelar pacote",
      `Cancelar o pacote de ${pacote.remetente ?? "cliente"} para ${pacote.destinatario}?${taxa}`,
      () => {
        this.pacoteService.cancelar(pacote.id).subscribe({
          next: () => {
            this.alertService.showToast("Pacote cancelado!");
            if (this.pacoteEncontrado?.id === pacote.id) {
              this.limparRetirada();
            }
            this.consultar(false);
          },
          error: (error) =>
            this.alertService.showError("Erro", error.error?.message ?? "Não foi possível cancelar o pacote."),
        });
      },
    );
  }

  detalhar(pacote: PacoteDTO): void {
    this.dialog.open(DetalharPacoteModal, {
      width: "760px",
      maxWidth: "95vw",
      data: { pacote },
      autoFocus: false,
    });
  }

  rotuloCategoria(categoria: string): string {
    return ROTULO_CATEGORIA_PACOTE[categoria] ?? categoria;
  }

  urlFoto(caminho?: string | null): string | null {
    return resolverUrlImagem(caminho);
  }

  classeStatus(status: StatusPacote): string {
    return `pacote-status pacote-status-${status.toLowerCase()}`;
  }

  private liberarPreview(): void {
    if (this.previewRetirada) {
      URL.revokeObjectURL(this.previewRetirada);
      this.previewRetirada = undefined;
    }
  }
}
