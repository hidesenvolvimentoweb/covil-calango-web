import { DatePipe } from "@angular/common";
import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { SolicitacaoCadastroDTO } from "src/app/model/solicitacao-cadastro.dto";
import { AlertService } from "src/app/services/alert.service";
import { SolicitacaoCadastroService } from "src/app/services/http-services/solicitacao-cadastro.service";
import { FinalizarCadastroModal } from "./finalizar-cadastro.modal";

@Component({
  selector: "app-finalizar-cadastro-admin",
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, DatePipe],
  templateUrl: "./finalizar-cadastro.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class FinalizarCadastroPage implements OnInit {
  private solicitacaoCadastroService = inject(SolicitacaoCadastroService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);

  public solicitacoes: SolicitacaoCadastroDTO[] = [];
  public carregando = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({
      nome: [""],
      email: [""],
    });
  }

  ngOnInit(): void {
    this.carregarSolicitacoes();
  }

  carregarSolicitacoes(): void {
    this.carregando = true;
    this.solicitacaoCadastroService
      .getSolicitacoesPage(
        this.filtroForm.getRawValue(),
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          if (response.content.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.carregarSolicitacoes();
            return;
          }
          this.solicitacoes = response.content;
          this.totalElements = response.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            "Não foi possível carregar as solicitações de cadastro.",
          );
        },
      });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregarSolicitacoes();
  }

  limparFiltros(): void {
    this.filtroForm.reset({ nome: "", email: "" });
    this.pageIndex = 0;
    this.carregarSolicitacoes();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarSolicitacoes();
  }

  finalizar(solicitacao: SolicitacaoCadastroDTO): void {
    this.dialog
      .open(FinalizarCadastroModal, {
        width: "600px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { solicitacao },
      })
      .afterClosed()
      .subscribe((finalizado) => {
        if (finalizado) {
          this.carregarSolicitacoes();
          this.alertService.showToast("Cadastro finalizado!");
        }
      });
  }

  recusar(solicitacao: SolicitacaoCadastroDTO): void {
    this.alertService.showConfirmation(
      "Recusar cadastro",
      `Deseja recusar o cadastro de "${solicitacao.nome}"? A solicitação será excluída.`,
      () => {
        this.solicitacaoCadastroService.recusar(solicitacao.id).subscribe({
          next: () => {
            this.carregarSolicitacoes();
            this.alertService.showToast("Cadastro recusado!", "success");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível recusar o cadastro.",
            ),
        });
      },
    );
  }
}
