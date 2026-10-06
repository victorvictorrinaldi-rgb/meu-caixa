export type Lancamento = {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  categoria?: string;
  data?: string;
};