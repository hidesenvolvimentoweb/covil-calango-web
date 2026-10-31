import { Routes } from "@angular/router";
import { PerfisPage } from "./perfis/perfis.page";
import { UsuariosPage } from "./usuarios/usuarios.page";
import { PermissoesPage } from "./permissoes/permissoes.page";

export const AdminRoutes: Routes = [
  { path: "usuarios", component: UsuariosPage },
  { path: "perfis", component: PerfisPage },
  { path: "permissoes", component: PermissoesPage },
];
