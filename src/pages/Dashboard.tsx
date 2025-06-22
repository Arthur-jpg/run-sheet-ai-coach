
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { stripe, clients, runningPlans, ClientData, RunningPlan } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState as useForm } from "react";
import { useUser } from '@clerk/clerk-react';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { FreePlanOnly, PremiumOnly } from '@/components/PremiumGuard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { isPremium, subscription, isLoading: premiumLoading, refresh: refreshPremium } = usePremiumStatus();
  
  const [loading, setLoading] = useState(true);
  const [clientsList, setClientsList] = useState<ClientData[]>([]);
  const [plansList, setPlansList] = useState<RunningPlan[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Carregar clientes e planos quando o usuário estiver carregado e após verificar o status premium
  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded || !isSignedIn || premiumLoading) {
        return;
      }
      
      setLoading(true);
      try {
        // Obter a lista de clientes
        const userId = user?.id;
        if (!userId) return;
          const clientsData = await clients.getClients(userId);
        setClientsList(clientsData);
        
        const plansData = await runningPlans.getCoachPlans(userId);
        setPlansList(plansData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isLoaded && isSignedIn) {
      loadData();
    }
  }, [isLoaded, isSignedIn, user?.id, premiumLoading]);  const handleSubscribe = async () => {
    try {
      // Use the price ID from environment variables
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID;
      console.log("Iniciando checkout com priceId:", priceId);
      
      if (!priceId) {
        throw new Error("Preço não configurado. Verifique a variável VITE_STRIPE_PRICE_ID no arquivo .env");
      }
      
      // Validação básica do formato do price ID
      if (!priceId.startsWith('price_')) {
        console.warn("AVISO: O ID não parece ser um price_id válido:", priceId);
      }
      
      // Agora enviamos o ID do usuário Clerk para o checkout
      if (user?.id) {
        await stripe.createCheckoutSession(priceId, user.id);
      } else {
        throw new Error("Usuário não está autenticado");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert(`Erro ao criar sessão de checkout: ${error.message}. Verifique o console para mais detalhes.`);
    }
  };
  
  // Handle client creation
  const handleCreateClient = async () => {
    try {
      if (!clientName || !clientEmail) return;
      
      const newClient = await clients.createClient({
        name: clientName,
        email: clientEmail
      });
      
      setClientsList([...clientsList, newClient]);
      setClientName("");
      setClientEmail("");
      setDialogOpen(false);
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };
  
  // Handle client selection
  const handleSelectClient = async (clientId: string) => {
    setSelectedClient(clientId);
    
    try {
      const clientPlans = await runningPlans.getClientPlans(clientId);
      // Filter only plans for this client
      setPlansList(clientPlans);
    } catch (error) {
      console.error("Error getting client plans:", error);
    }
  };
  return (
    <main className="max-w-5xl mx-auto py-12 flex flex-col gap-10">
      <h1 className="text-3xl font-bold text-center">Dashboard do Treinador</h1>
      
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Assinatura</CardTitle>
          <CardDescription>
            Gerencie seu acesso premium ao RunSheet AI Coach
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <strong>Status:</strong>{" "}
            <span
              className={
                isPremium
                  ? "text-green-700 font-semibold"
                  : "text-destructive font-semibold"
              }
            >
              {loading || premiumLoading ? "Verificando..." : isPremium ? "Assinante Ativo" : "Grátis (limitado)"}            </span>
            {(loading || premiumLoading) && (
              <span className="ml-2 inline-block animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
            )}
            <Button 
              variant="link" 
              size="sm" 
              className="ml-2 text-xs text-muted-foreground" 
              onClick={refreshPremium}
              disabled={loading || premiumLoading}
            >
              Atualizar Status
            </Button>
          </div>
          {subscription && (
            <div>
              <p className="text-sm text-muted-foreground">
                Assinatura ativa desde: {new Date(subscription.created * 1000).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Próxima cobrança: {subscription?.current_period_end ? 
                  new Date(subscription.current_period_end * 1000).toLocaleDateString() : 
                  'Informação não disponível'
                }
              </p>
            </div>          )}
        </CardContent>
        <CardFooter className="flex gap-4 justify-center">
          <FreePlanOnly>
            <div className="flex gap-4">
              <Button
                className="max-w-xs"
                onClick={handleSubscribe}
              >
                Assinar RunSheet Premium
              </Button>
              <Button
                variant="secondary"
                className="max-w-xs"
                onClick={() => {
                  window.location.href = `${import.meta.env.VITE_API_URL}/test-checkout`;
                }}
              >
                Testar Checkout
              </Button>
            </div>
          </FreePlanOnly>
          
          <PremiumOnly>
            <Button
              variant="outline"
              className="w-full max-w-xs"
              onClick={() => {
                if (subscription?.id) {
                  stripe.cancelSubscription(subscription.id);
                }
              }}
            >
              Cancelar Assinatura
            </Button>
          </PremiumOnly>
        </CardFooter>
      </Card>
      
      {/* Premium Features */}
      <PremiumOnly>
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Área Premium</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Adicionar Cliente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Cliente</DialogTitle>
                  <DialogDescription>
                    Adicione informações do seu cliente para gerar planilhas de treino.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateClient}>Criar Cliente</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Tabs defaultValue="clients">
            <TabsList>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="plans">Planilhas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="clients" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Clientes</CardTitle>
                  <CardDescription>
                    Gerencie seus clientes e gere planilhas personalizadas para cada um
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsList.length > 0 ? (
                    <div className="grid gap-4">
                      {clientsList.map((client) => (
                        <div 
                          key={client.id} 
                          className="p-4 border rounded-md flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleSelectClient(client.id || "")}
                        >
                          <div>
                            <h3 className="font-semibold">{client.name}</h3>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                          </div>
                          <div className="flex space-x-2">                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/new-chat?clientId=${client.id}`);
                              }}
                            >
                              Gerar Planilha
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/client/${client.id}`);
                              }}
                            >
                              Gerenciar
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (client.id) {
                                  clients.deleteClient(client.id);
                                  setClientsList(clientsList.filter(c => c.id !== client.id));
                                }
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>Nenhum cliente cadastrado.</p>
                      <p>Clique em "Adicionar Cliente" para começar.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="plans" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Planilhas Geradas</CardTitle>
                  <CardDescription>
                    Veja todas as planilhas geradas para seus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plansList.length > 0 ? (
                    <div className="grid gap-4">
                      {plansList.map((plan) => (
                        <div 
                          key={plan.id} 
                          className="p-4 border rounded-md flex justify-between items-center"
                        >
                          <div>
                            <h3 className="font-semibold">{plan.title || "Planilha"}</h3>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {
                                clientsList.find(c => c.id === plan.clientId)?.name || "Desconhecido"
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criado em: {new Date(plan.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Visualizar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                runningPlans.deletePlan(plan.id);
                                setPlansList(plansList.filter(p => p.id !== plan.id));
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>Nenhuma planilha gerada ainda.</p>
                      <p>Selecione um cliente para gerar uma planilha de treino.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>        </>
      </PremiumOnly>
      
      <Button variant="secondary" onClick={() => navigate("/")}>
        Voltar para o Início
      </Button>
    </main>
  );
  // Handle plan deletion
  const handleDeletePlan = async (planId: string) => {
    try {
      await runningPlans.deletePlan(planId);
      setPlansList(plansList.filter(p => p.id !== planId));
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };
  
  // Handle client deletion
  const handleDeleteClient = async (clientId: string) => {
    try {
      await clients.deleteClient(clientId);
      setClientsList(clientsList.filter(c => c.id !== clientId));
      
      // Also remove plans associated with this client
      setPlansList(plansList.filter(p => p.clientId !== clientId));
      
      if (selectedClient === clientId) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };
};

export default Dashboard;
