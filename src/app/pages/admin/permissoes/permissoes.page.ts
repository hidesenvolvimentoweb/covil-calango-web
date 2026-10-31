import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { PermissaoDTO } from "src/app/model/permissao.dto";
import { AlertService } from "src/app/services/alert.service";
import { PermissaoApiService } from "src/app/services/http-services/permissao.service";
import { PermissaoFormModal } from "./permissao-form.modal";

@Component({
  selector: "app-permissoes",
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./permissoes.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class PermissoesPage implements OnInit {
  private permissaoService = inject(PermissaoApiService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);

  public permissoes: PermissaoDTO[] = [];
  public carregando = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({ name: [""] });
  }

  ngOnInit(): void {
    this.carregarPermissoes();
  }

  carregarPermissoes(): void {
    this.carregando = true;
    this.permissaoService
      .getPermissoesPage(
        this.filtroForm.getRawValue(),
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          if (response.content.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.carregarPermissoes();
            return;
          }
          this.permissoes = response.content;
          this.totalElements = response.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            "Não foi possível carregar as permissões.",
          );
        },
      });
  }

  abrirCadastro(): void {
    this.abrirModal();
  }

  editar(permissao: PermissaoDTO): void {
    this.abrirModal(permissao.id);
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregarPermissoes();
  }

  limparFiltros(): void {
    this.filtroForm.reset({ name: "" });
    this.pageIndex = 0;
    this.carregarPermissoes();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarPermissoes();
  }

  excluir(permissao: PermissaoDTO): void {
    this.alertService.showConfirmation(
      "Excluir permissão",
      `Deseja excluir "${permissao.name}"?`,
      () => {
        this.permissaoService.deleteById(permissao.id!).subscribe({
          next: () => {
            this.carregarPermissoes();
            this.alertService.showToast("Permissão excluída!", "success");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível excluir a permissão.",
            ),
        });
      },
    );
  }

  private abrirModal(id?: number): void {
    this.dialog
      .open(PermissaoFormModal, {
        width: "520px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { id },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.carregarPermissoes();
          this.alertService.showToast(
            id == null ? "Permissão cadastrada!" : "Permissão alterada!",
          );
        }
      });
  }
}
