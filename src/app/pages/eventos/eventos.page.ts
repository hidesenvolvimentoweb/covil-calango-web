import { Component, ViewChild, ViewEncapsulation, inject } from "@angular/core";
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
import { EventoDTO } from "src/app/model/evento.dto";
import { AlertService } from "src/app/services/alert.service";
import { EventoApiService } from "src/app/services/http-services/evento.service";
import { DetalharEventoModal, ResultadoDetalharEvento } from "./detalhar-evento.modal";
import { EventoFormModal } from "./evento-form.modal";

@Component({
  selector: "app-eventos",
  imports: [MaterialModule, TablerIconsModule, FullCalendarModule],
  templateUrl: "./eventos.page.html",
  encapsulation: ViewEncapsulation.None,
})
export class EventosPage {
  private eventoService = inject(EventoApiService);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);

  @ViewChild(FullCalendarComponent) private calendario?: FullCalendarComponent;

  public readonly opcoesCalendario: CalendarOptions = {
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
    // Clicar ou arrastar em um dia/horário livre abre o cadastro com esse período.
    selectable: true,
    selectMirror: true,
    select: (selecao) => this.selecionarPeriodo(selecao),
    eventClick: (clique) => this.abrirEvento(clique),
    events: (periodo, sucesso, falha) => this.carregarEventos(periodo, sucesso, falha),
  };

  novoEvento(): void {
    this.abrirFormulario();
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

  private selecionarPeriodo(selecao: DateSelectArg): void {
    selecao.view.calendar.unselect();
    this.abrirFormulario(undefined, selecao.start, selecao.allDay ? undefined : selecao.end);
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
          this.abrirFormulario(evento.id);
        } else if (resultado === "excluido") {
          this.atualizarCalendario();
          this.alertService.showToast("Evento excluído!");
        }
      });
  }

  private abrirFormulario(id?: number, inicio?: Date, fim?: Date): void {
    this.dialog
      .open(EventoFormModal, {
        width: "640px",
        maxWidth: "95vw",
        panelClass: "admin-form-dialog",
        data: { id, inicio, fim },
      })
      .afterClosed()
      .subscribe((salvo) => {
        if (salvo) {
          this.atualizarCalendario();
          this.alertService.showToast(id == null ? "Evento cadastrado!" : "Evento alterado!");
        }
      });
  }

  private atualizarCalendario(): void {
    this.calendario?.getApi().refetchEvents();
  }
}
