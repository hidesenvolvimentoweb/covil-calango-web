import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { ParametroDTO } from "src/app/model/parametro.dto";
import { AlertService } from "src/app/services/alert.service";
import { ParametroApiService } from "src/app/services/http-services/parametro.service";
import { resolverUrlImagem } from "src/app/utils/imagem.util";
import { ParametroFormModal } from "./parametro-form.modal";

@Component({
  selector: "app-parametros",
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./parametros.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class ParametrosPage implements OnInit {
  private parametroService = inject(ParametroApiService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);

  public parametros: ParametroDTO[] = [];
  public carregando = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({
      nome: [""],
      descricao: [""],
    });
  }

  ngOnInit(): void {
    this.carregarParametros();
  }

  carregarParametros(): void {
    this.carregando = true;
    this.parametroService
      .getParametrosPage(
        this.filtroForm.getRawValue(),
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          if (response.content.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.carregarParametros();
            return;
          }
          this.parametros = response.content;
          this.totalElements = response.totalElements;
          this.carregando = false;
        },
        error: (error) => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível carregar os parâmetros.",
          );
        },
      });
  }

  consultar(): void {
    this.pageIndex = 0;
    this.carregarParametros();
  }

  limparFiltros(): void {
    this.filtroForm.reset({ nome: "", descricao: "" });
    this.pageIndex = 0;
    this.carregarParametros();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarParametros();
  }

  urlImagem(parametro: ParametroDTO): string | null {
    return resolverUrlImagem(parametro.descricao);
  }

  /** Mostra no máximo 120 caracteres na tabela; textos longos são lidos no modal. */
  resumo(descricao?: string): string {
    const texto = descricao?.trim();
    if (!texto) {
      return "—";
    }
    return texto.length > 120 ? `${texto.slice(0, 120)}…` : texto;
  }

  abrirCadastro(): void {
    this.abrirModal();
  }

  editar(parametro: ParametroDTO): void {
    if (parametro.id != null) {
      this.abrirModal(parametro.id);
    }
  }

  excluir(parametro: ParametroDTO): void {
    const parametroId = parametro.id;
    if (parametroId == null) {
      return;
    }
    this.alertService.showConfirmation(
      "Excluir parâmetro",
      `Deseja excluir o parâmetro "${parametro.nome}"?`,
      () => {
        this.parametroService.deleteById(parametroId).subscribe({
          next: () => {
            this.carregarParametros();
            this.alertService.showToast("Parâmetro excluído!");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível excluir o parâmetro.",
            ),
        });
      },
    );
  }

  private abrirModal(id?: number): void {
    this.dialog
      .open(ParametroFormModal, {
        width: "720px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { id },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.carregarParametros();
          this.alertService.showToast(
            id == null ? "Parâmetro cadastrado!" : "Parâmetro alterado!",
          );
        }
      });
  }
}
