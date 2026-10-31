import { Injectable, inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree,
} from "@angular/router";
import { UserStateService } from "../services/user.service";

@Injectable({ providedIn: "root" })
export class PermissionGuard implements CanActivate {
  private userStateService = inject(UserStateService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const permission = route.data["permission"] as string | undefined;
    const profile = route.data["profile"] as string | undefined;
    if (
      (permission && this.userStateService.hasPermission(permission)) ||
      (profile && this.userStateService.hasProfile(profile))
    ) {
      return true;
    }

    return this.router.createUrlTree(["/login"]);
  }
}
