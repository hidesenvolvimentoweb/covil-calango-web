import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { RouterModule } from "@angular/router";
import { MaterialModule } from "src/app/material.module";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
import {
  GoogleSigninButtonModule,
  SocialAuthService,
} from "@abacritt/angularx-social-login";
import { AuthService } from "src/app/services/http-services/auth.service";
import { TipoProviderAuthEnum } from "src/app/enums/tipo-provider-auth.enum";
import { SocialUser } from "angularx-social-login";
import { UserStateService } from "src/app/services/user.service";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import { AlertService } from "src/app/services/alert.service";
import { APP_VERSION } from "src/app/utils/app-version";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    GoogleSigninButtonModule,
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private googleSigninService = inject(SocialAuthService);
  private authService = inject(AuthService);
  private userStateService = inject(UserStateService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  public readonly version = APP_VERSION;

  public form = new FormGroup({
    email: new FormControl("", [Validators.required, Validators.minLength(6)]),
    senha: new FormControl("", [Validators.required]),
  });

  ngOnInit(): void {
    // Encerra a inscrição ao sair da tela; senão cada visita ao login acumula uma nova e o login é repetido.
    this.googleSigninService.authState
      .pipe(
        filter((user) => !!user),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => this.loginGoogle(user));
  }

  loginGoogle(user: SocialUser) {
    this.authService
      .login({
        id: user.id,
        email: user.email,
        idToken: user.idToken,
        provider: TipoProviderAuthEnum.GOOGLE,
      })
      .subscribe({
        next: (res) => this.mapearRetorno(res),
        error: (error) => this.mostrarErroLogin(error),
      });
  }

  loginCredentials() {
    if (this.form.valid) {
      this.authService
        .login({
          email: this.form.get("email")?.value!,
          senha: this.form.get("senha")?.value!,
          provider: TipoProviderAuthEnum.CREDENTIAL,
        })
        .subscribe({
          next: (res) => this.mapearRetorno(res),
          error: (error) => this.mostrarErroLogin(error),
        });
    }
  }

  private mostrarErroLogin(error: any) {
    this.alertService.showError(
      "Erro",
      error.error?.message ?? "Não foi possível entrar. Tente novamente.",
    );
  }

  mapearRetorno(res: UsuarioDTO) {
    if (res) {
      this.userStateService.setCurrentUser(res);
      this.router.navigate(["/dashboard"]);
    }
  }
}
