import { Injectable, inject } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { UserStateService } from "../services/user.service";

@Injectable({ providedIn: "root" })
export class NoAuthGuard implements CanActivate {
  private userStateService = inject(UserStateService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.userStateService.currentUser()) {
      return false;
    } else {
      return true;
    }
  }
}
