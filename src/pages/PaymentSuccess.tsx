
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  
  // In a real app, you'd verify the payment session here
  useEffect(() => {
    // This could verify the payment via a backend API call
    // For example, by checking URL parameters containing session ID
    console.log("Payment successful, session parameters:", window.location.search);
  }, []);
  
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
            <p className="text-center text-muted-foreground">
              Agora você tem acesso ilimitado à versão premium do RunSheet AI Coach! Você pode:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Gerenciar múltiplos clientes</li>
              <li>Criar planilhas personalizadas para cada cliente</li>
              <li>Acessar histórico completo de planilhas</li>
              <li>Exportar planilhas em diferentes formatos</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => navigate("/dashboard")}>
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

export default PaymentSuccess;
