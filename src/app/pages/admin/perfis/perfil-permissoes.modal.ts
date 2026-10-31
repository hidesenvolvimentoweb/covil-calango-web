import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { PerfilDTO } from "src/app/model/perfil.dto";
import { PermissaoDTO } from "src/app/model/permissao.dto";
import { AlertService } from "src/app/services/alert.service";
import { PerfilApiService } from "src/app/services/http-services/perfil.service";
import { PermissaoApiService } from "src/app/services/http-services/permissao.service";

@Component({
  selector: "app-perfil-permissoes-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./perfil-permissoes.modal.html",
})
export class PerfilPermissoesModal implements OnInit {

  public data = inject<{
    perfilId: number;
  }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<PerfilPermissoesModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private perfilService = inject(PerfilApiService);
  private permissaoService = inject(PermissaoApiService);
  private alertService = inject(AlertService);

  public perfil?: PerfilDTO;
  public permissoes: PermissaoDTO[] = [];
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
    this.perfilService.getPerfilById(this.data.perfilId).subscribe({
      next: (perfil) => (this.perfil = perfil),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o perfil.",
        );
        this.dialogRef.close(false);
      },
    });
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
        error: (error) => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível carregar as permissões.",
          );
        },
      });
  }

  consultar(): void {
    this.pageIndex = 0;
    this.carregarPermissoes();
  }

  limparFiltro(): void {
    this.filtroForm.reset({ name: "" });
    this.pageIndex = 0;
    this.carregarPermissoes();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarPermissoes();
  }

  permissaoAssociada(permissao: PermissaoDTO): boolean {
    return this.perfil?.permissoes?.includes(permissao.name) ?? false;
  }

  alterarAssociacao(permissao: PermissaoDTO, associar: boolean): void {
    if (this.perfil?.id == null || permissao.id == null || this.atualizando) {
      return;
    }

    this.atualizando = true;
    const request$ = associar
      ? this.permissaoService.associateWithProfile(permissao.id, this.perfil.id)
      : this.permissaoService.disassociateFromProfile(
          permissao.id,
          this.perfil.id,
        );
    request$.subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.atualizou = true;
        this.atualizando = false;
        this.alertService.showToast(
          associar ? "Permissão associada!" : "Permissão desassociada!",
        );
      },
      error: (error) => {
        this.atualizando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível atualizar a associação.",
        );
      },
    });
  }
}
