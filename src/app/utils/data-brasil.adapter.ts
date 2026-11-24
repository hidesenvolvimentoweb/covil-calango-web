import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

/**
 * Adaptador de datas do Angular Material (datepicker e timepicker) para o formato brasileiro. O NativeDateAdapter
 * exibe "28/11/2026" no locale pt-BR, mas interpreta o texto digitado pelo Date.parse (formato americano):
 * "05/11/2026" viraria 11 de maio.
 */
@Injectable()
export class DataBrasilAdapter extends NativeDateAdapter {
  override parse(valor: unknown, formato?: object): Date | null {
    if (typeof valor === "string") {
      const partes = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (partes) {
        const [, dia, mes, ano] = partes.map(Number);
        const data = new Date(ano, mes - 1, dia);
        // Recusa datas inexistentes (31/02 viraria 03/03).
        return data.getDate() === dia && data.getMonth() === mes - 1 ? data : this.invalid();
      }
    }
    return super.parse(valor, formato);
  }
}
