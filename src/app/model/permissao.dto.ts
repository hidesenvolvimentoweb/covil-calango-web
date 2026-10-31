export interface PermissaoDTO {
  id?: number;
  name: string;
}

export type PermissaoRequestDTO = Pick<PermissaoDTO, "name">;
