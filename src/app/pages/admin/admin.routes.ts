import { Routes } from "@angular/router";
import { PerfisPage } from "./perfis/perfis.page";
import { UsuariosPage } from "./usuarios/usuarios.page";
import { PermissoesPage } from "./permissoes/permissoes.page";
import { ProdutosPage } from "./produtos/produtos.page";
import { ParametrosPage } from "./parametros/parametros.page";
import { FinalizarCadastroPage } from "./finalizar-cadastro/finalizar-cadastro.page";

export const AdminRoutes: Routes = [
  { path: "usuarios", component: UsuariosPage },
  { path: "finalizar-cadastro", component: FinalizarCadastroPage },
  { path: "perfis", component: PerfisPage },
  { path: "permissoes", component: PermissoesPage },
  { path: "produtos", component: ProdutosPage },
  { path: "parametros", component: ParametrosPage },
];
