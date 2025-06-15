
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const FREE_PLAN_LIMIT = 10; // 1 geração grátis

// 🔗 Insira aqui a URL pública do webhook do n8n
const N8N_WEBHOOK_URL = "https://seu-servidor.n8n.cloud/webhook/sua-rota"; // <-- Troque para o seu endpoint

const Chat = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Premium status mock (localStorage). Troque/se integre após backend real.
  const isPremium = localStorage.getItem("userPremium") === "true";

  // Limite gratuito (apenas para quem não é premium)
  const freeGenerations = Number(localStorage.getItem("runsheet_free_generations") || 0);
  const availableGenerations = isPremium ? Infinity : (FREE_PLAN_LIMIT - freeGenerations);

  // Função principal de geração: envia para n8n e mostra resposta
  const handleGenerate = async () => {
    if (availableGenerations <= 0) {
      toast({
        title: "Limite Gratuito Atingido",
        description: "Assine para gerar planilhas ilimitadas ou acesse seu histórico.",
        variant: "destructive",
      });
      return;
    }
    if (!input.trim()) {
      toast({ title: "Preencha o campo para gerar!" });
      return;
    }

    setIsLoading(true);
    setOutput(null);

    try {
      // Altere a estrutura do body conforme o n8n espera!
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: "anon", // Simulação: troque por user real se desejar
        }),
      });

      if (!res.ok) throw new Error("Falha ao conectar ao webhook n8n.");

      const data = await res.json();
      // Espera-se que o n8n responda com { output: "..." }
      const chatOutput = data?.output || "Desculpe, não entendi.";

      // Incrementa o uso gratuito se não for premium
      if (!isPremium) {
        localStorage.setItem(
          "runsheet_free_generations",
          String(freeGenerations + 1)
        );
      }

      setOutput(chatOutput);
    } catch (err) {
      toast({
        title: "Erro ao gerar planilha",
        description: "Verifique o webhook do n8n e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center mb-2">
        Gerar Planilha Personalizada
      </h1>

      <p className="text-center text-muted-foreground">
        {isPremium
          ? "Assinante: gerações ilimitadas."
          : availableGenerations > 0
          ? `Você possui ${availableGenerations} geração grátis disponível.`
          : "Você atingiu o limite gratuito. Assine para mais!"}
      </p>

      <div className="flex flex-col gap-4 bg-white rounded-xl shadow p-6">
        <textarea
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Descreva seu objetivo, nível e disponibilidade..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || availableGenerations <= 0}
        />
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={isLoading || availableGenerations <= 0}
        >
          {isLoading ? "Gerando..." : "Gerar Planilha"}
        </Button>
      </div>
      {output && (
        <div className="bg-muted rounded-lg p-5 text-center mt-4 fade-in">
          {/* Lógica extra para borrão/marca d'água para não premium */}
          <p
            className={
              !isPremium &&
              (
                output.includes("```excel") ||
                output.includes("```csv") ||
                output.includes("| ---") ||
                output.includes("<table")
              )
                ? "blur-sm select-none"
                : ""
            }
          >
            {output}
          </p>
          {!isPremium &&
            (
              output.includes("```excel") ||
              output.includes("```csv") ||
              output.includes("| ---") ||
              output.includes("<table")
            ) && (
            <div className="mt-3 py-3 px-4 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs" style={{ userSelect: "none" }}>
              <strong>💡 Conteúdo limitado:</strong> Faça upgrade para desbloquear a visualização e download de planilhas completas.
              <br />
              <Button
                className="mt-2"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Fazer Upgrade
              </Button>
            </div>
          )}
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setOutput(null);
              setInput("");
            }}
          >
            Nova Planilha
          </Button>
        </div>
      )}

      {availableGenerations <= 0 && !isPremium && (
        <div className="text-center mt-6">
          <Button onClick={() => navigate("/dashboard")}>
            Assinar e Liberar Tudo
          </Button>
        </div>
      )}
    </main>
  );
};

export default Chat;

