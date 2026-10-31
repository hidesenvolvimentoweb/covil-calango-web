import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { MaterialModule } from "../../material.module";
import { CommonModule } from "@angular/common";
import { TablerIconsModule } from "angular-tabler-icons";
import { WebsocketService } from "src/app/services/http-services/websocket.service";
import { MatTableDataSource } from "@angular/material/table";
import { SolicitacaoService } from "src/app/services/http-services/solicitacao.service";
import { SolicitacaoDTO } from "src/app/model/solicitacao.dto";
import { HttpParams } from "@angular/common/http";
import {
  fromStatusSolicitacaoEnumValue,
  StatusSolicitacaoEnum,
} from "src/app/enums/status-solicitacao.enum";
import { AlertService } from "src/app/services/alert.service";

@Component({
  selector: "app-solicitacoes",
  imports: [MaterialModule, CommonModule, TablerIconsModule],
  templateUrl: "./solicitacoes.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class SolicitacoesPage implements OnInit {
  private websocketService = inject(WebsocketService);
  private solicitacaoService = inject(SolicitacaoService);
  private alertService = inject(AlertService);

  public displayedColumns: string[] = ["nome", "dataHora", "acoes"];
  public solicitacoes = new MatTableDataSource<any>([]);

  ngOnInit(): void {
    this.createWebSocketConnection();
    this.atualizarListaSolicitacoes();
  }

  createWebSocketConnection() {
    this.websocketService.createWebSocketConnection().subscribe(() => {
      this.websocketService
        .getClient()
        .subscribe(`/topic/solicitacoes`, () =>
          this.atualizarListaSolicitacoes(),
        );
    });
  }

  atualizarListaSolicitacoes() {
    this.solicitacaoService
      .getAllByParams(this.buildParams())
      .subscribe((res: any) => (this.solicitacoes.data = res));
  }

  removerSolicitacaoDaLista(solicitacao: SolicitacaoDTO) {
    const data = this.solicitacoes.data;
    const index = data.findIndex((item: any) => item.id === solicitacao.id);
    data.splice(index, 1);
    this.solicitacoes.data = data;
  }

  buildParams() {
    let params = new HttpParams();
    params = params.append(
      "status",
      fromStatusSolicitacaoEnumValue(StatusSolicitacaoEnum.EM_ANALISE),
    );
    return params;
  }

  aceitarSolicitacao(solicitacao: SolicitacaoDTO) {
    this.websocketService.send("/app/solicitacao/aceitar", solicitacao);
    this.removerSolicitacaoDaLista(solicitacao);
    this.alertService.showToast("Solicitação Aceita!");
  }

  recusarSolicitacao(solicitacao: SolicitacaoDTO) {
    this.websocketService.send("/app/solicitacao/recusar", solicitacao);
    this.removerSolicitacaoDaLista(solicitacao);
    this.alertService.showToast("Solicitação Recusada!", "warning");
  }
}
