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
import { ParametroApiService } from "src/app/services/http-services/parametro.service";

@Component({
  selector: "app-parametro-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./parametro-form.modal.html",
})
export class ParametroFormModal implements OnInit {
  public data = inject<{ id?: number }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<ParametroFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private parametroService = inject(ParametroApiService);
  private alertService = inject(AlertService);

  public salvando = false;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      nome: ["", Validators.required],
      descricao: [""],
    });
  }

  ngOnInit(): void {
    if (this.data.id == null) {
      return;
    }
    this.parametroService.getParametroById(this.data.id).subscribe({
      next: (parametro) => this.form.patchValue(parametro),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o parâmetro.",
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
      nome: String(value.nome).trim(),
      descricao: String(value.descricao).trim() || undefined,
    };
    const request$ =
      this.data.id == null
        ? this.parametroService.create(request)
        : this.parametroService.update(this.data.id, request);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.salvando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível salvar o parâmetro.",
        );
      },
    });
  }
}
