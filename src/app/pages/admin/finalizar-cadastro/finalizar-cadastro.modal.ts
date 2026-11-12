import { Component, OnInit, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { PerfilDTO } from "src/app/model/perfil.dto";
import { SolicitacaoCadastroDTO } from "src/app/model/solicitacao-cadastro.dto";
import { AlertService } from "src/app/services/alert.service";
import { PerfilApiService } from "src/app/services/http-services/perfil.service";
import { SolicitacaoCadastroService } from "src/app/services/http-services/solicitacao-cadastro.service";

@Component({
  selector: "app-finalizar-cadastro-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./finalizar-cadastro.modal.html",
})
export class FinalizarCadastroModal implements OnInit {
  public data = inject<{ solicitacao: SolicitacaoCadastroDTO }>(
    MAT_DIALOG_DATA,
  );
  public dialogRef = inject<MatDialogRef<FinalizarCadastroModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private perfilService = inject(PerfilApiService);
  private solicitacaoCadastroService = inject(SolicitacaoCadastroService);
  private alertService = inject(AlertService);

  public perfis: PerfilDTO[] = [];
  public salvando = false;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.group({
      perfilId: [null as number | null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.perfilService.getAllPerfis().subscribe({
      next: (perfis) => (this.perfis = perfis),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar os perfis.",
        );
        this.dialogRef.close(false);
      },
    });
  }

  salvar(): void {
    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    this.solicitacaoCadastroService
      .finalizar(this.data.solicitacao.id, this.form.getRawValue().perfilId)
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error) => {
          this.salvando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível finalizar o cadastro.",
          );
        },
      });
  }
}
