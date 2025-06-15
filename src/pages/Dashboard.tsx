
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  // Placeholder de autenticação e dados do usuário
  const isSubscribed = false; // Simule integração; altere via Supabase/Stripe depois
  const savedPlans = []; // A lista virá do backend

  return (
    <main className="max-w-3xl mx-auto py-12 flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-center">Minha Área</h1>
      <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-4">
        <div>
          <strong>Status:</strong>{" "}
          <span
            className={
              isSubscribed
                ? "text-green-700 font-semibold"
                : "text-destructive font-semibold"
            }
          >
            {isSubscribed ? "Assinante Ativo" : "Grátis (limitado)"}
          </span>
        </div>
        {!isSubscribed && (
          <Button
            className="w-full max-w-xs"
            onClick={() => window.alert("Integração Stripe/Supabase vai aqui!")}
          >
            Assinar RunSheet
          </Button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold mb-4">Histórico de Planilhas</h2>
        <ul>
          {savedPlans.length > 0 ? (
            savedPlans.map((plan: any, i: number) => (
              <li key={i} className="py-2 border-b last:border-b-0">
                <span className="font-medium">{plan.title || "Planilha"}</span>
                {/* TODO: adicionar botões de download e excluir */}
              </li>
            ))
          ) : (
            <li className="text-gray-500">Nenhuma planilha salva ainda.</li>
          )}
        </ul>
      </div>
      <Button variant="secondary" onClick={() => navigate("/")}>
        Voltar para o Início
      </Button>
    </main>
  );
};

export default Dashboard;
