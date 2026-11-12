import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { UserStateService } from "src/app/services/user.service";
import { environment } from "src/environments/environment";

/** Rotas de autenticação: um 401 nelas é erro de login, não sessão expirada. */
const ROTAS_AUTH = ["/api/auth/login", "/api/auth/logout"];

/**
 * A sessão fica num cookie HttpOnly gravado pela API no login. Este interceptor:
 * - envia o cookie nas chamadas à API (`withCredentials`);
 * - envia o cabeçalho `X-Requested-With`, exigido pela API nas operações que alteram dados (proteção CSRF);
 * - ao receber 401 (sessão expirada ou ausente), limpa o usuário local e volta para o login.
 */
export function httpAuthInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (!req.url.startsWith(environment.url)) {
    return next(req);
  }
  const userStateService = inject(UserStateService);
  const router = inject(Router);

  const authReq = req.clone({
    withCredentials: true,
    setHeaders: { "X-Requested-With": "XMLHttpRequest" },
  });

  return next(authReq).pipe(
    catchError((error: unknown) => {
      const rotaAuth = ROTAS_AUTH.some((rota) => req.url.includes(rota));
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !rotaAuth &&
        userStateService.getCurrentUserSnapshot()
      ) {
        userStateService.clearUser();
        void router.navigate(["/login"]);
      }
      return throwError(() => error);
    }),
  );
}
