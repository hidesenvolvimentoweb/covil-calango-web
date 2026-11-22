import { Component, Input } from "@angular/core";
import { PagamentoDTO } from "src/app/model/pagamento.dto";
import {
  fromStatusPagamentoEnumValue,
  StatusPagamentoEnum,
} from "src/app/enums/status-pagamento.enum";

const CLASSES_POR_STATUS: Record<StatusPagamentoEnum, string> = {
  [StatusPagamentoEnum.PENDENTE]: "bg-light-warning text-warning",
  [StatusPagamentoEnum.PAGO]: "bg-light-success text-success",
  [StatusPagamentoEnum.EXPIRADO]: "bg-light-secondary text-secondary",
  [StatusPagamentoEnum.CANCELADO]: "bg-light-secondary text-secondary",
  [StatusPagamentoEnum.ESTORNADO]: "bg-light-error text-error",
};

/** Selo com o status do pagamento pelo app; sem tentativa de pagamento, indica pagamento no balcão. */
@Component({
  selector: "app-status-pagamento",
  standalone: true,
  template: `
    @if (pagamento?.status) {
      <span class="status-pagamento" [class]="classes">{{ rotulo }}</span>
    } @else {
      <span class="status-pagamento status-pagamento-vazio">Sem PIX</span>
    }
  `,
})
export class StatusPagamentoComponent {
  @Input()
  public pagamento?: PagamentoDTO | null;

  get rotulo(): string {
    return fromStatusPagamentoEnumValue(this.pagamento?.status);
  }

  get classes(): string {
    const status = this.pagamento?.status;
    return `status-pagamento ${status ? CLASSES_POR_STATUS[status] : ""}`;
  }
}
