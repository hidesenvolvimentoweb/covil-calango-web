import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { Observable, of, switchMap } from "rxjs";
import {
  CATEGORIAS_PRODUTO,
  CategoriaProdutoEnum,
} from "src/app/enums/categoria-produto.enum";
import { MaterialModule } from "src/app/material.module";
import { ProdutoDTO } from "src/app/model/produtos.dto";
import { AlertService } from "src/app/services/alert.service";
import { ProdutoApiService } from "src/app/services/http-services/produto.service";
import { resolverUrlImagem } from "src/app/utils/imagem.util";

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
const TIPOS_IMAGEM_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

@Component({
  selector: "app-produto-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./produto-form.modal.html",
})
export class ProdutoFormModal implements OnInit, OnDestroy {
  public data = inject<{ id?: number }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<ProdutoFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private produtoService = inject(ProdutoApiService);
  private alertService = inject(AlertService);

  public readonly tiposAceitos = TIPOS_IMAGEM_ACEITOS.join(",");
  public readonly categorias = CATEGORIAS_PRODUTO;
  public salvando = false;
  public form: FormGroup;
  /** URL exibida na pré-visualização (imagem já salva ou arquivo recém-selecionado). */
  public previewImagem: string | null = null;

  private arquivoImagem?: File;
  private possuiImagemSalva = false;
  private removerImagemSalva = false;
  private previewLocal?: string;
  /** Depois de gravado, novas tentativas apenas reenviam a imagem. */
  private produtoIdSalvo?: number;

  constructor() {
    this.form = this.formBuilder.nonNullable.group({
      nome: ["", Validators.required],
      categoria: [CategoriaProdutoEnum.OUTROS, Validators.required],
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
      next: (produto) => {
        this.form.patchValue(produto);
        this.previewImagem = resolverUrlImagem(produto.imagem);
        this.possuiImagemSalva = !!this.previewImagem;
      },
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o produto.",
        );
        this.dialogRef.close(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.liberarPreviewLocal();
  }

  selecionarImagem(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    // Permite selecionar o mesmo arquivo novamente depois de removê-lo.
    input.value = "";
    if (!arquivo) {
      return;
    }
    if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.type)) {
      this.alertService.showError(
        "Erro",
        "Formato de imagem inválido. Envie um arquivo JPG, PNG ou WebP.",
      );
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      this.alertService.showError("Erro", "A imagem deve ter no máximo 5 MB.");
      return;
    }
    this.liberarPreviewLocal();
    this.arquivoImagem = arquivo;
    this.removerImagemSalva = false;
    this.previewLocal = URL.createObjectURL(arquivo);
    this.previewImagem = this.previewLocal;
  }

  removerImagem(): void {
    this.liberarPreviewLocal();
    this.arquivoImagem = undefined;
    this.previewImagem = null;
    this.removerImagemSalva = this.possuiImagemSalva;
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
      ingredientes: String(value.ingredientes).trim() || undefined,
    };
    const id = this.produtoIdSalvo ?? this.data.id;
    const produto$ =
      id == null
        ? this.produtoService.create(request)
        : this.produtoService.update(id, request);
    produto$
      .pipe(
        switchMap((produto) => {
          this.produtoIdSalvo = produto.id;
          return this.sincronizarImagem(produto);
        }),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error) => {
          this.salvando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ??
              (this.produtoIdSalvo != null
                ? "O produto foi salvo, mas não foi possível enviar a imagem."
                : "Não foi possível salvar o produto."),
          );
        },
      });
  }

  private sincronizarImagem(produto: ProdutoDTO): Observable<ProdutoDTO> {
    if (this.arquivoImagem) {
      return this.produtoService.uploadImagem(produto.id!, this.arquivoImagem);
    }
    if (this.removerImagemSalva) {
      return this.produtoService.removerImagem(produto.id!);
    }
    return of(produto);
  }

  private liberarPreviewLocal(): void {
    if (this.previewLocal) {
      URL.revokeObjectURL(this.previewLocal);
      this.previewLocal = undefined;
    }
  }
}
