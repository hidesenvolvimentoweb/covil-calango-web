import { Injectable, signal } from "@angular/core";
import { UsuarioDTO } from "../model/usuario.dto";

@Injectable({ providedIn: "root" })
export class UserStateService {
  public get currentUser() {
    return this._currentUser.asReadonly();
  }

  private readonly _currentUser = signal<UsuarioDTO | null>(null);
  private readonly STORAGE_KEY = "currentUser";

  constructor() {
    this.loadStateFromStorage();
  }

  setCurrentUser(user: UsuarioDTO | null): void {
    this._currentUser.set(user);
    this.saveStateToStorage(user);
  }

  getCurrentUserSnapshot(): UsuarioDTO | null {
    return this._currentUser();
  }

  hasPermission(permission: string): boolean {
    return (
      this.currentUser()?.perfis?.some((perfil) =>
        perfil.permissoes?.includes(permission),
      ) ?? false
    );
  }

  hasProfile(profileName: string): boolean {
    return (
      this.currentUser()?.perfis?.some(
        (perfil) => perfil.name === profileName,
      ) ?? false
    );
  }

  clearUser(): void {
    this._currentUser.set(null);
    this.clearStateFromStorage();
  }

  private saveStateToStorage(user: UsuarioDTO | null): void {
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private loadStateFromStorage(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    if (storedUser) {
      try {
        this._currentUser.set(JSON.parse(storedUser));
      } catch (error) {
        console.error(
          "Erro ao carregar estado do usuário do localStorage",
          error,
        );
        this.clearStateFromStorage();
      }
    }
  }

  private clearStateFromStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
