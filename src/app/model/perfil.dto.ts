export interface PerfilDTO {
  id?: number;
  name: string;
  permissoes: string[];
}

export type PerfilRequestDTO = Pick<PerfilDTO, "name">;
