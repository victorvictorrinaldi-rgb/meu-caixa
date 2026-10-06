export const formatar = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const hoje = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

export const formatarData = (d?: string) =>
  d ? d.split('-').reverse().join('/') : '';

export const nomeDoMes = (m: string) => {
  const [ano, mm] = m.split('-').map(Number);
  return new Date(ano, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const somarMes = (m: string, delta: number) => {
  const [ano, mm] = m.split('-').map(Number);
  const d = new Date(ano, mm - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};