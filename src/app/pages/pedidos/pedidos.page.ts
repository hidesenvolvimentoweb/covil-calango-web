import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MaterialModule } from "../../material.module";
import { CardPedidosComponent } from "src/app/components/card-pedidos/card-pedidos.component";
import { TablerIconsModule } from "angular-tabler-icons";
import { MatTableDataSource } from "@angular/material/table";
import { PedidoService } from "src/app/services/http-services/pedidos.service";
import { PedidoDTO } from "src/app/model/pedido.dto";
import { HttpParams } from "@angular/common/http";
import { StatusPedidoEnum } from "src/app/enums/status-pedido.enum";
import { lastValueFrom } from "rxjs";
import { AlertService } from "src/app/services/alert.service";
import { WebsocketService } from "src/app/services/http-services/websocket.service";
import { StompSubscription } from "@stomp/stompjs";
import {
  CozinhaApiService,
  CozinhaDTO,
  TOPICO_COZINHA,
} from "src/app/services/http-services/cozinha.service";

@Component({
  selector: "app-pedidos",
  imports: [
    CommonModule,
    MaterialModule,
    CardPedidosComponent,
    TablerIconsModule,
  ],
  templateUrl: "./pedidos.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class PedidosPage implements OnInit, OnDestroy {
  private pedidoService = inject(PedidoService);
  private alertService = inject(AlertService);
  private websocketService = inject(WebsocketService);
  private cozinhaService = inject(CozinhaApiService);
  private inscricoes: StompSubscription[] = [];

  /** Nulo até a situação chegar da API. */
  public cozinhaAberta: boolean | null = null;
  public alterandoCozinha = false;

  public displayedColumns: string[] = [
    "pedido",
    "quantidade",
    "numero",
    "cliente",
    "hora",
    "acoes",
  ];
  public pedidosPendentes = new MatTableDataSource<PedidoDTO>([]);
  public pedidosEmAndamento = new MatTableDataSource<PedidoDTO>([]);
  public pedidosProntos = new MatTableDataSource<PedidoDTO>([]);

  ngOnInit() {
    this.carregarPedidos();
    this.carregarCozinha();
    this.createWebSocketConnection();
  }

  ngOnDestroy() {
    this.inscricoes.forEach((inscricao) => inscricao.unsubscribe());
  }

  createWebSocketConnection() {
    this.websocketService.createWebSocketConnection().subscribe(() => {
      const client = this.websocketService.getClient();
      this.inscricoes.push(
        client.subscribe(`/topic/pedidos`, () => this.carregarPedidos()),
        // Outro atendente abriu ou fechou a cozinha.
        client.subscribe(TOPICO_COZINHA, (mensagem) => {
          const cozinha: CozinhaDTO = JSON.parse(mensagem.body);
          this.cozinhaAberta = cozinha.aberta;
        }),
      );
    });
  }

  carregarCozinha() {
    this.cozinhaService.getSituacao().subscribe({
      next: (cozinha) => (this.cozinhaAberta = cozinha.aberta),
      error: () => (this.cozinhaAberta = null),
    });
  }

  /** Abre ou fecha a cozinha: fechada, os itens "Preparado na cozinha" ficam indisponíveis no cardápio. */
  alternarCozinha() {
    if (this.cozinhaAberta === null || this.alterandoCozinha) {
      return;
    }
    const abrir = !this.cozinhaAberta;
    this.alertService.showConfirmation(
      abrir ? "Abrir a cozinha?" : "Fechar a cozinha?",
      abrir
        ? "Os clientes voltam a pedir os itens preparados na cozinha."
        : "Os clientes não poderão mais pedir os itens preparados na cozinha (hambúrgueres, batatas...). Os pedidos já feitos continuam na fila.",
      () => {
        this.alterandoCozinha = true;
        this.cozinhaService.definirAberta(abrir).subscribe({
          next: (cozinha) => {
            this.alterandoCozinha = false;
            this.cozinhaAberta = cozinha.aberta;
            if (cozinha.aberta) {
              this.alertService.showToast("Cozinha aberta!");
            } else {
              this.alertService.showToast("Cozinha fechada!", "warning");
            }
          },
          error: (error) => {
            this.alterandoCozinha = false;
            this.alertService.showError(
              "Erro",
              error.error?.message ?? "Não foi possível alterar a cozinha.",
            );
          },
        });
      },
    );
  }

  async carregarPedidos() {
    const params = this.buildParams([
      StatusPedidoEnum.SOLICITADO,
      StatusPedidoEnum.EM_ANDAMENTO,
      StatusPedidoEnum.PRONTO,
    ]);
    const pedidos = await lastValueFrom(
      this.pedidoService.getAllByParams(params),
    );
    this.pedidosPendentes.data = pedidos.filter(
      (p) => p.status === StatusPedidoEnum.SOLICITADO,
    );
    this.pedidosEmAndamento.data = pedidos.filter(
      (p) => p.status === StatusPedidoEnum.EM_ANDAMENTO,
    );
    this.pedidosProntos.data = pedidos.filter(
      (p) => p.status === StatusPedidoEnum.PRONTO,
    );
  }

  buildParams(status: StatusPedidoEnum[]) {
    let params = new HttpParams();
    status.forEach((s) => (params = params.append("status", s)));
    const localDate = new Date();
    localDate.setHours(0, 0, 0, 0);
    params = params.append("dataHora", localDate.toISOString());
    return params;
  }

  private mostrarErro(error: any) {
    this.alertService.showError(
      "Erro",
      error.error?.message ?? "Não foi possível atualizar o pedido.",
    );
  }

  aceitarPedido(pedido: PedidoDTO) {
    this.pedidoService.aceitarPedido(pedido.id!).subscribe({
      next: () =>
        this.carregarPedidos().then(() =>
          this.alertService.showToast("Pedido Aceito!"),
        ),
      error: (error) => this.mostrarErro(error),
    });
  }

  cancelarPedido(pedido: PedidoDTO) {
    this.alertService.showConfirmation(
      "Alerta!",
      "Tem certeza que deseja cancelar o pedido?",
      () => {
        this.pedidoService.cancelarPedido(pedido.id!).subscribe({
          next: () =>
            this.carregarPedidos().then(() =>
              this.alertService.showToast("Pedido Cancelado!", "warning"),
            ),
          error: (error) => this.mostrarErro(error),
        });
      },
    );
  }

  concluirPedido(pedido: PedidoDTO) {
    this.pedidoService.concluirPedido(pedido.id!).subscribe({
      next: () =>
        this.carregarPedidos().then(() =>
          this.alertService.showToast("Pedido Pronto!"),
        ),
      error: (error) => this.mostrarErro(error),
    });
  }

  finalizarPedido(pedido: PedidoDTO) {
    this.pedidoService.finalizarPedido(pedido.id!).subscribe({
      next: () =>
        this.carregarPedidos().then(() =>
          this.alertService.showToast("Pedido Finalizado!"),
        ),
      error: (error) => this.mostrarErro(error),
    });
  }
}
