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
import { StatusPagamentoEnum } from "src/app/enums/status-pagamento.enum";
import { StatusPagamentoComponent } from "src/app/components/status-pagamento/status-pagamento.component";
import { mensagemFecharComanda } from "../fechar-comanda.util";

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

  @Input()
  public comanda: ComandaDTO;

  @Input()
  public pedidos: PedidoDTO[] = [];

  get pixPendente(): boolean {
    return this.comanda?.ultimoPagamento?.status === StatusPagamentoEnum.PENDENTE;
  }

  get pago(): boolean {
    return this.comanda?.ultimoPagamento?.status === StatusPagamentoEnum.PAGO;
  }

  close(refresh: boolean = false) {
    this.activeModal.close(refresh);
  }

  /** Cancela o PIX do cliente (ex.: ele vai pagar no balcão ou quer fazer mais pedidos). */
  cancelarPix() {
    this.alertService.showConfirmation(
      "Cancelar PIX?",
      "O código PIX do cliente deixará de valer e ele poderá voltar a fazer pedidos.",
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
                "PIX já pago",
                "O cliente pagou antes do cancelamento. A comanda foi encerrada.",
              );
              this.close(true);
              return;
            }
            this.alertService.showToast("PIX cancelado!");
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível cancelar o PIX.",
            ),
        });
      },
    );
  }

  fecharComanda() {
    this.alertService.showConfirmation(
      "Alerta!",
      mensagemFecharComanda(this.comanda),
      () => {
        this.comandaService.fecharComanda(this.comanda.numero).subscribe({
          next: () => {
            this.alertService.showToast(`Comanda ${this.comanda.numero} fechada com sucesso!`);
            this.close(true);
          },
          error: (error) =>
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível fechar a comanda.",
            ),
        });
      },
    );
  }
}
