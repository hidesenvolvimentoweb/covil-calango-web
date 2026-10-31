import { Component } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { TablerIconsModule } from "angular-tabler-icons";

@Component({
  selector: "app-tooltips",
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatInputModule,
    MatCheckboxModule,
    TablerIconsModule,
  ],
  templateUrl: "./tooltips.component.html",
})
export class AppTooltipsComponent {
  //  disabled
  public disabled = new FormControl(false);

  // show and hide
  public showDelay = new FormControl(1000);
  public hideDelay2 = new FormControl(2000);

  // change message
  public message = new FormControl("Info about the action");
}
