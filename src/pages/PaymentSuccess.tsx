
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { stripe } from '@/lib/api';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { refresh: refreshPremium } = usePremiumStatus();
  const [verifying, setVerifying] = useState(true);
  
  // Verificar o pagamento e atualizar o status premium
  useEffect(() => {
    const verifyPayment = async () => {
      console.log("Verificando pagamento bem-sucedido:", window.location.search);
      
      if (isLoaded && isSignedIn && user) {
        try {
          console.log("Recarregando dados do usuário após pagamento...");
          
          // Forçar uma atualização dos metadados do usuário
          await user.reload();
          
          // Verificar o status premium diretamente com o servidor
          if (user.id) {
            console.log("Verificando status premium no servidor para:", user.id);
            await stripe.checkPremiumStatus(user.id);
            
            // Atualizar o hook de status premium
            await refreshPremium();
          }
        } catch (error) {
          console.error("Erro ao verificar pagamento:", error);
        } finally {
          setVerifying(false);
        }
      } else {
        setVerifying(false);
      }
    };
    
    verifyPayment();
  }, [isLoaded, isSignedIn, user, refreshPremium]);
    return (
    <main className="max-w-lg mx-auto py-12 flex flex-col items-center gap-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Pagamento Realizado 🎉</CardTitle>
          <CardDescription>
            Sua assinatura foi confirmada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {verifying ? (
              <div className="text-center">
                <p className="mb-4">Verificando seu pagamento...</p>
                <div className="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Agora você tem acesso ilimitado à versão premium do RunSheet AI Coach! Você pode:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Gerenciar múltiplos clientes</li>
                  <li>Criar planilhas personalizadas para cada cliente</li>
                  <li>Acessar histórico completo de planilhas</li>
                  <li>Exportar planilhas em diferentes formatos</li>
                </ul>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Pode levar alguns segundos até que o acesso premium seja ativado em todas as páginas.
                  Se os recursos premium não aparecerem imediatamente, atualize a página do dashboard.
                </p>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => navigate("/dashboard")} 
            disabled={verifying}
          >
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

export default PaymentSuccess;
