import { BreakpointObserver } from "@angular/cdk/layout";
import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { MatSidenav, MatSidenavContent } from "@angular/material/sidenav";
import { Subscription } from "rxjs";
import { CoreService } from "src/app/services/core.service";

import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { TablerIconsModule } from "angular-tabler-icons";
import { NgScrollbarModule } from "ngx-scrollbar";
import { filter } from "rxjs/operators";
import { MaterialModule } from "src/app/material.module";
import { WebsocketService } from "src/app/services/http-services/websocket.service";
import { AppNavItemComponent } from "./sidebar/nav-item/nav-item.component";
import { navItems } from "./sidebar/sidebar-data";
import { UserStateService } from "src/app/services/user.service";
import { UsuarioDTO } from "src/app/model/usuario.dto";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { NavItem } from "./sidebar/nav-item/nav-item";
import { AlertService } from "src/app/services/alert.service";

const MOBILE_VIEW = "screen and (max-width: 768px)";
const TABLET_VIEW = "screen and (min-width: 769px) and (max-width: 1024px)";

@Component({
  selector: "app-full",
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
  ],
  templateUrl: "./full.component.html",
  styleUrls: ["./full.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent {
  private settings = inject(CoreService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  public userStateService = inject(UserStateService);
  private websocketService = inject(WebsocketService);
  private alertService = inject(AlertService);

  @ViewChild("leftsidenav")
  public sidenav: MatSidenav;

  @ViewChild("content", { static: true })
  public content!: MatSidenavContent;

  public navItems: NavItem[] = [];
  public resView = false;
  public options = this.settings.getOptions();
  public notificacoesPendentes = 0;
  private layoutChangesSubscription = Subscription.EMPTY;
  private isMobileScreen = false;

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  constructor() {
    const visibleItems = navItems.filter(
      (item) =>
        !item.permission ||
        this.userStateService.hasPermission(item.permission),
    );
    this.navItems = visibleItems.some((item) => item.route) ? visibleItems : [];

    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW])
      .subscribe((state) => {
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[MOBILE_VIEW];
        if (this.options.sidenavCollapsed == false) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
      });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.content.scrollTo({ top: 0 }));
  }

  ngOnInit(): void {
    this.websocketService.createWebSocketConnection().subscribe(() => {
      this.websocketService.getClient().subscribe("/topic/solicitacoes", () => {
        this.notificacoesPendentes++;
        const solicitacoes = this.navItems.find(
          (item) => item.displayName === "Solicitações",
        );
        if (solicitacoes) {
          solicitacoes.notificacoesPendentes = this.notificacoesPendentes;
        }
      });
    });
  }

  ngOnDestroy() {
    this.layoutChangesSubscription.unsubscribe();
  }

  onNotificacoesLidas() {
    this.notificacoesPendentes = 0;
    const solicitacoes = this.navItems.find(
      (item) => item.displayName === "Solicitações",
    );
    if (solicitacoes) {
      solicitacoes.notificacoesPendentes = 0;
    }
  }

  resetNotificacoes() {
    this.notificacoesPendentes = 0;
  }

  sair(): void {
    this.alertService.showConfirmation(
      "Sair",
      "Deseja realmente encerrar sua sessão?",
      () => {
        this.userStateService.clearUser();
        this.websocketService.disconnect();
        void this.router.navigate(["/login"]);
      },
    );
  }

  trackByItem(index: number, item: any): number {
    return index;
  }

  toggleCollapsed() {
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }
}
