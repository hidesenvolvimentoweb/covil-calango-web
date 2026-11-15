import { Routes } from "@angular/router";
import { PermissionGuard } from "src/app/guards/permission.guard";
import { PerfisPage } from "./perfis/perfis.page";
import { UsuariosPage } from "./usuarios/usuarios.page";
import { PermissoesPage } from "./permissoes/permissoes.page";
import { ProdutosPage } from "./produtos/produtos.page";
import { ParametrosPage } from "./parametros/parametros.page";
import { FinalizarCadastroPage } from "./finalizar-cadastro/finalizar-cadastro.page";

/** Cada tela exige a mesma permissão usada no menu lateral (sidebar-data.ts) e na API. */
const MANTER_USUARIOS = { permission: "web-manter-usuarios" };
const MANTER_PRODUTOS = { permission: "web-manter-produtos" };

export const AdminRoutes: Routes = [
  { path: "usuarios", component: UsuariosPage, canActivate: [PermissionGuard], data: MANTER_USUARIOS },
  { path: "finalizar-cadastro", component: FinalizarCadastroPage, canActivate: [PermissionGuard], data: MANTER_USUARIOS },
  { path: "perfis", component: PerfisPage, canActivate: [PermissionGuard], data: MANTER_USUARIOS },
  { path: "permissoes", component: PermissoesPage, canActivate: [PermissionGuard], data: MANTER_USUARIOS },
  { path: "produtos", component: ProdutosPage, canActivate: [PermissionGuard], data: MANTER_PRODUTOS },
  { path: "parametros", component: ParametrosPage, canActivate: [PermissionGuard], data: MANTER_PRODUTOS },
];
