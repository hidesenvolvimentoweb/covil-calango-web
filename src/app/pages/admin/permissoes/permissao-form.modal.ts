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
import { PermissaoApiService } from "src/app/services/http-services/permissao.service";

@Component({
  selector: "app-permissao-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./permissao-form.modal.html",
})
export class PermissaoFormModal implements OnInit {

  public data = inject<{
    id?: number;
  }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<PermissaoFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private permissaoService = inject(PermissaoApiService);
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
    this.permissaoService.getPermissaoById(this.data.id).subscribe({
      next: (permissao) => this.form.patchValue({ name: permissao.name }),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar a permissão.",
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
        ? this.permissaoService.create(request)
        : this.permissaoService.update(this.data.id, request);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.salvando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível salvar a permissão.",
        );
      },
    });
  }
}
