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
import { PerfilApiService } from "src/app/services/http-services/perfil.service";

@Component({
  selector: "app-perfil-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./perfil-form.modal.html",
})
export class PerfilFormModal implements OnInit {

  public data = inject<{
    id?: number;
  }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<PerfilFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private perfilService = inject(PerfilApiService);
  private alertService = inject(AlertService);

  public salvando = false;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      name: ["", Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.data.id == null) {
      return;
    }
    this.perfilService.getPerfilById(this.data.id).subscribe({
      next: (perfil) => this.form.patchValue({ name: perfil.name }),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o perfil.",
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
    const request = { name: String(this.form.get("name")?.value).trim() };
    const request$ =
      this.data.id == null
        ? this.perfilService.create(request)
        : this.perfilService.update(this.data.id, request);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.salvando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível salvar o perfil.",
        );
      },
    });
  }
}
