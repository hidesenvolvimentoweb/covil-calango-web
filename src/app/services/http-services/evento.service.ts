import { HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { EventoDTO, EventoRequestDTO } from "src/app/model/evento.dto";
import { formatarDataHoraLocal } from "src/app/utils/data-hora.util";
import { AbstractGenericClass } from "./generic.service";

@Injectable({ providedIn: "root" })
export class EventoApiService extends AbstractGenericClass {
  public override urlController = `${environment.url}/api/evento`;

  /** Eventos que acontecem, ao menos em parte, no período exibido no calendário. */
  getEventos(inicio: Date, fim: Date) {
    const params = new HttpParams()
      .set("inicio", formatarDataHoraLocal(inicio))
      .set("fim", formatarDataHoraLocal(fim));
    return this.httpClient.get<EventoDTO[]>(this.urlController, { params });
  }

  getEventoById(id: number) {
    return this.httpClient.get<EventoDTO>(`${this.urlController}/${id}`);
  }

  create(request: EventoRequestDTO) {
    return this.httpClient.post<EventoDTO>(this.urlController, request);
  }

  update(id: number, request: EventoRequestDTO) {
    return this.httpClient.put<EventoDTO>(`${this.urlController}/${id}`, request);
  }

  deleteById(id: number) {
    return this.httpClient.delete<void>(`${this.urlController}/${id}`);
  }
}
