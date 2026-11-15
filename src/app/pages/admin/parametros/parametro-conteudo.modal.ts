import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { ParametroDTO, TIPOS_PARAMETRO } from "src/app/model/parametro.dto";
import { AlertService } from "src/app/services/alert.service";
import { resolverUrlImagem } from "src/app/utils/imagem.util";

/** Exibe o conteúdo completo de um parâmetro, sem os limites de largura da tabela. */
@Component({
  selector: "app-parametro-conteudo-modal",
  standalone: true,
  imports: [MaterialModule, TablerIconsModule],
  templateUrl: "./parametro-conteudo.modal.html",
})
export class ParametroConteudoModal {
  public parametro = inject<ParametroDTO>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<ParametroConteudoModal>>(MatDialogRef);
  private alertService = inject(AlertService);

  public readonly ehImagem = this.parametro.tipo === "IMAGEM";
  public readonly urlImagem = this.ehImagem
    ? resolverUrlImagem(this.parametro.descricao)
    : null;
  public readonly conteudo = this.ehImagem
    ? ""
    : (this.parametro.descricao ?? "").trim();
  /** Conteúdo em JSON é indentado e exibido em fonte monoespaçada. */
  public readonly conteudoJson = this.formatarJson(this.conteudo);

  get rotuloTipo(): string {
    const tipo = this.parametro.tipo ?? "TEXTO";
    return TIPOS_PARAMETRO.find((opcao) => opcao.valor === tipo)?.rotulo ?? tipo;
  }

  copiar(): void {
    const texto = this.conteudoJson ?? this.conteudo;
    navigator.clipboard
      .writeText(texto)
      .then(() => this.alertService.showToast("Conteúdo copiado!"))
      .catch(() =>
        this.alertService.showError("Erro", "Não foi possível copiar o conteúdo."),
      );
  }

  private formatarJson(texto: string): string | null {
    if (!/^[[{]/.test(texto)) {
      return null;
    }
    try {
      return JSON.stringify(JSON.parse(texto), null, 2);
    } catch {
      return null;
    }
  }
}
