import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { TablerIconsModule } from "angular-tabler-icons";
import {
  CATEGORIAS_PRODUTO,
  CategoriaProdutoEnum,
  fromCategoriaProdutoEnumValue,
} from "src/app/enums/categoria-produto.enum";
import { MaterialModule } from "src/app/material.module";
import { ProdutoDTO } from "src/app/model/produtos.dto";
import { AlertService } from "src/app/services/alert.service";
import { ProdutoApiService } from "src/app/services/http-services/produto.service";
import { resolverUrlImagem } from "src/app/utils/imagem.util";
import { ProdutoFormModal } from "./produto-form.modal";

@Component({
  selector: "app-produtos",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    TablerIconsModule,
  ],
  templateUrl: "./produtos.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProdutosPage implements OnInit {
  private produtoService = inject(ProdutoApiService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);

  public produtos: ProdutoDTO[] = [];
  public carregando = false;
  public pageIndex = 0;
  public readonly pageSize = 10;
  public totalElements = 0;
  public filtroForm: FormGroup;
  public readonly categorias = CATEGORIAS_PRODUTO;

  constructor() {
    this.filtroForm = this.formBuilder.nonNullable.group({
      nome: [""],
      categoria: [null as CategoriaProdutoEnum | null],
    });
  }

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.produtoService
      .getProdutosPage(
        this.filtroForm.getRawValue(),
        this.pageIndex,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          if (response.content.length === 0 && this.pageIndex > 0) {
            this.pageIndex--;
            this.carregarProdutos();
            return;
          }
          this.produtos = response.content;
          this.totalElements = response.totalElements;
          this.carregando = false;
        },
        error: (error) => {
          this.carregando = false;
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível carregar os produtos.",
          );
        },
      });
  }

  consultar(): void {
    this.pageIndex = 0;
    this.carregarProdutos();
  }

  limparFiltros(): void {
    this.filtroForm.reset({ nome: "", categoria: null });
    this.pageIndex = 0;
    this.carregarProdutos();
  }

  paginar(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.carregarProdutos();
  }

  abrirCadastro(): void {
    this.abrirModal();
  }

  editar(produto: ProdutoDTO): void {
    if (produto.id != null) {
      this.abrirModal(produto.id);
    }
  }

  rotuloCategoria(produto: ProdutoDTO): string {
    return fromCategoriaProdutoEnumValue(produto.categoria) || "—";
  }

  urlImagem(produto: ProdutoDTO): string | null {
    return resolverUrlImagem(produto.imagem);
  }

  excluir(produto: ProdutoDTO): void {
    const produtoId = produto.id;
    if (produtoId == null) {
      return;
    }
    this.alertService.showConfirmation(
      "Excluir produto",
      `Deseja excluir o produto "${produto.nome}"?`,
      () => {
        this.produtoService.deleteById(produtoId).subscribe({
          next: () => {
            this.carregarProdutos();
            this.alertService.showToast("Produto excluído!");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ??
                "Não foi possível excluir o produto. Ele pode estar associado a pedidos.",
            ),
        });
      },
    );
  }

  private abrirModal(id?: number): void {
    this.dialog
      .open(ProdutoFormModal, {
        width: "640px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { id },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.carregarProdutos();
          this.alertService.showToast(
            id == null ? "Produto cadastrado!" : "Produto alterado!",
          );
        }
      });
  }
}
