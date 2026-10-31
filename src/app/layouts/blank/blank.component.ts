import { Component, inject } from "@angular/core";
import { CoreService } from "src/app/services/core.service";

import { RouterOutlet } from "@angular/router";
import { MaterialModule } from "src/app/material.module";

@Component({
  selector: "app-blank",
  templateUrl: "./blank.component.html",
  styleUrls: [],
  imports: [RouterOutlet, MaterialModule],
})
export class BlankComponent {
  private settings = inject(CoreService);

  public options = this.settings.getOptions();

  private htmlElement!: HTMLHtmlElement;

  constructor() {
    this.htmlElement = document.querySelector("html")!;
  }
}
