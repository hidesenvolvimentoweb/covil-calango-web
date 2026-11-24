import { DatePipe } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TablerIconsModule } from "angular-tabler-icons";
import { TIPOS_EVENTO, TipoEventoEnum } from "src/app/enums/tipo-evento.enum";
import { MaterialModule } from "src/app/material.module";
import {
  EventoConfiguracaoDTO,
  comHoraAbertura,
  lojaFechadaNoDia,
} from "src/app/model/evento-configuracao.dto";
import { EventoRequestDTO } from "src/app/model/evento.dto";
import { AlertService } from "src/app/services/alert.service";
import { EventoApiService } from "src/app/services/http-services/evento.service";
import { formatarDataHoraLocal } from "src/app/utils/data-hora.util";

export const TAMANHO_MAXIMO_DESCRICAO_EVENTO = 2000;

export interface DadosEventoForm {
  /** Evento a alterar; vazio para cadastrar. */
  id?: number;
  /** Período selecionado no calendário (na visão de mês, só o dia). */
  inicio?: Date;
  fim?: Date;
  /** A data veio do clique no calendário: só os horários podem ser escolhidos. */
  dataFixa?: boolean;
  configuracao: EventoConfiguracaoDTO;
}

const minutosDoDia = (hora: Date): number => hora.getHours() * 60 + hora.getMinutes();

/** Um evento não pode começar e terminar no mesmo horário (fim antes do início = termina no dia seguinte). */
const periodoValidator = (grupo: AbstractControl): ValidationErrors | null => {
  const inicio: Date | null = grupo.get("horaInicio")?.value;
  const fim: Date | null = grupo.get("horaFim")?.value;
  return inicio && fim && minutosDoDia(fim) === minutosDoDia(inicio) ? { periodoInvalido: true } : null;
};

/** Data do dia com o horário escolhido no timepicker. */
const combinarDataHora = (data: Date, hora: Date): Date =>
  new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora.getHours(), hora.getMinutes());

const mesmoDia = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

@Component({
  selector: "app-evento-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule, DatePipe],
  templateUrl: "./evento-form.modal.html",
})
export class EventoFormModal implements OnInit {
  public data = inject<DadosEventoForm>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<EventoFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private eventoService = inject(EventoApiService);
  private alertService = inject(AlertService);

  public readonly tipos = TIPOS_EVENTO;
  public readonly tamanhoMaximoDescricao = TAMANHO_MAXIMO_DESCRICAO_EVENTO;
  public readonly intervaloHorarios = `${this.data.configuracao.intervaloHorariosMinutos}m`;
  public readonly mostrarData = !this.data.dataFixa;
  public salvando = false;
  public form: FormGroup;
  /** Dia do evento em alteração: continua aceito mesmo que a loja passe a não abrir nele. */
  private dataOriginal?: Date;

  /** O datepicker não oferece os dias em que a loja não abre. */
  public readonly diaPermitido = (data: Date | null): boolean =>
    !data ||
    !lojaFechadaNoDia(this.data.configuracao, data) ||
    (!!this.dataOriginal && mesmoDia(data, this.dataOriginal));

  constructor() {
    this.form = this.formBuilder.group(
      {
        nome: ["", Validators.required],
        tipo: [TipoEventoEnum.TORNEIO, Validators.required],
        data: [null as Date | null, Validators.required],
        horaInicio: [null as Date | null, Validators.required],
        horaFim: [null as Date | null, Validators.required],
        valorInscricao: [null as number | null, Validators.min(0)],
        vagas: [null as number | null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
        descricao: [""],
      },
      { validators: periodoValidator },
    );
  }

  /** O evento passa da meia-noite: o fim escolhido é antes do início. */
  get terminaNoDiaSeguinte(): boolean {
    const inicio: Date | null = this.form.get("horaInicio")?.value;
    const fim: Date | null = this.form.get("horaFim")?.value;
    return !!inicio && !!fim && minutosDoDia(fim) < minutosDoDia(inicio);
  }

  ngOnInit(): void {
    if (this.data.id == null) {
      this.sugerirPeriodo();
      return;
    }
    this.eventoService.getEventoById(this.data.id).subscribe({
      next: (evento) => {
        // A API envia a hora local sem fuso ("2026-11-28T19:00:00"): new Date() a interpreta como local.
        const inicio = new Date(evento.dataHoraInicio!);
        this.dataOriginal = inicio;
        this.form.patchValue({
          ...evento,
          descricao: evento.descricao ?? "",
          data: inicio,
          horaInicio: inicio,
          horaFim: new Date(evento.dataHoraFim!),
        });
      },
      error: (error) => {
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível carregar o evento.",
        );
        this.dialogRef.close(false);
      },
    });
  }

  salvar(): void {
    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const value = this.form.getRawValue();
    const inicio = combinarDataHora(value.data, value.horaInicio);
    const fim = combinarDataHora(value.data, value.horaFim);
    if (fim <= inicio) {
      fim.setDate(fim.getDate() + 1);
    }
    const request: EventoRequestDTO = {
      nome: String(value.nome).trim(),
      tipo: value.tipo,
      descricao: String(value.descricao ?? "").trim() || undefined,
      dataHoraInicio: formatarDataHoraLocal(inicio),
      dataHoraFim: formatarDataHoraLocal(fim),
      // Campos vazios: evento gratuito e sem limite de vagas.
      valorInscricao: this.numeroOuNulo(value.valorInscricao),
      vagas: this.numeroOuNulo(value.vagas),
    };
    const evento$ =
      this.data.id == null
        ? this.eventoService.create(request)
        : this.eventoService.update(this.data.id, request);
    evento$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.salvando = false;
        this.alertService.showError(
          "Erro",
          error.error?.message ?? "Não foi possível salvar o evento.",
        );
      },
    });
  }

  /**
   * Evento novo: o dia clicado no calendário (ou o próximo dia de funcionamento, pelo botão "Novo evento"), das
   * horas de abertura da loja até a duração padrão. Na visão de semana, usa os horários selecionados.
   */
  private sugerirPeriodo(): void {
    const configuracao = this.data.configuracao;
    let inicio = this.data.inicio ? new Date(this.data.inicio) : this.proximoDiaAberto(new Date());
    let fim = this.data.fim ? new Date(this.data.fim) : undefined;
    if (!fim) {
      inicio = comHoraAbertura(configuracao, inicio);
    }
    if (!fim || fim <= inicio) {
      fim = new Date(inicio.getTime() + configuracao.duracaoPadraoMinutos * 60 * 1000);
    }
    this.form.patchValue({ data: inicio, horaInicio: inicio, horaFim: fim });
  }

  private proximoDiaAberto(data: Date): Date {
    const dia = new Date(data);
    // Uma semana inteira fechada (parâmetro mal configurado) não trava o cadastro: fica o dia de hoje.
    for (let tentativa = 0; tentativa < 7 && lojaFechadaNoDia(this.data.configuracao, dia); tentativa++) {
      dia.setDate(dia.getDate() + 1);
    }
    return lojaFechadaNoDia(this.data.configuracao, dia) ? data : dia;
  }

  private numeroOuNulo(valor: unknown): number | null {
    return valor === null || valor === undefined || valor === "" ? null : Number(valor);
  }
}
