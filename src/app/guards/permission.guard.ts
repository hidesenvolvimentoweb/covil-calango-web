import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { UserStateService } from '../services/user.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {

  constructor(
    private userStateService: UserStateService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const permission = route.data['permission'] as string | undefined;
    if (permission && this.userStateService.hasPermission(permission)) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}
