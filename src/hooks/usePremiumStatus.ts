import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { stripe } from '@/lib/api';

export interface PremiumStatus {
  isPremium: boolean;
  isLoading: boolean;
  subscription: any;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook personalizado para verificar se o usuário atual tem uma assinatura premium
 * Usa um cache local para evitar verificações frequentes e carrega os dados do backend
 */
export function usePremiumStatus(): PremiumStatus {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
    // Função para verificar o status premium
  const checkPremiumStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignedIn && user) {
        console.log('Verificando status premium para usuário:', user.id);
        console.log('Metadados atuais do usuário:', user.publicMetadata);
        
        // Recarregar usuário para garantir metadados atualizados
        try {
          await user.reload();
          console.log('Usuário recarregado, metadados atualizados:', user.publicMetadata);
        } catch (reloadError) {
          console.error('Erro ao recarregar usuário:', reloadError);
        }
        
        // Verificar os metadados do usuário primeiro (é mais rápido)
        if (user.publicMetadata.isPremium === true) {
          console.log('Usuário marcado como premium nos metadados');
          
          // Verificar se existe um período de expiração nos metadados
          if (user.publicMetadata.subscriptionPeriodEnd) {
            const subscriptionEnd = new Date(user.publicMetadata.subscriptionPeriodEnd as string);
            const now = new Date();
            
            console.log('Data de expiração da assinatura:', subscriptionEnd);
            console.log('Data atual:', now);
            
            // Se a data de expiração ainda não chegou, a assinatura está ativa
            if (subscriptionEnd > now) {
              console.log('Assinatura ativa baseada nos metadados');
              setIsPremium(true);
              setSubscription({
                id: user.publicMetadata.subscriptionId,
                status: 'active',
                currentPeriodEnd: user.publicMetadata.subscriptionPeriodEnd
              });
              setIsLoading(false);
              return;
            } else {
              console.log('Assinatura expirada baseada nos metadados');
            }
          } else {
            console.log('Data de expiração não encontrada nos metadados');
          }
        } else {
          console.log('Usuário não marcado como premium nos metadados');
        }
        
        // Se não tiver metadados ou a assinatura expirou, verificar com o servidor
        console.log('Verificando status premium com o servidor...');
        const status = await stripe.checkPremiumStatus(user.id);
        console.log('Resposta do servidor:', status);
        
        setIsPremium(status.isPremium);
        setSubscription(status.subscription);
        
        // Se o servidor retornar premium mas os metadados não refletirem isso, recarregar o usuário
        if (status.isPremium && user.publicMetadata.isPremium !== true) {
          console.log('Servidor indicou que o usuário é premium, mas os metadados não. Recarregando usuário...');
          try {
            await user.reload();
            console.log('Usuário recarregado após verificação do servidor:', user.publicMetadata);
          } catch (reloadError) {
            console.error('Erro ao recarregar usuário após verificação do servidor:', reloadError);
          }
        }
      } else {
        console.log('Usuário não autenticado ou não carregado');
        setIsPremium(false);
        setSubscription(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao verificar status premium'));
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };
    // Verificar o status premium quando o usuário for carregado
  useEffect(() => {
    if (isLoaded) {
      checkPremiumStatus();
      
      // Verificar a cada 10 segundos enquanto o usuário estiver na página
      // Isso é especialmente útil após o checkout, quando o status premium pode levar alguns segundos para atualizar
      const intervalId = setInterval(() => {
        if (isSignedIn && user) {
          console.log('Verificação periódica do status premium');
          checkPremiumStatus();
        }
      }, 10000);
      
      return () => clearInterval(intervalId);
    }
  }, [isLoaded, isSignedIn, user]);
  
  return {
    isPremium,
    isLoading,
    subscription,
    error,
    refresh: checkPremiumStatus
  };
}
