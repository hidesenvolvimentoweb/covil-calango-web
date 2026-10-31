import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { NavService } from "../../../../services/nav.service";
import { NavItem } from "./nav-item";

import { TranslateModule } from "@ngx-translate/core";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";

@Component({
  selector: "app-nav-item",
  imports: [CommonModule, TranslateModule, TablerIconsModule, MaterialModule],
  templateUrl: "./nav-item.component.html",
  styleUrls: ["./nav-item.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class AppNavItemComponent implements OnChanges {
  public navService = inject(NavService);
  public router = inject(Router);

  @Output() public notify: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() public notificacoesLidas: EventEmitter<void> =
    new EventEmitter<void>();

  @Input() public item: NavItem | any;
  @Input() public notificacoesPendentes: number = 0;

  public expanded: boolean = false;
  @HostBinding("attr.aria-expanded") public ariaExpanded = this.expanded;
  @Input() public depth: any;

  ngOnChanges() {
    const url = this.navService.currentUrl();
    if (this.item.route && url) {
      this.expanded = url.indexOf(`/${this.item.route}`) === 0;
      this.ariaExpanded = this.expanded;
    }
  }

  onItemSelected(item: NavItem) {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);

      if (item.displayName === "Solicitações") {
        this.notificacoesLidas.emit();
      }
    }

    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }

    window.scroll({ top: 0, left: 0, behavior: "smooth" });

    if (!this.expanded && window.innerWidth < 1024) {
      this.notify.emit();
    }
  }
}
