import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { clients, runningPlans, ClientData, RunningPlan } from "@/lib/api";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ClientManager = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientData | null>(null);
  const [plans, setPlans] = useState<RunningPlan[]>([]);

  useEffect(() => {
    const loadClientData = async () => {
      if (!clientId) {
        navigate("/dashboard");
        return;
      }

      try {
        // In a real app, fetch client from API
        const clientsData = await clients.getClients("coach_123");
        const foundClient = clientsData.find((c: ClientData) => c.id === clientId);
        
        if (foundClient) {
          setClient(foundClient);
          
          // Get client's plans
          const clientPlans = await runningPlans.getClientPlans(clientId);
          setPlans(clientPlans);
        } else {
          navigate("/dashboard");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading client data:", error);
        setLoading(false);
      }
    };
    
    loadClientData();
  }, [clientId, navigate]);

  const handleCreatePlan = () => {
    navigate(`/new-chat?clientId=${clientId}`);
  };

  const handleDownloadPDF = async (plan: RunningPlan) => {
    // This is a simplified example - in a real implementation,
    // you'd have a more sophisticated PDF generation
    try {
      const planElement = document.getElementById(`plan-${plan.id}`);
      if (!planElement) return;
      
      const canvas = await html2canvas(planElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${plan.title || 'running-plan'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await runningPlans.deletePlan(planId);
      setPlans(plans.filter((plan) => plan.id !== planId));
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto py-12 flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Gerenciar Cliente</h1>
      </div>

      {client && (
        <Card>
          <CardHeader>
            <CardTitle>{client.name}</CardTitle>
            <CardDescription>{client.email}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCreatePlan}>Criar Nova Planilha</Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid gap-8">
        <h2 className="text-2xl font-semibold">Planilhas de Treino</h2>
        
        {plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.title || "Planilha de Treino"}</CardTitle>
                <CardDescription>
                  Criado em: {new Date(plan.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {/* Render plan content */}
                <div id={`plan-${plan.id}`} className="p-4 border rounded-md bg-white">
                  {/* This would be replaced with the actual plan content */}
                  <div dangerouslySetInnerHTML={{ __html: plan.content }} />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(plan)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border rounded-md">
            <p className="text-muted-foreground">
              Nenhuma planilha de treino criada para este cliente.
            </p>
            <Button onClick={handleCreatePlan} className="mt-4">
              Criar Primeira Planilha
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ClientManager;
