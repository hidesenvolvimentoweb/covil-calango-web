import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { MaterialModule } from "../../material.module";
import { MatTableDataSource } from "@angular/material/table";
import { ComandaDTO } from "src/app/model/comanda.dto";
import { TablerIconsModule } from "angular-tabler-icons";
import { CommonModule } from "@angular/common";
import { ComandaService } from "src/app/services/http-services/comanda.service";
import { AlertService } from "src/app/services/alert.service";
import {
  EMPTY,
  lastValueFrom,
  Subject,
  Subscription,
  catchError,
  debounceTime,
  switchMap,
} from "rxjs";
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
import { escolherFormaPagamento } from "./fechar-comanda.util";
import { fromFormaPagamentoEnumValue } from "src/app/enums/forma-pagamento.enum";
import { CardPedidosComponent } from "src/app/components/card-pedidos/card-pedidos.component";

/** Tópico da equipe com as alterações de comandas (API: ComandaNotificacaoService). */
const TOPICO_COMANDAS = "/topic/comandas";
/** Junta eventos próximos em uma única consulta. */
const ATRASO_ATUALIZACAO_MS = 300;

@Component({
  selector: "app-comandas",
  imports: [
    CommonModule,
    MaterialModule,
    TablerIconsModule,
    StatusPagamentoComponent,
    CardPedidosComponent,
  ],
  templateUrl: "./comandas.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class ComandasPage implements OnInit, OnDestroy {
  private comandaService = inject(ComandaService);
  private alertService = inject(AlertService);
  private modalService = inject(NgbModal);
  private websocketService = inject(WebsocketService);
  private inscricaoPagamentos?: StompSubscription;
  private inscricaoComandas?: StompSubscription;
  private inscricaoAtualizacoes?: Subscription;
  private atualizacoes$ = new Subject<void>();

  public readonly colunasAbertas: string[] = [
    "numero",
    "cliente",
    "horaEntrada",
    "valorTotal",
    "pagamento",
    "acoes",
  ];
  public readonly colunasEmAnalise: string[] = [
    "numero",
    "cliente",
    "horaEntrada",
    "acoes",
  ];
  public readonly colunasFechadas: string[] = [
    "numero",
    "cliente",
    "horaEntrada",
    "horaSaida",
    "valorTotal",
    "pagamento",
    "acoes",
  ];
  public comandasAbertas = new MatTableDataSource<ComandaDTO>([]);
  public comandasEmAnalise = new MatTableDataSource<ComandaDTO>([]);
  public comandasFechadas = new MatTableDataSource<ComandaDTO>([]);

  ngOnInit() {
    this.obterComandas();
    // Eventos em sequência (ex.: fechar a comanda cancela o PIX e fecha) viram uma única consulta; switchMap
    // descarta respostas antigas, para a tela nunca voltar a um estado anterior.
    this.inscricaoAtualizacoes = this.atualizacoes$
      .pipe(
        debounceTime(ATRASO_ATUALIZACAO_MS),
        switchMap(() =>
          this.comandaService
            .getAllByParams(this.buildParams())
            .pipe(catchError(() => EMPTY)),
        ),
      )
      .subscribe((comandas) => this.distribuirComandas(comandas));
    this.escutarAtualizacoes();
  }

  ngOnDestroy() {
    this.inscricaoPagamentos?.unsubscribe();
    this.inscricaoComandas?.unsubscribe();
    this.inscricaoAtualizacoes?.unsubscribe();
  }

  /** Busca as comandas do dia em todos os status e separa uma tabela para cada um (como na tela de pedidos). */
  async obterComandas() {
    this.distribuirComandas(
      await lastValueFrom(this.comandaService.getAllByParams(this.buildParams())),
    );
  }

  distribuirComandas(comandas: ComandaDTO[]) {
    const doStatus = (status: StatusComandaEnum) =>
      comandas.filter(
        (comanda) => comanda.status === fromStatusComandaEnumValue(status),
      );
    this.comandasAbertas.data = doStatus(StatusComandaEnum.ABERTA);
    this.comandasEmAnalise.data = doStatus(StatusComandaEnum.EM_ANALISE);
    // As fechadas mais recentes primeiro.
    this.comandasFechadas.data = doStatus(StatusComandaEnum.FECHADA).sort(
      (a, b) => this.horario(b.dataHoraSaida) - this.horario(a.dataHoraSaida),
    );
  }

  isFechada(comanda: ComandaDTO): boolean {
    return comanda.status === fromStatusComandaEnumValue(StatusComandaEnum.FECHADA);
  }

  /**
   * Atualiza a tela em tempo real:
   * - /topic/comandas: comanda aberta ou fechada e pedidos criados, cancelados ou excluídos (o valor muda);
   * - /topic/pagamentos: PIX gerado, pago, expirado ou cancelado. Com o PIX aprovado, a comanda (fechada pela
   *   API) passa para a tabela de fechadas.
   */
  escutarAtualizacoes() {
    this.websocketService.createWebSocketConnection().subscribe(() => {
      const client = this.websocketService.getClient();
      this.inscricaoComandas = client.subscribe(TOPICO_COMANDAS, () =>
        this.atualizacoes$.next(),
      );
      this.inscricaoPagamentos = client.subscribe(TOPICO_PAGAMENTOS, (mensagem) => {
        const pagamento: PagamentoDTO = JSON.parse(mensagem.body);
        if (pagamento.status === StatusPagamentoEnum.PAGO) {
          this.alertService.showToast(`Comanda ${pagamento.comanda} paga via PIX!`);
        }
        this.atualizacoes$.next();
      });
    });
  }

  buildParams() {
    let params = new HttpParams();
    [
      StatusComandaEnum.ABERTA,
      StatusComandaEnum.EM_ANALISE,
      StatusComandaEnum.FECHADA,
    ].forEach(
      (status) =>
        (params = params.append("status", fromStatusComandaEnumValue(status))),
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
            this.obterComandas();
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
    escolherFormaPagamento(this.alertService, comanda, (forma) => {
      this.comandaService.fecharComanda(comanda.numero, forma).subscribe({
        next: () => {
          this.alertService.showSuccess(
            "Sucesso!",
            `Comanda ${comanda.numero} fechada: pago (${fromFormaPagamentoEnumValue(forma)}).`,
          );
          this.obterComandas();
        },
        error: (error) => {
          this.alertService.showError(
            "Erro",
            error.error?.message ?? "Não foi possível fechar a comanda.",
          );
          // Ex.: o PIX foi pago no app enquanto a equipe fechava: a tela mostra a situação atual.
          this.obterComandas();
        },
      });
    });
  }

  private horario(data?: Date | string | null): number {
    return data ? new Date(data).getTime() : 0;
  }
}
