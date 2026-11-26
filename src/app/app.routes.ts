import { Routes } from "@angular/router";
import { BlankComponent } from "./layouts/blank/blank.component";
import { FullComponent } from "./layouts/full/full.component";
import { DashboardPage } from "./pages/dashboard/dashboard.page";
import { LoginComponent } from "./pages/login/login.component";
import { AuthGuard } from "./guards/auth.guard";
import { NoAuthGuard } from "./guards/no-auth.guard";
import { PermissionGuard } from "./guards/permission.guard";

export const routes: Routes = [
  {
    path: "",
    component: FullComponent,
    children: [
      {
        path: "",
        redirectTo: "/dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        component: DashboardPage,
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: "web-dashboard" },
      },
      {
        path: "pedidos",
        loadChildren: () =>
          import("./pages/pedidos/pedidos.routes").then((m) => m.PedidosRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: "web-pedidos" },
      },
      {
        path: "comandas",
        loadChildren: () =>
          import("./pages/comandas/comandas.routes").then(
            (m) => m.ComandasRoutes,
          ),
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: "web-comandas" },
      },
      {
        path: "solicitacoes",
        loadChildren: () =>
          import("./pages/solicitacoes/solicitacoes.routes").then(
            (m) => m.SolicitacoesRoutes,
          ),
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: "web-solicitacoes" },
      },
      {
        path: "eventos",
        loadChildren: () =>
          import("./pages/eventos/eventos.routes").then((m) => m.EventosRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: "web-eventos" },
      },
      {
        path: "pacotes",
        loadChildren: () =>
          import("./pages/pacotes/pacotes.routes").then((m) => m.PacotesRoutes),
        canActivate: [AuthGuard, PermissionGuard],
        data: { permission: "web-pacotes" },
      },
      {
        path: "admin",
        loadChildren: () =>
          import("./pages/admin/admin.routes").then((m) => m.AdminRoutes),
        // A permissão é exigida por tela, em admin.routes.ts.
        canActivate: [AuthGuard],
      },
    ],
  },
  {
    path: "",
    component: BlankComponent,
    children: [
      {
        path: "login",
        component: LoginComponent,
        // canActivate: [NoAuthGuard]
      },
      {
        path: "cadastro",
        loadComponent: () =>
          import("./pages/cadastro/cadastro.component").then(
            (m) => m.CadastroComponent,
          ),
      },
      {
        path: "esqueci-senha",
        loadComponent: () =>
          import("./pages/esqueci-senha/esqueci-senha.component").then(
            (m) => m.EsqueciSenhaComponent,
          ),
      },
      {
        path: "redefinir-senha",
        loadComponent: () =>
          import("./pages/redefinir-senha/redefinir-senha.component").then(
            (m) => m.RedefinirSenhaComponent,
          ),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "authentication/error",
  },
];
