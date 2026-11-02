import { ChessPawn } from 'lucide-react';
import { Page } from '@/components/ui/Page';
import { EmptyState } from '@/components/ui/Feedback';
import { ButtonLink } from '@/components/ui/Button';

export function NotFound() {
  return (
    <Page>
      <EmptyState
        icon={<ChessPawn />}
        title="Página não encontrada"
        description="Este endereço não existe por aqui."
        action={
          <ButtonLink to="/" variant="primary">Voltar ao Painel</ButtonLink>
        }
      />
    </Page>
  );
}
