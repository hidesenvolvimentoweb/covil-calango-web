import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import { AlertService } from "src/app/services/alert.service";
import { UsuarioAdminService } from "src/app/services/http-services/usuario-admin.service";
import { UsuarioFormModal } from "./usuario-form.modal";
import { UsuarioPerfisModal } from "./usuario-perfis.modal";

@Component({
  selector: "app-usuarios-admin",
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./usuarios.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class UsuariosPage implements OnInit {
  private usuarioService = inject(UsuarioAdminService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);

  public usuarios: UsuarioDTO[] = [];
  public carregando = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({
      nome: [""],
      email: [""],
      contato: [""],
    });
  }

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.carregando = true;
    this.usuarioService
      .getUsuariosPage(
        this.filtroForm.getRawValue(),
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          if (response.content.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.carregarUsuarios();
            return;
          }
          this.usuarios = response.content;
          this.totalElements = response.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            "Não foi possível carregar os usuários.",
          );
        },
      });
  }

  abrirCadastro(): void {
    this.abrirModal();
  }

  editar(usuario: UsuarioDTO): void {
    this.abrirModal(usuario.id);
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregarUsuarios();
  }

  limparFiltros(): void {
    this.filtroForm.reset({ nome: "", email: "", contato: "" });
    this.pageIndex = 0;
    this.carregarUsuarios();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarUsuarios();
  }

  excluir(usuario: UsuarioDTO): void {
    this.alertService.showConfirmation(
      "Excluir usuário",
      `Deseja excluir "${usuario.nome ?? usuario.email}"?`,
      () => {
        this.usuarioService.deleteById(usuario.id!).subscribe({
          next: () => {
            this.carregarUsuarios();
            this.alertService.showToast("Usuário excluído!", "success");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível excluir o usuário.",
            ),
        });
      },
    );
  }

  listarPerfis(usuario: UsuarioDTO): string {
    return usuario.perfis?.map((perfil) => perfil.name).join(", ") || "—";
  }

  gerenciarPerfis(usuario: UsuarioDTO): void {
    if (usuario.id == null) {
      return;
    }
    this.dialog
      .open(UsuarioPerfisModal, {
        width: "900px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { usuarioId: usuario.id },
      })
      .afterClosed()
      .subscribe((atualizou) => {
        if (atualizou) {
          this.carregarUsuarios();
        }
      });
  }

  private abrirModal(id?: number): void {
    this.dialog
      .open(UsuarioFormModal, {
        width: "600px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { id },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.carregarUsuarios();
          this.alertService.showToast(
            id == null ? "Usuário cadastrado!" : "Usuário alterado!",
          );
        }
      });
  }
}
