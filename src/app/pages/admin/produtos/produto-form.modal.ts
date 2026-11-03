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
import { ProdutoApiService } from "src/app/services/http-services/produto.service";

@Component({
  selector: "app-produto-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./produto-form.modal.html",
})
export class ProdutoFormModal implements OnInit {
  public data = inject<{ id?: number }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<ProdutoFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private produtoService = inject(ProdutoApiService);
  private alertService = inject(AlertService);

  public salvando = false;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      nome: ["", Validators.required],
      categoria: [""],
      imagem: [""],
      valor: [0, [Validators.required, Validators.min(0)]],
      ingredientes: [""],
      prazo: [null as number | null, Validators.min(0)],
    });
  }

  ngOnInit(): void {
    if (this.data.id == null) {
      return;
    }
    this.produtoService.getProdutoById(this.data.id).subscribe({
      next: (produto) => this.form.patchValue(produto),
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o produto.",
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
      ...value,
      nome: String(value.nome).trim(),
      categoria: String(value.categoria).trim() || undefined,
      imagem: String(value.imagem).trim() || undefined,
      ingredientes: String(value.ingredientes).trim() || undefined,
    };
    const request$ =
      this.data.id == null
        ? this.produtoService.create(request)
        : this.produtoService.update(this.data.id, request);
    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.salvando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível salvar o produto.",
        );
      },
    });
  }
}
