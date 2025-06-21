
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

const PaymentCanceled = () => {
  const navigate = useNavigate();
  
  return (
    <main className="max-w-lg mx-auto py-12 flex flex-col items-center gap-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Pagamento Cancelado</CardTitle>
          <CardDescription>
            Sua assinatura não foi confirmada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            O pagamento não foi concluído. Você pode tentar novamente ou entrar em contato com o suporte se precisar de ajuda.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            Voltar ao Início
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Tentar Novamente
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

export default PaymentCanceled;
