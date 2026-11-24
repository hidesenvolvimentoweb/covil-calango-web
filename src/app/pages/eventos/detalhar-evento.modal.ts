import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { corDoTipoEvento, fromTipoEventoEnumValue } from "src/app/enums/tipo-evento.enum";
import { MaterialModule } from "src/app/material.module";
import { EventoDTO } from "src/app/model/evento.dto";
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
export class DetalharEventoModal {
  public data = inject<{ evento: EventoDTO }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<DetalharEventoModal, ResultadoDetalharEvento>>(MatDialogRef);
  private eventoService = inject(EventoApiService);
  private alertService = inject(AlertService);

  public excluindo = false;

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
