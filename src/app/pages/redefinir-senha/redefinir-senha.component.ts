import { Component, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";
import { AlertService } from "src/app/services/alert.service";
import { AuthService } from "src/app/services/http-services/auth.service";
import {
  TAMANHO_MINIMO_SENHA,
  confirmacaoSenhaValidator,
} from "src/app/validators/senha.validator";

@Component({
  selector: "app-redefinir-senha",
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    ReactiveFormsModule,
    TablerIconsModule,
  ],
  templateUrl: "./redefinir-senha.component.html",
  styleUrls: ["../login/login.component.scss"],
})
export class RedefinirSenhaComponent {
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  public readonly tamanhoMinimoSenha = TAMANHO_MINIMO_SENHA;
  public readonly token = this.route.snapshot.queryParamMap.get("token");
  /** Primeiro acesso: o usuário ainda possui a senha temporária enviada por e-mail. */
  public readonly primeiroAcesso =
    this.route.snapshot.queryParamMap.get("primeiroAcesso") === "true";
  public salvando = false;
  public senhaAlterada = false;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      senhaTemporaria: ["", this.primeiroAcesso ? [Validators.required] : []],
      password: [
        "",
        [Validators.required, Validators.minLength(TAMANHO_MINIMO_SENHA)],
      ],
      confirmarSenha: ["", [Validators.required, confirmacaoSenhaValidator()]],
    });
    this.form
      .get("password")
      ?.valueChanges.subscribe(() =>
        this.form.get("confirmarSenha")?.updateValueAndValidity(),
      );
  }

  salvar(): void {
    if (!this.token || this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const value = this.form.getRawValue();
    this.authService
      .redefinirSenha(
        this.token,
        value.password,
        this.primeiroAcesso ? value.senhaTemporaria.trim() : undefined,
      )
      .subscribe({
        next: () => {
          this.salvando = false;
          this.senhaAlterada = true;
        },
        error: (error) => {
          this.salvando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ??
              "Não foi possível alterar a senha. Tente novamente.",
          );
        },
      });
  }
}
