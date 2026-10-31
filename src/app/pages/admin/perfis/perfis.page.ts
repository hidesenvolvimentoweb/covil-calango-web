import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { PerfilDTO } from "src/app/model/perfil.dto";
import { AlertService } from "src/app/services/alert.service";
import { PerfilApiService } from "src/app/services/http-services/perfil.service";
import { PerfilFormModal } from "./perfil-form.modal";
import { PerfilPermissoesModal } from "./perfil-permissoes.modal";

@Component({
  selector: "app-perfis",
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./perfis.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class PerfisPage implements OnInit {
  private perfilService = inject(PerfilApiService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);

  public perfis: PerfilDTO[] = [];
  public carregando = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({ name: [""] });
  }

  ngOnInit(): void {
    this.carregarPerfis();
  }

  carregarPerfis(): void {
    this.carregando = true;
    this.perfilService
      .getPerfisPage(
        this.filtroForm.getRawValue(),
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          if (response.content.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.carregarPerfis();
            return;
          }
          this.perfis = response.content;
          this.totalElements = response.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            "Não foi possível carregar os perfis.",
          );
        },
      });
  }

  abrirCadastro(): void {
    this.abrirModal();
  }

  editar(perfil: PerfilDTO): void {
    this.abrirModal(perfil.id);
  }

  gerenciarPermissoes(perfil: PerfilDTO): void {
    if (perfil.id == null) {
      return;
    }
    this.dialog
      .open(PerfilPermissoesModal, {
        width: "900px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { perfilId: perfil.id },
      })
      .afterClosed()
      .subscribe((atualizou) => {
        if (atualizou) {
          this.carregarPerfis();
        }
      });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregarPerfis();
  }

  limparFiltros(): void {
    this.filtroForm.reset({ name: "" });
    this.pageIndex = 0;
    this.carregarPerfis();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarPerfis();
  }

  excluir(perfil: PerfilDTO): void {
    this.alertService.showConfirmation(
      "Excluir perfil",
      `Deseja excluir o perfil "${perfil.name}"?`,
      () => {
        this.perfilService.deleteById(perfil.id!).subscribe({
          next: () => {
            this.carregarPerfis();
            this.alertService.showToast("Perfil excluído!", "success");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível excluir o perfil.",
            ),
        });
      },
    );
  }

  private abrirModal(id?: number): void {
    this.dialog
      .open(PerfilFormModal, {
        width: "520px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { id },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.carregarPerfis();
          this.alertService.showToast(
            id == null ? "Perfil cadastrado!" : "Perfil alterado!",
          );
        }
      });
  }
}
