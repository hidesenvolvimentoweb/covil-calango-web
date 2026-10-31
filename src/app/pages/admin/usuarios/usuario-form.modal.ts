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
import { AlertService } from "src/app/services/alert.service";
import { UsuarioAdminService } from "src/app/services/http-services/usuario-admin.service";

@Component({
  selector: "app-usuario-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./usuario-form.modal.html",
})
export class UsuarioFormModal implements OnInit {

  public data = inject<{
    id?: number;
  }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<UsuarioFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private usuarioService = inject(UsuarioAdminService);
  private alertService = inject(AlertService);

  public salvando = false;
  public form: FormGroup;

  constructor() {
    const data = this.data;

    this.form = this.formBuilder.group({
      nome: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      contato: [""],
      password: [""],
    });
    if (data.id == null) {
      this.form.get("password")?.addValidators(Validators.required);
      this.form.get("password")?.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    if (this.data.id == null) {
      return;
    }
    this.usuarioService.getUsuarioById(this.data.id).subscribe({
      next: (usuario) =>
        this.form.patchValue({
          nome: usuario.nome ?? "",
          email: usuario.email ?? "",
          contato: usuario.contato ?? "",
        }),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o usuário.",
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
    const value = this.form.getRawValue();
    const request = {
      nome: String(value.nome ?? "").trim(),
      email: String(value.email ?? "").trim(),
      contato: String(value.contato ?? "").trim(),
      ...(value.password?.trim() ? { password: value.password } : {}),
    };
    const request$ =
      this.data.id == null
        ? this.usuarioService.create(request)
        : this.usuarioService.update(this.data.id, request);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.salvando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível salvar o usuário.",
        );
      },
    });
  }
}
