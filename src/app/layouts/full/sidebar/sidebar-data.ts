import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Menu',
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-grid-add',
    route: '/dashboard',
    permission: 'web-dashboard',
    bgcolor: 'success',
  },
  {
    displayName: 'Solicitações',
    iconName: 'archive',
    route: '/solicitacoes/listar',
    permission: 'web-solicitacoes',
    bgcolor: 'success',
    notificacoesPendentes: 0,
  },
  {
    displayName: 'Pedidos',
    iconName: 'info-circle',
    route: '/pedidos/listar',
    permission: 'web-pedidos',
    bgcolor: 'success',
  },
  {
    displayName: 'Comandas',
    iconName: 'info-circle',
    route: '/comandas/listar',
    permission: 'web-comandas',
    bgcolor: 'success',
  },
];
