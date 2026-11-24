import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { corDoTipoEvento, fromTipoEventoEnumValue } from "src/app/enums/tipo-evento.enum";
import { MaterialModule } from "src/app/material.module";
import { EventoDTO, EventoParticipanteDTO } from "src/app/model/evento.dto";
import { AlertService } from "src/app/services/alert.service";
import { EventoApiService } from "src/app/services/http-services/evento.service";

/** Resultado do modal: o usuário quer alterar o evento, ou ele foi excluído. */
export type ResultadoDetalharEvento = "alterar" | "excluido" | undefined;

@Component({
  selector: "app-detalhar-evento-modal",
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  templateUrl: "./detalhar-evento.modal.html",
})
export class DetalharEventoModal implements OnInit {
  public data = inject<{ evento: EventoDTO }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<DetalharEventoModal, ResultadoDetalharEvento>>(MatDialogRef);
  private eventoService = inject(EventoApiService);
  private alertService = inject(AlertService);

  public excluindo = false;
  public participantes: EventoParticipanteDTO[] = [];
  public carregandoParticipantes = true;
  /** Participante sendo removido (desabilita o botão dele). */
  public removendo?: number;

  ngOnInit(): void {
    this.carregarParticipantes();
  }

  /** Vagas ocupadas: "3 de 16" ou, sem limite, só os inscritos. */
  get ocupacao(): string {
    const inscritos = this.participantes.length;
    return this.evento.vagas ? `${inscritos} de ${this.evento.vagas}` : `${inscritos} · sem limite`;
  }

  removerParticipante(participante: EventoParticipanteDTO): void {
    const id = this.evento.id;
    if (id == null || this.removendo != null) {
      return;
    }
    const valor = this.evento.valorInscricao
      ? " O valor da inscrição sai da comanda (se ela ainda estiver aberta)."
      : "";
    this.alertService.showConfirmation(
      "Remover participante",
      `Deseja remover ${participante.nome} (comanda ${participante.comanda}) do evento?${valor}`,
      () => {
        this.removendo = participante.id;
        this.eventoService.removerParticipante(id, participante.id).subscribe({
          next: () => {
            this.removendo = undefined;
            this.participantes = this.participantes.filter((p) => p.id !== participante.id);
            this.alertService.showToast("Participante removido!");
          },
          error: (error) => {
            this.removendo = undefined;
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível remover o participante.",
            );
          },
        });
      },
    );
  }

  private carregarParticipantes(): void {
    if (this.evento.id == null) {
      this.carregandoParticipantes = false;
      return;
    }
    this.eventoService.getParticipantes(this.evento.id).subscribe({
      next: (participantes) => {
        this.participantes = participantes;
        this.carregandoParticipantes = false;
      },
      error: () => (this.carregandoParticipantes = false),
    });
  }

  get evento(): EventoDTO {
    return this.data.evento;
  }

  get rotuloTipo(): string {
    return fromTipoEventoEnumValue(this.evento.tipo) || "—";
  }

  get corTipo(): string {
    return corDoTipoEvento(this.evento.tipo);
  }

  /** Evento que começa e termina no mesmo dia: a data aparece uma vez só ("28/11/2026, 19:00 às 23:00"). */
  get mesmoDia(): boolean {
    return this.evento.dataHoraInicio?.slice(0, 10) === this.evento.dataHoraFim?.slice(0, 10);
  }

  alterar(): void {
    this.dialogRef.close("alterar");
  }

  excluir(): void {
    const id = this.evento.id;
    if (id == null || this.excluindo) {
      return;
    }
    this.alertService.showConfirmation(
      "Excluir evento",
      `Deseja excluir o evento "${this.evento.nome}"?`,
      () => {
        this.excluindo = true;
        this.eventoService.deleteById(id).subscribe({
          next: () => this.dialogRef.close("excluido"),
          error: (error) => {
            this.excluindo = false;
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível excluir o evento.",
            );
          },
        });
      },
    );
  }
}
