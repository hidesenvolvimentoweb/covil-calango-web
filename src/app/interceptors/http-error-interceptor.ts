import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

/**
 * Garante que todo erro HTTP chegue aos componentes com `error.error.message`
 * preenchido: usa a mensagem enviada pela API e, quando ela não existe
 * (servidor fora do ar, resposta sem corpo), uma mensagem padrão pelo status.
 */
export function httpErrorInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  return next(req).pipe(
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof HttpErrorResponse ? normalizarErro(error) : error,
      ),
    ),
  );
}

function normalizarErro(error: HttpErrorResponse): HttpErrorResponse {
  const body = error.error;
  const mensagemApi =
    error.status !== 0 && body && typeof body === "object"
      ? (body as { message?: unknown }).message
      : undefined;
  if (typeof mensagemApi === "string" && mensagemApi.trim()) {
    return error;
  }
  return new HttpErrorResponse({
    error: { message: mensagemPadrao(error.status) },
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url ?? undefined,
  });
}

function mensagemPadrao(status: number): string {
  switch (status) {
    case 0:
      return "Não foi possível conectar ao servidor. Verifique a sua conexão e tente novamente.";
    case 400:
      return "Os dados enviados são inválidos.";
    case 401:
      return "Não autenticado.";
    case 403:
      return "Você não tem permissão para realizar esta operação.";
    case 404:
      return "Recurso não encontrado.";
    case 413:
      return "O arquivo enviado excede o tamanho máximo permitido.";
    default:
      return status >= 500
        ? "Erro interno do servidor. Tente novamente mais tarde."
        : "Não foi possível processar a requisição.";
  }
}
