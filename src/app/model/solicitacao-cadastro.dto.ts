export interface SolicitacaoCadastroDTO {
  id: number;
  nome: string;
  contato?: string;
  email: string;
  dataHora: string;
}

export interface SolicitacaoCadastroRequestDTO {
  nome: string;
  contato?: string;
  email: string;
}

export interface SolicitacaoCadastroFilterDTO {
  nome?: string;
  email?: string;
}
