import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { PacoteDTO, ROTULO_CATEGORIA_PACOTE, ROTULO_STATUS_PACOTE } from "src/app/model/pacote.dto";
import { resolverUrlImagem } from "src/app/utils/imagem.util";

/** Detalhe de um pacote: a foto de quem deixou, a da retirada e o histórico. */
@Component({
  selector: "app-detalhar-pacote-modal",
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule],
  templateUrl: "./detalhar-pacote.modal.html",
})
export class DetalharPacoteModal {
  public data = inject<{ pacote: PacoteDTO }>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<DetalharPacoteModal>);
  public readonly rotuloStatus = ROTULO_STATUS_PACOTE;

  get pacote(): PacoteDTO {
    return this.data.pacote;
  }

  get categoria(): string {
    return ROTULO_CATEGORIA_PACOTE[this.pacote.categoria] ?? this.pacote.categoria;
  }

  get classeStatus(): string {
    return `pacote-status pacote-status-${this.pacote.status.toLowerCase()}`;
  }

  urlFoto(caminho?: string | null): string | null {
    return resolverUrlImagem(caminho);
  }
}
