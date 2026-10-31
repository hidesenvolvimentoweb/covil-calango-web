import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { TablerIconsModule } from "angular-tabler-icons";
import { MaterialModule } from "src/app/material.module";

@Component({
  selector: "app-sidebar",
  imports: [TablerIconsModule, MaterialModule],
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent implements OnInit {
  constructor() {}
  @Input() public showToggle = true;
  @Output() public toggleMobileNav = new EventEmitter<void>();
  @Output() public toggleCollapsed = new EventEmitter<void>();

  ngOnInit(): void {}
}
