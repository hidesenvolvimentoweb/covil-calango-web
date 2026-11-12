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
import { AuthService } from "src/app/services/http-services/auth.service";

@Component({
  selector: "app-esqueci-senha",
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    ReactiveFormsModule,
    TablerIconsModule,
  ],
  templateUrl: "./esqueci-senha.component.html",
  styleUrls: ["../login/login.component.scss"],
})
export class EsqueciSenhaComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  public enviando = false;
  public emailEnviado?: string;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  enviar(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    const email = String(this.form.getRawValue().email ?? "").trim();
    this.authService.esqueciSenha(email).subscribe({
      next: () => {
        this.enviando = false;
        this.emailEnviado = email;
      },
      error: (error) => {
        this.enviando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ??
            "Não foi possível enviar o link de recuperação. Tente novamente.",
        );
      },
    });
  }
}
