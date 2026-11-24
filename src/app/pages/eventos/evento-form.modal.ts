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
import { EventoRequestDTO } from "src/app/model/evento.dto";
import { AlertService } from "src/app/services/alert.service";
import { EventoApiService } from "src/app/services/http-services/evento.service";
import { paraInputDataHora } from "src/app/utils/data-hora.util";

export const TAMANHO_MAXIMO_DESCRICAO_EVENTO = 2000;

/** Horário sugerido para um evento novo criado pelo clique em um dia: das 19h às 23h. */
const HORA_INICIO_PADRAO = 19;
const DURACAO_PADRAO_HORAS = 4;

/** O fim precisa ser depois do início (mesma regra da API). */
const periodoValidator = (grupo: AbstractControl): ValidationErrors | null => {
  const inicio = grupo.get("dataHoraInicio")?.value;
  const fim = grupo.get("dataHoraFim")?.value;
  return inicio && fim && fim <= inicio ? { periodoInvalido: true } : null;
};

@Component({
  selector: "app-evento-form-modal",
  standalone: true,
  imports: [ReactiveFormsModule, MaterialModule, TablerIconsModule],
  templateUrl: "./evento-form.modal.html",
})
export class EventoFormModal implements OnInit {
  /** {@code inicio}/{@code fim}: período selecionado no calendário, para sugerir as datas de um evento novo. */
  public data = inject<{ id?: number; inicio?: Date; fim?: Date }>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<EventoFormModal>>(MatDialogRef);
  private formBuilder = inject(FormBuilder);
  private eventoService = inject(EventoApiService);
  private alertService = inject(AlertService);

  public readonly tipos = TIPOS_EVENTO;
  public readonly tamanhoMaximoDescricao = TAMANHO_MAXIMO_DESCRICAO_EVENTO;
  public salvando = false;
  public form: FormGroup;

  constructor() {
    this.form = this.formBuilder.nonNullable.group(
      {
        nome: ["", Validators.required],
        tipo: [TipoEventoEnum.TORNEIO, Validators.required],
        dataHoraInicio: ["", Validators.required],
        dataHoraFim: ["", Validators.required],
        valorInscricao: [null as number | null, Validators.min(0)],
        vagas: [null as number | null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
        descricao: [""],
      },
      { validators: periodoValidator },
    );
  }

  ngOnInit(): void {
    if (this.data.id == null) {
      this.sugerirPeriodo();
      return;
    }
    this.eventoService.getEventoById(this.data.id).subscribe({
      next: (evento) =>
        this.form.patchValue({
          ...evento,
          descricao: evento.descricao ?? "",
          // A API envia "2026-11-28T19:00:00"; o input datetime-local usa "2026-11-28T19:00".
          dataHoraInicio: evento.dataHoraInicio?.slice(0, 16) ?? "",
          dataHoraFim: evento.dataHoraFim?.slice(0, 16) ?? "",
        }),
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
    const request: EventoRequestDTO = {
      nome: String(value.nome).trim(),
      tipo: value.tipo,
      descricao: String(value.descricao).trim() || undefined,
      dataHoraInicio: `${value.dataHoraInicio}:00`,
      dataHoraFim: `${value.dataHoraFim}:00`,
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
   * Evento novo: usa o período selecionado no calendário. Um clique em um dia inteiro (visão de mês) vira
   * o horário padrão das 19h às 23h desse dia.
   */
  private sugerirPeriodo(): void {
    const inicio = this.data.inicio ? new Date(this.data.inicio) : new Date();
    let fim = this.data.fim ? new Date(this.data.fim) : undefined;
    const diaInteiro =
      !this.data.inicio || (inicio.getHours() === 0 && inicio.getMinutes() === 0);
    if (diaInteiro) {
      inicio.setHours(HORA_INICIO_PADRAO, 0, 0, 0);
      fim = undefined;
    }
    if (!fim || fim <= inicio) {
      fim = new Date(inicio.getTime() + DURACAO_PADRAO_HORAS * 60 * 60 * 1000);
    }
    this.form.patchValue({
      dataHoraInicio: paraInputDataHora(inicio),
      dataHoraFim: paraInputDataHora(fim),
    });
  }

  private numeroOuNulo(valor: unknown): number | null {
    return valor === null || valor === undefined || valor === "" ? null : Number(valor);
  }
}
