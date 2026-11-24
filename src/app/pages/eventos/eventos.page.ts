import { Component, OnInit, ViewChild, ViewEncapsulation, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { FullCalendarComponent, FullCalendarModule } from "@fullcalendar/angular";
import {
  CalendarOptions,
  DateSelectArg,
  EventClickArg,
  EventInput,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import { TablerIconsModule } from "angular-tabler-icons";
import { corDoTipoEvento } from "src/app/enums/tipo-evento.enum";
import { MaterialModule } from "src/app/material.module";
import {
  CONFIGURACAO_EVENTO_PADRAO,
  EventoConfiguracaoDTO,
  diasAbertosFullCalendar,
  lojaFechadaNoDia,
} from "src/app/model/evento-configuracao.dto";
import { EventoDTO } from "src/app/model/evento.dto";
import { AlertService } from "src/app/services/alert.service";
import { EventoApiService } from "src/app/services/http-services/evento.service";
import { DetalharEventoModal, ResultadoDetalharEvento } from "./detalhar-evento.modal";
import { DadosEventoForm, EventoFormModal } from "./evento-form.modal";

@Component({
  selector: "app-eventos",
  imports: [MaterialModule, TablerIconsModule, FullCalendarModule],
  templateUrl: "./eventos.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class EventosPage implements OnInit {
  private eventoService = inject(EventoApiService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);

  @ViewChild(FullCalendarComponent) private calendario?: FullCalendarComponent;

  /** Montadas depois de carregar o funcionamento da loja (dias fechados e horário de abertura). */
  public opcoesCalendario?: CalendarOptions;
  private configuracao: EventoConfiguracaoDTO = CONFIGURACAO_EVENTO_PADRAO;

  ngOnInit(): void {
    this.eventoService.getConfiguracao().subscribe({
      next: (configuracao) => this.montarCalendario(configuracao),
      // Sem a configuração o calendário continua utilizável, com os padrões da loja.
      error: () => this.montarCalendario(CONFIGURACAO_EVENTO_PADRAO),
    });
  }

  novoEvento(): void {
    this.abrirFormulario({});
  }

  private montarCalendario(configuracao: EventoConfiguracaoDTO): void {
    this.configuracao = configuracao;
    this.opcoesCalendario = {
      plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
      locale: ptBrLocale,
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,listMonth",
      },
      height: "auto",
      dayMaxEvents: 3,
      // Blocos na cor do tipo também para os eventos com horário (o padrão do mês é um ponto azul).
      eventDisplay: "block",
      // A semana mostra das 8h à meia-noite, sem a linha "dia inteiro" (todo evento tem horário). A parte de um
      // evento que passa da meia-noite aparece no mês e na lista.
      views: { timeGridWeek: { slotMinTime: "08:00:00" } },
      allDaySlot: false,
      nowIndicator: true,
      eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
      // Expediente da loja: os dias fechados e os horários antes da abertura ficam sombreados.
      businessHours: {
        daysOfWeek: diasAbertosFullCalendar(configuracao),
        startTime: configuracao.horaAbertura,
        endTime: "24:00",
      },
      dayCellClassNames: (dia) =>
        lojaFechadaNoDia(configuracao, dia.date) ? ["eventos-dia-fechado"] : [],
      // Clicar ou arrastar em um dia/horário livre abre o cadastro com esse período (exceto nos dias fechados).
      selectable: true,
      selectMirror: true,
      selectAllow: (selecao) => !lojaFechadaNoDia(configuracao, selecao.start),
      select: (selecao) => this.selecionarPeriodo(selecao),
      eventClick: (clique) => this.abrirEvento(clique),
      events: (periodo, sucesso, falha) => this.carregarEventos(periodo, sucesso, falha),
    };
  }

  private carregarEventos(
    periodo: EventSourceFuncArg,
    sucesso: (eventos: EventInput[]) => void,
    falha: (erro: Error) => void,
  ): void {
    this.eventoService.getEventos(periodo.start, periodo.end).subscribe({
      next: (eventos) => sucesso(eventos.map((evento) => this.paraCalendario(evento))),
      error: (error) => {
        falha(error);
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar os eventos.",
        );
      },
    });
  }

  private paraCalendario(evento: EventoDTO): EventInput {
    const cor = corDoTipoEvento(evento.tipo);
    return {
      id: String(evento.id),
      title: evento.nome,
      start: evento.dataHoraInicio,
      end: evento.dataHoraFim,
      backgroundColor: cor,
      borderColor: cor,
      textColor: "#fff",
      extendedProps: { evento },
    };
  }

  /** Dia (ou horário, na semana) escolhido no calendário: a data fica fixa no cadastro. */
  private selecionarPeriodo(selecao: DateSelectArg): void {
    selecao.view.calendar.unselect();
    this.abrirFormulario({
      inicio: selecao.start,
      fim: selecao.allDay ? undefined : selecao.end,
      dataFixa: true,
    });
  }

  private abrirEvento(clique: EventClickArg): void {
    const evento = clique.event.extendedProps["evento"] as EventoDTO;
    this.dialog
      .open<DetalharEventoModal, { evento: EventoDTO }, ResultadoDetalharEvento>(DetalharEventoModal, {
        width: "640px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { evento },
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado === "alterar") {
          this.abrirFormulario({ id: evento.id });
        } else if (resultado === "excluido") {
          this.atualizarCalendario();
          this.alertService.showToast("Evento excluído!");
        }
      });
  }

  private abrirFormulario(dados: Omit<DadosEventoForm, "configuracao">): void {
    this.dialog
      .open<EventoFormModal, DadosEventoForm, boolean>(EventoFormModal, {
        width: "640px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { ...dados, configuracao: this.configuracao },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.atualizarCalendario();
          this.alertService.showToast(dados.id == null ? "Evento cadastrado!" : "Evento alterado!");
        }
      });
  }

  private atualizarCalendario(): void {
    this.calendario?.getApi().refetchEvents();
  }
}
