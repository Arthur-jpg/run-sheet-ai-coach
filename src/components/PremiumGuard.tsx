import { useUser } from '@clerk/clerk-react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface PremiumGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que renderiza o conteúdo apenas se o usuário tiver uma assinatura premium
 * Caso contrário, exibe uma mensagem para fazer upgrade ou o conteúdo de fallback
 */
export function PremiumGuard({ children, fallback }: PremiumGuardProps) {
  const { isSignedIn } = useUser();
  const { isPremium, isLoading } = usePremiumStatus();
  const navigate = useNavigate();
  
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
        <p className="mb-6">Você precisa estar logado para acessar este conteúdo.</p>
        <Button onClick={() => navigate('/')}>Fazer Login</Button>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isPremium) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Recurso Premium</h2>
        <p className="mb-6">
          Este recurso está disponível apenas para assinantes premium.
          Faça upgrade da sua conta para acessar.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Fazer Upgrade</Button>
      </div>
    );
  }
  
  return <>{children}</>;
}

/**
 * Componente que renderiza o conteúdo apenas se o usuário NÃO tiver uma assinatura premium
 * Útil para mostrar opções de upgrade apenas para usuários free
 */
export function FreePlanOnly({ children, fallback }: PremiumGuardProps) {
  const { isSignedIn } = useUser();
  const { isPremium, isLoading } = usePremiumStatus();
  
  if (!isSignedIn || isLoading) {
    return null;
  }
  
  if (isPremium) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}

/**
 * Componente que renderiza o conteúdo apenas se o usuário tiver uma assinatura premium
 * O oposto do FreePlanOnly
 */
export function PremiumOnly({ children, fallback }: PremiumGuardProps) {
  const { isSignedIn } = useUser();
  const { isPremium, isLoading } = usePremiumStatus();
  
  if (!isSignedIn || isLoading) {
    return null;
  }
  
  if (!isPremium) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
}
