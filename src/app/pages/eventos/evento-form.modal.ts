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

/** Acima disso, um fim "antes do início" (que vira o dia seguinte) provavelmente é erro de digitação. */
const HORAS_PARA_CONFIRMAR_DURACAO = 12;

/** Data do dia com o horário escolhido no timepicker. */
const combinarDataHora = (data: Date, hora: Date): Date =>
  new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora.getHours(), hora.getMinutes());

const mesmoDia = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

/**
 * Início e fim do evento a partir do formulário. Sem "termina em outro dia", o fim é no mesmo dia ou, se o
 * horário de fim for antes do de início, no dia seguinte (evento que passa da meia-noite).
 */
const calcularPeriodo = (valor: {
  data?: Date | null;
  horaInicio?: Date | null;
  horaFim?: Date | null;
  outroDia?: boolean;
  dataFim?: Date | null;
}): { inicio: Date; fim: Date } | null => {
  if (!valor.data || !valor.horaInicio || !valor.horaFim) {
    return null;
  }
  const inicio = combinarDataHora(valor.data, valor.horaInicio);
  if (valor.outroDia) {
    return valor.dataFim ? { inicio, fim: combinarDataHora(valor.dataFim, valor.horaFim) } : null;
  }
  const fim = combinarDataHora(valor.data, valor.horaFim);
  if (fim <= inicio) {
    fim.setDate(fim.getDate() + 1);
  }
  return { inicio, fim };
};

/** O fim precisa ser depois do início (mesma regra da API). */
const periodoValidator = (grupo: AbstractControl): ValidationErrors | null => {
  const valor = grupo.getRawValue();
  if (!valor.outroDia && valor.horaInicio && valor.horaFim
    && minutosDoDia(valor.horaFim) === minutosDoDia(valor.horaInicio)) {
    return { periodoInvalido: true };
  }
  const periodo = calcularPeriodo(valor);
  return periodo && periodo.fim <= periodo.inicio ? { periodoInvalido: true } : null;
};

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
        // Evento de vários dias (ex.: campeonato de fim de semana): o fim tem a própria data.
        outroDia: [false],
        dataFim: [null as Date | null],
        valorInscricao: [null as number | null, Validators.min(0)],
        vagas: [null as number | null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
        descricao: [""],
      },
      { validators: periodoValidator },
    );
    // A data de término só é obrigatória (e sugerida) quando o evento termina em outro dia.
    this.form.get("outroDia")!.valueChanges.subscribe((outroDia: boolean) => {
      const dataFim = this.form.get("dataFim")!;
      dataFim.setValidators(outroDia ? Validators.required : null);
      if (outroDia && !dataFim.value && this.form.get("data")?.value) {
        const proximoDia = new Date(this.form.get("data")!.value);
        proximoDia.setDate(proximoDia.getDate() + 1);
        dataFim.setValue(proximoDia);
      }
      dataFim.updateValueAndValidity();
    });
  }

  /** O evento passa da meia-noite: o fim escolhido é antes do início. */
  get terminaNoDiaSeguinte(): boolean {
    const inicio: Date | null = this.form.get("horaInicio")?.value;
    const fim: Date | null = this.form.get("horaFim")?.value;
    return !this.form.get("outroDia")?.value && !!inicio && !!fim && minutosDoDia(fim) < minutosDoDia(inicio);
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
        const fim = new Date(evento.dataHoraFim!);
        this.dataOriginal = inicio;
        // Só "termina no dia seguinte" se cabe na regra automática (fim no dia seguinte, antes do horário de
        // início); qualquer outro fim em outra data é um evento de vários dias, que mantém a data de término.
        const diaSeguinte = new Date(inicio);
        diaSeguinte.setDate(diaSeguinte.getDate() + 1);
        const outroDia = !mesmoDia(inicio, fim)
          && !(mesmoDia(fim, diaSeguinte) && minutosDoDia(fim) < minutosDoDia(inicio));
        this.form.patchValue({
          ...evento,
          descricao: evento.descricao ?? "",
          data: inicio,
          horaInicio: inicio,
          horaFim: fim,
          outroDia,
          dataFim: outroDia ? fim : null,
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
    const value = this.form.getRawValue();
    const periodo = calcularPeriodo(value);
    if (!periodo) {
      return;
    }
    const horas = (periodo.fim.getTime() - periodo.inicio.getTime()) / (60 * 60 * 1000);
    // Fim antes do início vira o dia seguinte: uma duração longa assim costuma ser horário digitado errado.
    if (!value.outroDia && horas > HORAS_PARA_CONFIRMAR_DURACAO) {
      this.alertService.showConfirmation(
        "Confirmar duração",
        `O evento vai durar ${Math.round(horas)} horas, terminando no dia seguinte. Está correto?`,
        () => this.enviar(periodo.inicio, periodo.fim),
      );
      return;
    }
    this.enviar(periodo.inicio, periodo.fim);
  }

  private enviar(inicio: Date, fim: Date): void {
    this.salvando = true;
    const value = this.form.getRawValue();
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
