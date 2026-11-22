import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { MaterialModule } from "../../material.module";
import { MatTableDataSource } from "@angular/material/table";
import { ComandaDTO } from "src/app/model/comanda.dto";
import { TablerIconsModule } from "angular-tabler-icons";
import { CommonModule } from "@angular/common";
import { ComandaService } from "src/app/services/http-services/comanda.service";
import { AlertService } from "src/app/services/alert.service";
import { lastValueFrom } from "rxjs";
import { HttpParams } from "@angular/common/http";
import {
  fromStatusComandaEnumValue,
  StatusComandaEnum,
} from "src/app/enums/status-comanda.enum";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DetalharComandaModal } from "./detalhar-comanda-modal/detalhar-comanda.modal";
import { WebsocketService } from "src/app/services/http-services/websocket.service";
import { TOPICO_PAGAMENTOS } from "src/app/services/http-services/pagamento.service";
import { PagamentoDTO } from "src/app/model/pagamento.dto";
import { StatusPagamentoEnum } from "src/app/enums/status-pagamento.enum";
import { StatusPagamentoComponent } from "src/app/components/status-pagamento/status-pagamento.component";
import { StompSubscription } from "@stomp/stompjs";
import { mensagemFecharComanda } from "./fechar-comanda.util";

@Component({
  selector: "app-comandas",
  imports: [CommonModule, MaterialModule, TablerIconsModule, StatusPagamentoComponent],
  templateUrl: "./comandas.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class ComandasPage implements OnInit, OnDestroy {
  private comandaService = inject(ComandaService);
  private alertService = inject(AlertService);
  private modalService = inject(NgbModal);
  private websocketService = inject(WebsocketService);
  private inscricaoPagamentos?: StompSubscription;

  public displayedColumns: string[] = [
    "numero",
    "cliente",
    "horaEntrada",
    "valorTotal",
    "pagamento",
    "acoes",
  ];
  public comandasAbertas = new MatTableDataSource<ComandaDTO>([]);

  ngOnInit() {
    this.obterComandasAbertas();
    this.escutarPagamentos();
  }

  ngOnDestroy() {
    this.inscricaoPagamentos?.unsubscribe();
  }

  async obterComandasAbertas() {
    this.comandasAbertas.data = await lastValueFrom(
      this.comandaService.getAllByParams(this.buildParams()),
    );
  }

  /**
   * Acompanha os pagamentos pelo app em tempo real: o status muda na tabela e, com o PIX aprovado,
   * a comanda (fechada pela API) sai da lista.
   */
  escutarPagamentos() {
    this.websocketService.createWebSocketConnection().subscribe(() => {
      this.inscricaoPagamentos = this.websocketService
        .getClient()
        .subscribe(TOPICO_PAGAMENTOS, (mensagem) => {
          const pagamento: PagamentoDTO = JSON.parse(mensagem.body);
          if (pagamento.status === StatusPagamentoEnum.PAGO) {
            this.alertService.showToast(`Comanda ${pagamento.comanda} paga via PIX!`);
          }
          this.obterComandasAbertas();
        });
    });
  }

  buildParams() {
    let params = new HttpParams();
    params = params.append(
      "status",
      fromStatusComandaEnumValue(StatusComandaEnum.ABERTA),
    );
    const localDate = new Date();
    localDate.setHours(0, 0, 0, 0);
    params = params.append("dataHoraEntrada", localDate.toISOString());
    return params;
  }

  abrirModalDetalharComanda(comanda: ComandaDTO) {
    this.comandaService.getByNumero(comanda.numero).subscribe({
      next: (res) => {
        const modalRef = this.modalService.open(DetalharComandaModal, {
          animation: true,
          size: "lg",
        });
        modalRef.componentInstance.comanda = res;
        modalRef.result.then((r) => {
          if (r) {
            this.obterComandasAbertas();
          }
        });
      },
      error: (error) =>
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar a comanda.",
        ),
    });
  }

  fecharComanda(comanda: ComandaDTO) {
    this.alertService.showConfirmation(
      "Alerta!",
      mensagemFecharComanda(comanda),
      () => {
        this.comandaService.fecharComanda(comanda.numero).subscribe({
          next: () => {
            this.alertService.showSuccess(
              "Sucesso!",
              `Comanda ${comanda.numero} fechada com sucesso!`,
            );
            this.obterComandasAbertas();
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
