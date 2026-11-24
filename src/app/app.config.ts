import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideZoneChangeDetection,
  importProvidersFrom,
} from "@angular/core";
import { registerLocaleData } from "@angular/common";
import localePt from "@angular/common/locales/pt";

// Formato brasileiro nos pipes de moeda, número e data (ex.: R$ 1.234,56).
registerLocaleData(localePt, "pt-BR");
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { routes } from "./app.routes";
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideClientHydration } from "@angular/platform-browser";
import { TablerIconsModule } from "angular-tabler-icons";
import * as TablerIcons from "angular-tabler-icons/icons";
import { NgScrollbarModule } from "ngx-scrollbar";
import { MaterialModule } from "./material.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { httpLoadingInterceptor } from "./interceptors/http-loading-interceptor";
import { httpErrorInterceptor } from "./interceptors/http-error-interceptor";
import { httpAuthInterceptor } from "./interceptors/http-auth-interceptor";
import { socialAuthServiceConfig } from "./config";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { PortuguesePaginatorIntl } from "./services/portuguese-paginator-intl";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
} from "@angular/material/core";
import { DataBrasilAdapter } from "./utils/data-brasil.adapter";

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: "pt-BR" },
    { provide: DEFAULT_CURRENCY_CODE, useValue: "BRL" },
    socialAuthServiceConfig,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withComponentInputBinding(),
    ),
    provideHttpClient(withInterceptors([httpLoadingInterceptor, httpAuthInterceptor, httpErrorInterceptor])),
    provideClientHydration(),
    provideAnimationsAsync(),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      TablerIconsModule.pick(TablerIcons),
      NgScrollbarModule,
    ),
    { provide: MatPaginatorIntl, useClass: PortuguesePaginatorIntl },
    // Datepicker e timepicker em pt-BR ("28/11/2026", "14:00").
    { provide: MAT_DATE_LOCALE, useValue: "pt-BR" },
    { provide: DateAdapter, useClass: DataBrasilAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
};
