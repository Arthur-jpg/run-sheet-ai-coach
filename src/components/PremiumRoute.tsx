import { Navigate } from 'react-router-dom';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useUser } from '@clerk/clerk-react';
import { ReactNode } from 'react';

interface PremiumRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas que exigem uma assinatura premium
 * Redireciona usuários sem assinatura para a página de dashboard
 */
export default function PremiumRoute({ 
  children, 
  redirectTo = '/dashboard'
}: PremiumRouteProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { isPremium, isLoading } = usePremiumStatus();
  
  // Aguarde o carregamento do status de autenticação e premium
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirecionar para login se não estiver autenticado
  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }
  
  // Redirecionar para a página especificada se não for premium
  if (!isPremium) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Permitir acesso à rota protegida
  return <>{children}</>;
}
