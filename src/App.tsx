import { lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { NotFound } from '@/features/NotFound';

const Dashboard = lazy(() => import('@/features/dashboard/DashboardPage'));
const Studio = lazy(() => import('@/features/board/StudioPage'));
const Play = lazy(() => import('@/features/play/PlayPage'));
const Conversa = lazy(() => import('@/features/conversa/ConversaPage'));
const Puzzles = lazy(() => import('@/features/puzzles/PuzzlesPage'));
const Academy = lazy(() => import('@/features/academy/AcademyPage'));
const Lesson = lazy(() => import('@/features/academy/LessonPage'));
const Openings = lazy(() => import('@/features/openings/OpeningsPage'));
const OpeningDetail = lazy(() => import('@/features/openings/OpeningDetailPage'));
const Performance = lazy(() => import('@/features/performance/PerformancePage'));
const Notebook = lazy(() => import('@/features/notebook/NotebookPage'));
const Training = lazy(() => import('@/features/training/TrainingPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tabuleiro" element={<Studio />} />
          <Route path="jogar" element={<Play />} />
          <Route path="conversa" element={<Conversa />} />
          <Route path="puzzles" element={<Puzzles />} />
          <Route path="academia" element={<Academy />} />
          <Route path="academia/:lessonId" element={<Lesson />} />
          <Route path="aberturas" element={<Openings />} />
          <Route path="aberturas/:openingId" element={<OpeningDetail />} />
          <Route path="desempenho" element={<Performance />} />
          <Route path="caderno" element={<Notebook />} />
          <Route path="treino" element={<Training />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
