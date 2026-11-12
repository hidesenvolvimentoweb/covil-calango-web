import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { AlertService } from "src/app/services/alert.service";
import { SolicitacaoCadastroService } from "src/app/services/http-services/solicitacao-cadastro.service";

@Component({
  selector: "app-cadastro",
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    ReactiveFormsModule,
    TablerIconsModule,
  ],
  templateUrl: "./cadastro.component.html",
  styleUrls: ["../login/login.component.scss"],
})
export class CadastroComponent {
  private formBuilder = inject(FormBuilder);
  private solicitacaoCadastroService = inject(SolicitacaoCadastroService);
  private alertService = inject(AlertService);

  public salvando = false;
  public emailSolicitado?: string;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      nome: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      contato: [""],
    });
  }

  solicitar(): void {
    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const value = this.form.getRawValue();
    this.solicitacaoCadastroService
      .solicitar({
        nome: String(value.nome ?? "").trim(),
        email: String(value.email ?? "").trim(),
        contato: String(value.contato ?? "").trim(),
      })
      .subscribe({
        next: (solicitacao) => {
          this.salvando = false;
          this.emailSolicitado = solicitacao.email;
        },
        error: (error) => {
          this.salvando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ??
              "Não foi possível solicitar o cadastro. Tente novamente.",
          );
        },
      });
  }
}
