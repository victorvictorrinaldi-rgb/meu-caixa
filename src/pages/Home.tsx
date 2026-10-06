import {
  IonButton, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList,
  IonPage, IonSelect, IonSelectOption, IonTitle, IonToolbar, IonIcon, IonProgressBar,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, useIonAlert, IonSearchbar,
} from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import { chevronBack, chevronForward, close, create, checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type Lancamento = {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  categoria?: string;
  data?: string;
  pago?: boolean;
};

const CHAVE = 'meu-caixa-lancamentos';

const carregar = (): Lancamento[] => {
  const texto = localStorage.getItem(CHAVE);
  if (texto) {
    return JSON.parse(texto);
  }
  return [];
};

const CHAVE_META = 'meu-caixa-meta';

const carregarMeta = (): string => localStorage.getItem(CHAVE_META) || '';

const cores = ['#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#7044ff', '#10dc60', '#92949c'];

const CHAVE_ORC = 'meu-caixa-orcamentos';

const carregarOrcamentos = (): Record<string, string> => {
  const texto = localStorage.getItem(CHAVE_ORC);
  return texto ? JSON.parse(texto) : {};
};

const nomes: Record<string, string> = {
  'renda-fixa': 'Renda fixa',
  'renda-extra': 'Renda extra',
  'despesa': 'Despesa',
};

const categorias = ['Mercado', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Outros'];

const formatar = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const hoje = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const formatarData = (d?: string) =>
  d ? d.split('-').reverse().join('/') : '';

const nomeDoMes = (m: string) => {
  const [ano, mm] = m.split('-').map(Number);
  return new Date(ano, mm - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const somarMes = (m: string, delta: number) => {
  const [ano, mm] = m.split('-').map(Number);
  const d = new Date(ano, mm - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const somarMesesData = (d: string, delta: number) => {
  const [ano, mm, dia] = d.split('-').map(Number);
  const ultimoDia = new Date(ano, mm - 1 + delta + 1, 0).getDate();
  const x = new Date(ano, mm - 1 + delta, Math.min(dia, ultimoDia));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

const Home: React.FC = () => {
  const [lista, setLista] = useState<Lancamento[]>(carregar);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('despesa');
  const [categoria, setCategoria] = useState('Mercado');
  const [data, setData] = useState(hoje());
  const [mes, setMes] = useState(hoje().slice(0, 7));
  const [meta, setMeta] = useState(carregarMeta);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [repeticoes, setRepeticoes] = useState('1');
const [filtroTipo, setFiltroTipo] = useState('todos');
  const [mostrarAlerta] = useIonAlert();
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }, [lista]);

  useEffect(() => {
    localStorage.setItem(CHAVE_META, meta);
  }, [meta]);

  const [orcamentos, setOrcamentos] = useState<Record<string, string>>(carregarOrcamentos);

  useEffect(() => {
  localStorage.setItem(CHAVE_ORC, JSON.stringify(orcamentos));
}, [orcamentos]);

  const doMes = lista.filter((l) => (l.data || '').startsWith(mes));

  const receitas = doMes
    .filter((l) => l.tipo !== 'despesa')
    .reduce((soma, l) => soma + l.valor, 0);

  const despesas = doMes
    .filter((l) => l.tipo === 'despesa')
    .reduce((soma, l) => soma + l.valor, 0);

  const saldo = receitas - despesas;
  const limite = parseFloat(meta.replace(',', '.')) || 0;
  const progresso = limite > 0 ? despesas / limite : 0;
  const despesasDoMes = doMes.filter((l) => l.tipo === 'despesa');

const pendentes = despesasDoMes
  .filter((l) => !l.pago)
  .reduce((soma, l) => soma + l.valor, 0);

const pagas = despesasDoMes
  .filter((l) => l.pago)
  .reduce((soma, l) => soma + l.valor, 0);
  const mesAnterior = somarMes(mes, -1);

const despesasAnterior = lista
  .filter((l) => (l.data || '').startsWith(mesAnterior) && l.tipo === 'despesa')
  .reduce((soma, l) => soma + l.valor, 0);

const variacao =
  despesasAnterior > 0 ? ((despesas - despesasAnterior) / despesasAnterior) * 100 : null;

  const ordenada = [...doMes]
  .filter((l) => l.descricao.toLowerCase().includes(busca.toLowerCase()))
  .filter((l) => filtroTipo === 'todos' || l.tipo === filtroTipo)
  .sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  const porCategoria: Record<string, number> = {};
  doMes
    .filter((l) => l.tipo === 'despesa')
    .forEach((l) => {
      const nome = l.categoria || 'Sem categoria';
      porCategoria[nome] = (porCategoria[nome] || 0) + l.valor;
    });

    const nomesGrafico = Object.keys(porCategoria);

const dadosGrafico = {
  labels: nomesGrafico,
  datasets: [
    {
      data: nomesGrafico.map((n) => porCategoria[n]),
      backgroundColor: cores,
    },
  ],
};

  const adicionar = () => {
  const numero = parseFloat(valor.replace(',', '.'));
  if (descricao.trim() === '' || !(numero > 0)) return;

  const dados = {
    descricao: descricao.trim(),
    valor: numero,
    tipo: tipo,
    categoria: tipo === 'despesa' ? categoria : '',
    data: data,
  };

  if (editandoId !== null) {
    setLista(lista.map((l) => (l.id === editandoId ? { ...l, ...dados } : l)));
    } else {
    const n = Math.min(Math.max(parseInt(repeticoes) || 1, 1), 60);
    const novos: Lancamento[] = [];

    for (let i = 0; i < n; i++) {
      novos.push({
        id: Date.now() + i,
        ...dados,
        descricao: n > 1 ? `${dados.descricao} (${i + 1}/${n})` : dados.descricao,
        data: somarMesesData(dados.data, i),
      });
    }

    setLista([...novos, ...lista]);
  }
  limparFormulario();
  setRepeticoes('1');   
};

  const excluir = (id: number) => {
    setLista(lista.filter((l) => l.id !== id));
  };
  const alternarPago = (id: number) => {
  setLista(lista.map((l) => (l.id === id ? { ...l, pago: !l.pago } : l)));
};
const exportar = () => {
  const dados = { lancamentos: lista, meta, orcamentos };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `meu-caixa-backup-${hoje()}.json`;
  link.click();

  URL.revokeObjectURL(url);
};
const importar = (e: React.ChangeEvent<HTMLInputElement>) => {
  const arquivo = e.target.files?.[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(String(leitor.result));
      if (!Array.isArray(dados.lancamentos)) throw new Error('formato inválido');

      mostrarAlerta({
        header: 'Importar backup?',
        message: `Os dados atuais serão substituídos por ${dados.lancamentos.length} lançamentos do arquivo.`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Importar',
            handler: () => {
              setLista(dados.lancamentos);
              setMeta(dados.meta || '');
              setOrcamentos(dados.orcamentos || {});
            },
          },
        ],
      });
    } catch {
      mostrarAlerta({
        header: 'Arquivo inválido',
        message: 'Escolha um arquivo de backup do Meu Caixa.',
        buttons: ['OK'],
      });
    }
  };
  leitor.readAsText(arquivo);
  e.target.value = '';
};  

  const confirmarExclusao = (l: Lancamento) => {
    mostrarAlerta({
      header: 'Excluir lançamento?',
      message: `"${l.descricao}" de ${formatar(l.valor)} será removido.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Excluir', role: 'destructive', handler: () => excluir(l.id) },
      ],
    });
  };
const limparFormulario = () => {
  setDescricao('');
  setValor('');
  setEditandoId(null);
};

const editar = (l: Lancamento) => {
  setTipo(l.tipo);
  setDescricao(l.descricao);
  setValor(String(l.valor).replace('.', ','));
  setData(l.data || hoje());
  if (l.categoria) setCategoria(l.categoria);
  setEditandoId(l.id);
};

const mudarOrcamento = (cat: string, texto: string) => {
  setOrcamentos({ ...orcamentos, [cat]: texto });
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Meu Caixa</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IonButton fill="clear" onClick={() => setMes(somarMes(mes, -1))}>
            <IonIcon slot="icon-only" icon={chevronBack} />
          </IonButton>
          <strong style={{ textTransform: 'capitalize' }}>{nomeDoMes(mes)}</strong>
          <IonButton fill="clear" onClick={() => setMes(somarMes(mes, 1))}>
            <IonIcon slot="icon-only" icon={chevronForward} />
          </IonButton>
        </div>

        <IonCard>
          <IonCardContent>
            <div style={{ color: 'var(--ion-color-medium)' }}>Saldo do mês</div>
            <div
              style={{
                fontSize: '2.2rem',
                fontWeight: 700,
                color: saldo < 0 ? 'var(--ion-color-danger)' : 'var(--ion-color-success)',
              }}
            >
              {formatar(saldo)}
            </div>
            <div style={{ display: 'flex', gap: '32px', marginTop: '12px' }}>
              <div>
                <small>Receitas</small>
                <div style={{ color: 'var(--ion-color-success)', fontWeight: 600 }}>
                  {formatar(receitas)}
                </div>
              </div>
              <div>
                <small>Despesas</small>
                <div style={{ color: 'var(--ion-color-danger)', fontWeight: 600 }}>
                  {formatar(despesas)}
                </div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
  <IonCardHeader>
    <IonCardTitle>Para onde foi o dinheiro</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
    {nomesGrafico.length === 0 ? (
      <p>Nenhuma despesa neste mês.</p>
    ) : (
      <div style={{ maxWidth: '320px', margin: '0 auto' }}>
        <Doughnut
          data={dadosGrafico}
          options={{
            plugins: {
              legend: { position: 'bottom', labels: { color: '#9a9a9a' } },
            },
          }}
        />
      </div>
    )}
  </IonCardContent>
</IonCard>

        <IonCard>
  <IonCardHeader>
    <IonCardTitle>Comparado a {nomeDoMes(mesAnterior)}</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
    {variacao === null ? (
      <p>Sem despesas no mês anterior para comparar.</p>
    ) : (
      <>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: variacao > 0 ? 'var(--ion-color-danger)' : 'var(--ion-color-success)',
          }}
        >
          {variacao > 0 ? '▲' : variacao < 0 ? '▼' : ''} {Math.round(Math.abs(variacao))}%
        </div>
        <p>
          {variacao > 0
            ? 'Você gastou mais'
            : variacao < 0
            ? 'Você gastou menos'
            : 'Você gastou o mesmo'}{' '}
          do que no mês anterior ({formatar(despesasAnterior)}).
        </p>
      </>
    )}
  </IonCardContent>
</IonCard>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{editandoId !== null ? 'Editar lançamento' : 'Novo lançamento'}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonInput
              label="Meta de gastos do mês (R$)"
              labelPlacement="floating"
              inputmode="decimal"
              value={meta}
              onIonInput={(e) => setMeta(e.detail.value ?? '')}
            />

            {limite > 0 && (
              <>
                <IonProgressBar
                  value={Math.min(progresso, 1)}
                  color={progresso > 1 ? 'danger' : progresso > 0.8 ? 'warning' : 'success'}
                />
                <p>
                  {progresso > 1
                    ? `Você passou ${formatar(despesas - limite)} da meta`
                    : `Restam ${formatar(limite - despesas)} (${Math.round(progresso * 100)}% usado)`}
                </p>
              </>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
  <IonCardHeader>
    <IonCardTitle>Orçamento por categoria</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
    {categorias.map((c) => {
      const gasto = porCategoria[c] || 0;
      const lim = parseFloat((orcamentos[c] || '').replace(',', '.')) || 0;
      const prog = lim > 0 ? gasto / lim : 0;

      return (
        <div key={c} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{c}</span>
            <strong>{formatar(gasto)}</strong>
          </div>

          <IonInput
            label="Limite (R$)"
            labelPlacement="floating"
            fill="outline"
            inputmode="decimal"
            value={orcamentos[c] || ''}
            onIonInput={(e) => mudarOrcamento(c, e.detail.value ?? '')}
          />

          {lim > 0 && (
            <>
              <IonProgressBar
                value={Math.min(prog, 1)}
                color={prog > 1 ? 'danger' : prog > 0.8 ? 'warning' : 'success'}
              />
              <small>
                {prog > 1
                  ? `Passou ${formatar(gasto - lim)} do limite`
                  : `Restam ${formatar(lim - gasto)}`}
              </small>
            </>
          )}
        </div>
      );
    })}
  </IonCardContent>
</IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Novo lançamento</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonSelect
              label="Tipo"
              labelPlacement="floating"
              value={tipo}
              onIonChange={(e) => setTipo(e.detail.value)}
            >
              <IonSelectOption value="renda-fixa">Renda fixa</IonSelectOption>
              <IonSelectOption value="renda-extra">Renda extra</IonSelectOption>
              <IonSelectOption value="despesa">Despesa</IonSelectOption>
            </IonSelect>

            {tipo === 'despesa' && (
              <IonSelect
                label="Categoria"
                labelPlacement="floating"
                value={categoria}
                onIonChange={(e) => setCategoria(e.detail.value)}
              >
                {categorias.map((c) => (
                  <IonSelectOption key={c} value={c}>
                    {c}
                  </IonSelectOption>
                ))}
              </IonSelect>
            )}

            <IonInput
              label="Produto ou descrição"
              labelPlacement="floating"
              value={descricao}
              onIonInput={(e) => setDescricao(e.detail.value ?? '')}
            />
            <IonInput
              label="Valor (R$)"
              labelPlacement="floating"
              inputmode="decimal"
              value={valor}
              onIonInput={(e) => setValor(e.detail.value ?? '')}
            />
            <IonInput
              label="Data"
              labelPlacement="stacked"
              type="date"
              value={data}
              onIonInput={(e) => setData(e.detail.value ?? '')}
            />
{editandoId === null && (
  <>
    <IonInput
      label="Repetir por quantos meses?"
      labelPlacement="floating"
      type="number"
      inputmode="numeric"
      value={repeticoes}
      onIonInput={(e) => setRepeticoes(e.detail.value ?? '')}
    />
    <small>
      1 = lançamento único. Para parcelas ou contas fixas, use 2 ou mais. O valor é o de cada mês.
    </small>
  </>
)}
            <IonButton expand="block" onClick={adicionar}>
  {editandoId !== null ? 'Salvar alterações' : 'Adicionar'}
</IonButton>

{editandoId !== null && (
  <IonButton expand="block" fill="outline" color="medium" onClick={limparFormulario}>
    Cancelar edição
  </IonButton>
)}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Lançamentos</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonSearchbar
  value={busca}
  placeholder="Buscar pelo nome"
  onIonInput={(e) => setBusca(e.detail.value ?? '')}
/>

<IonSelect
  label="Mostrar"
  labelPlacement="floating"
  value={filtroTipo}
  onIonChange={(e) => setFiltroTipo(e.detail.value)}
>
  <IonSelectOption value="todos">Todos</IonSelectOption>
  <IonSelectOption value="renda-fixa">Renda fixa</IonSelectOption>
  <IonSelectOption value="renda-extra">Renda extra</IonSelectOption>
  <IonSelectOption value="despesa">Despesas</IonSelectOption>
</IonSelect>
<p>
  A pagar: <strong>{formatar(pendentes)}</strong> · Já pago: <strong>{formatar(pagas)}</strong>
</p>
{ordenada.length === 0 && (
  <p>
    {doMes.length === 0
      ? 'Nenhum lançamento neste mês.'
      : 'Nenhum lançamento encontrado com esse filtro.'}
  </p>
)}            <IonList>
              {ordenada.map((l) => (
                <IonItem key={l.id}>
  {l.tipo === 'despesa' && (
    <IonButton
      slot="start"
      fill="clear"
      color={l.pago ? 'success' : 'medium'}
      onClick={() => alternarPago(l.id)}
    >
      <IonIcon slot="icon-only" icon={l.pago ? checkmarkCircle : ellipseOutline} />
    </IonButton>
  )}
  <IonLabel>
    <h2 style={{ textDecoration: l.pago ? 'line-through' : 'none' }}>{l.descricao}</h2>
    <p>
      {nomes[l.tipo]}
      {l.categoria ? ' · ' + l.categoria : ''}
      {l.data ? ' · ' + formatarData(l.data) : ''}
      {l.tipo === 'despesa' ? (l.pago ? ' · Pago' : ' · Pendente') : ''}
    </p>
  </IonLabel>
  <IonLabel slot="end" color={l.tipo === 'despesa' ? 'danger' : 'success'}>
    {l.tipo === 'despesa' ? '−' : '+'} {formatar(l.valor)}
  </IonLabel>
  <IonButton slot="end" fill="clear" color="medium" onClick={() => editar(l)}>
    <IonIcon slot="icon-only" icon={create} />
  </IonButton>
  <IonButton
    slot="end"
    fill="clear"
    color="medium"
    onClick={() => confirmarExclusao(l)}
  >
    <IonIcon slot="icon-only" icon={close} />
  </IonButton>
</IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
        <IonCard>
  <IonCardHeader>
    <IonCardTitle>Backup dos dados</IonCardTitle>
  </IonCardHeader>
  <IonCardContent>
    <p>Seus dados ficam só neste navegador. Exporte um arquivo para guardar uma cópia.</p>

    <IonButton expand="block" onClick={exportar}>
      Exportar backup
    </IonButton>
    <IonButton expand="block" fill="outline" onClick={() => arquivoRef.current?.click()}>
      Importar backup
    </IonButton>

    <input
      ref={arquivoRef}
      type="file"
      accept=".json,application/json"
      style={{ display: 'none' }}
      onChange={importar}
    />
  </IonCardContent>
</IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Home;