import { Injectable } from "@angular/core";
import { MatPaginatorIntl } from "@angular/material/paginator";

@Injectable()
export class PortuguesePaginatorIntl extends MatPaginatorIntl {
  public override itemsPerPageLabel = "Itens por página:";
  public override nextPageLabel = "Próxima página";
  public override previousPageLabel = "Página anterior";
  public override firstPageLabel = "Primeira página";
  public override lastPageLabel = "Última página";

  public override getRangeLabel = (
    page: number,
    pageSize: number,
    length: number,
  ): string => {
    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} – ${endIndex} de ${length}`;
  };
}
