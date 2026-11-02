import { useSearchParams } from 'react-router';
import { Page, PageHeader, Tabs } from '@/components/ui/Page';
import { useStore } from '@/lib/store';
import { sessionStore } from '@/lib/services/sessionRunner';
import { SessionTab } from './SessionTab';
import { CalendarTab, GoalsTab, HistoryTab, WeekPlanTab } from './PlanTabs';

type TabId = 'sessao' | 'plano' | 'calendario' | 'metas' | 'historico';

export default function TrainingPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('aba') as TabId) || 'sessao';
  const running = useStore(sessionStore).running;
  return (
    <Page>
      <PageHeader eyebrow="Aprendizado" title="Centro de Treino" description="Planeje a semana, monte sessões cronometradas, acompanhe metas e a sua consistência. As sugestões se adaptam aos seus resultados, sem impor rotina." />
      <Tabs<TabId>
        value={tab}
        onChange={(t) => setParams({ aba: t })}
        tabs={[
          { value: 'sessao', label: running ? 'Sessão em andamento' : 'Sessão' },
          { value: 'plano', label: 'Plano semanal' },
          { value: 'calendario', label: 'Calendário' },
          { value: 'metas', label: 'Metas' },
          { value: 'historico', label: 'Histórico' },
        ]}
      />
      {tab === 'sessao' && <SessionTab />}
      {tab === 'plano' && <WeekPlanTab />}
      {tab === 'calendario' && <CalendarTab />}
      {tab === 'metas' && <GoalsTab />}
      {tab === 'historico' && <HistoryTab />}
    </Page>
  );
}
