import { Component, Input, ViewEncapsulation, inject } from "@angular/core";
import { ComandaDTO } from "src/app/model/comanda.dto";
import { TablerIconsModule } from "angular-tabler-icons";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "src/app/material.module";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { PedidoDTO } from "src/app/model/pedido.dto";
import { ComandaService } from "src/app/services/http-services/comanda.service";
import { AlertService } from "src/app/services/alert.service";
import { PagamentoService } from "src/app/services/http-services/pagamento.service";
import { fromMetodoPagamentoEnumValue, StatusPagamentoEnum } from "src/app/enums/status-pagamento.enum";
import { UserStateService } from "src/app/services/user.service";
import { StatusPagamentoComponent } from "src/app/components/status-pagamento/status-pagamento.component";
import { escolherFormaPagamento } from "../fechar-comanda.util";
import { fromFormaPagamentoEnumValue } from "src/app/enums/forma-pagamento.enum";
import {
  fromStatusComandaEnumValue,
  StatusComandaEnum,
} from "src/app/enums/status-comanda.enum";

@Component({
  selector: "app-comandas",
  imports: [CommonModule, MaterialModule, TablerIconsModule, StatusPagamentoComponent],
  templateUrl: "./detalhar-comanda.modal.html",
  encapsulation: ViewEncapsulation.None,
})
export class DetalharComandaModal {
  private activeModal = inject(NgbActiveModal);
  private comandaService = inject(ComandaService);
  private pagamentoService = inject(PagamentoService);
  private alertService = inject(AlertService);
  private userStateService = inject(UserStateService);

  @Input()
  public comanda: ComandaDTO;

  @Input()
  public pedidos: PedidoDTO[] = [];

  get pixPendente(): boolean {
    return this.comanda?.ultimoPagamento?.status === StatusPagamentoEnum.PENDENTE;
  }

  get fechada(): boolean {
    return this.comanda?.status === fromStatusComandaEnumValue(StatusComandaEnum.FECHADA);
  }

  /** Forma de pagamento registrada no fechamento (ex.: "Dinheiro"); vazia se não informada. */
  get formaPagamento(): string {
    return fromFormaPagamentoEnumValue(this.comanda?.formaPagamento);
  }

  get pago(): boolean {
    return this.comanda?.ultimoPagamento?.status === StatusPagamentoEnum.PAGO;
  }

  /** Ex.: "Cartão de débito •••• 4242", "PIX" ou "Conta do Mercado Pago (crédito) •••• 1234". */
  get meioPagamento(): string {
    const pagamento = this.comanda?.ultimoPagamento;
    const tipo = pagamento?.cartaoTipo === "DEBITO" ? "débito" : pagamento?.cartaoTipo === "CREDITO" ? "crédito" : "";
    const nome = fromMetodoPagamentoEnumValue(pagamento?.metodo);
    const metodo = !tipo ? nome : nome === "Cartão" ? `Cartão de ${tipo}` : `${nome} (${tipo})`;
    return pagamento?.cartaoFinal ? `${metodo} •••• ${pagamento.cartaoFinal}` : metodo;
  }

  /** Estorno devolve dinheiro ao cliente: só o administrador (a API confere de novo). */
  get podeEstornar(): boolean {
    return this.pago && this.userStateService.hasProfile("ROLE_ADMINISTRADOR");
  }

  estornar() {
    const pagamento = this.comanda?.ultimoPagamento;
    if (!pagamento?.id) {
      return;
    }
    this.alertService.showConfirmation(
      "Estornar o pagamento?",
      `O valor de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pagamento.valor ?? 0)} ` +
        "volta para o cliente pelo Mercado Pago e a comanda é reaberta, para ser fechada com a forma correta ou ter os pedidos cancelados.",
      () => {
        this.pagamentoService.estornar(pagamento.id!).subscribe({
          next: () => {
            this.alertService.showToast("Pagamento estornado! A comanda foi reaberta.");
            this.close(true);
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível estornar o pagamento.",
            ),
        });
      },
    );
  }

  close(refresh: boolean = false) {
    this.activeModal.close(refresh);
  }

  /** Cancela o PIX do cliente (ex.: ele vai pagar no balcão ou quer fazer mais pedidos). */
  cancelarPix() {
    this.alertService.showConfirmation(
      "Cancelar o pagamento?",
      "O pagamento em andamento no app deixará de valer e o cliente poderá voltar a fazer pedidos.",
      () => {
        const numero = this.comanda.numero;
        if (numero == null) {
          return;
        }
        this.pagamentoService.cancelarPix(numero).subscribe({
          next: (pagamento) => {
            this.comanda.ultimoPagamento = pagamento;
            if (pagamento.status === StatusPagamentoEnum.PAGO) {
              this.alertService.showSuccess(
                "Pagamento já aprovado",
                "O cliente pagou antes do cancelamento. A comanda foi encerrada.",
              );
              this.close(true);
              return;
            }
            this.alertService.showToast("Pagamento cancelado!");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível cancelar o pagamento.",
            ),
        });
      },
    );
  }

  fecharComanda() {
    escolherFormaPagamento(this.alertService, this.comanda, (forma) => {
      this.comandaService.fecharComanda(this.comanda.numero, forma).subscribe({
        next: () => {
          this.alertService.showToast(
            `Comanda ${this.comanda.numero} fechada: pago (${fromFormaPagamentoEnumValue(forma)})!`,
          );
          this.close(true);
        },
        error: (error) => {
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível fechar a comanda.",
          );
          this.close(true);
        },
      });
    });
  }
}
