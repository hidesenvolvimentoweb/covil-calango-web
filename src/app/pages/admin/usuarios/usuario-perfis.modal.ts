import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { PerfilDTO } from "src/app/model/perfil.dto";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import { AlertService } from "src/app/services/alert.service";
import { PerfilApiService } from "src/app/services/http-services/perfil.service";
import { UsuarioAdminService } from "src/app/services/http-services/usuario-admin.service";

@Component({
  selector: "app-usuario-perfis-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./usuario-perfis.modal.html",
})
export class UsuarioPerfisModal implements OnInit {

  public data = inject<{ usuarioId: number }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<UsuarioPerfisModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private usuarioService = inject(UsuarioAdminService);
  private perfilService = inject(PerfilApiService);
  private alertService = inject(AlertService);

  public usuario?: UsuarioDTO;
  public perfis: PerfilDTO[] = [];
  public carregando = false;
  public atualizando = false;
  public atualizou = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({ name: [""] });
  }

  ngOnInit(): void {
    this.usuarioService.getUsuarioById(this.data.usuarioId).subscribe({
      next: (usuario) => (this.usuario = usuario),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o usuário.",
        );
        this.dialogRef.close(false);
      },
    });
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
        error: (error) => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível carregar os perfis.",
          );
        },
      });
  }

  consultar(): void {
    this.pageIndex = 0;
    this.carregarPerfis();
  }

  limparFiltro(): void {
    this.filtroForm.reset({ name: "" });
    this.pageIndex = 0;
    this.carregarPerfis();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarPerfis();
  }

  perfilAssociado(perfil: PerfilDTO): boolean {
    return (
      this.usuario?.perfis?.some(
        (usuarioPerfil) => usuarioPerfil.id === perfil.id,
      ) ?? false
    );
  }

  alterarAssociacao(perfil: PerfilDTO, associar: boolean): void {
    if (perfil.id == null || this.atualizando) {
      return;
    }

    this.atualizando = true;
    const request$ = associar
      ? this.usuarioService.associateProfile(this.data.usuarioId, perfil.id)
      : this.usuarioService.disassociateProfile(this.data.usuarioId, perfil.id);
    request$.subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.atualizou = true;
        this.atualizando = false;
        this.alertService.showToast(
          associar ? "Perfil associado!" : "Perfil desassociado!",
        );
      },
      error: (error) => {
        this.atualizando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ??
            "Não foi possível atualizar o perfil do usuário.",
        );
      },
    });
  }
}
