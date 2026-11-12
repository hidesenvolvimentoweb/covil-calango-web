import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export const TAMANHO_MINIMO_SENHA = 6;

/**
 * Validador para o campo de confirmação de senha: compara o valor com o do
 * controle irmão informado (por padrão, "password").
 */
export function confirmacaoSenhaValidator(
  nomeControleSenha = "password",
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const senha = control.parent?.get(nomeControleSenha)?.value;
    return control.value === senha ? null : { senhasDiferentes: true };
  };
}
