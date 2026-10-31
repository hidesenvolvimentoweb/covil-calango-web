import { Component } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { TablerIconsModule } from "angular-tabler-icons";

interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: "app-forms",
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatCheckboxModule,
    TablerIconsModule,
  ],
  templateUrl: "./forms.component.html",
})
export class AppFormsComponent {
  public country: Food[] = [
    { value: "steak-0", viewValue: "USA" },
    { value: "pizza-1", viewValue: "India" },
    { value: "tacos-2", viewValue: "France" },
    { value: "tacos-3", viewValue: "UK" },
  ];

  public selectedCountry = this.country[2].value;

  public city: Food[] = [
    { value: "steak-0", viewValue: "Mexico" },
    { value: "pizza-1", viewValue: "Mumbai" },
    { value: "tacos-2", viewValue: "Tokyo" },
    { value: "tacos-3", viewValue: "New York" },
  ];

  public selectedCity = this.city[1].value;

  public state: Food[] = [
    { value: "steak-0", viewValue: "Cuba" },
    { value: "pizza-1", viewValue: "Djibouti" },
    { value: "tacos-2", viewValue: "Bulgaria" },
    { value: "tacos-3", viewValue: "Cabo Verde" },
  ];

  public selectedState = this.state[3].value;
}
