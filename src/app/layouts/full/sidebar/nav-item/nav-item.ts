export interface NavItem {
    displayName?: string;
    iconName?: string;
    navCap?: string;
    route?: string;
    permission?: string;
    children?: NavItem[];
    chip?: boolean;
    chipContent?: string;
    chipClass?: string;
    external?: boolean;
    bgcolor?:string;
    notificacoesPendentes?: number;
}