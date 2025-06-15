
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const FREE_PLAN_LIMIT = 1; // 1 geração grátis

const Chat = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // n8n Webhook URL management
  const [webhookUrl, setWebhookUrl] = useState<string>(
    localStorage.getItem("runsheet_n8n_webhook") || ""
  );
  const webhookInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  // Premium status mock (localStorage). Troque/se integre após backend real.
  const isPremium = localStorage.getItem("userPremium") === "true";

  // Limite gratuito (apenas para quem não é premium)
  const freeGenerations = Number(localStorage.getItem("runsheet_free_generations") || 0);
  const availableGenerations = isPremium ? Infinity : (FREE_PLAN_LIMIT - freeGenerations);

  // Salvar Webhook URL no localStorage, uso persistente
  const handleSaveWebhook = () => {
    if (!webhookUrl.trim()) {
      toast({ title: "Insira a URL do Webhook do n8n!" });
      return;
    }
    localStorage.setItem("runsheet_n8n_webhook", webhookUrl.trim());
    toast({ title: "Webhook salvo!" });
  };

  // Função principal de geração: envia para n8n e mostra resposta
  const handleGenerate = async () => {
    if (!webhookUrl.trim()) {
      toast({ title: "Configure o Webhook do n8n antes de gerar!" });
      return;
    }
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
      // Exemplo: altere body/estrutura para o que seu n8n espera.
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: "anon", // Simulação, troque por user real se existir
        }),
      });

      if (!res.ok) throw new Error("Falha ao conectar ao webhook n8n.");

      const data = await res.json();
      // Espera-se que o n8n responda com { output: "..." }
      const chatOutput = data?.output || "Desculpe, não entendi.";

      // Simula incremento do uso gratuito se não for premium
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
      <div className="flex flex-col items-center justify-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          URL do Webhook do n8n
        </label>
        <div className="flex w-full gap-2">
          <input
            ref={webhookInputRef}
            type="url"
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="https://seu-servidor.n8n.cloud/webhook/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
          <Button
            variant="secondary"
            onClick={handleSaveWebhook}
            disabled={isLoading || !webhookUrl.trim()}
            type="button"
          >
            Salvar
          </Button>
        </div>
        {!webhookUrl && (
          <span className="text-xs text-destructive mt-1">
            Configure o webhook do n8n antes de gerar.
          </span>
        )}
      </div>

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
          disabled={isLoading || availableGenerations <= 0 || !webhookUrl}
        />
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={
            isLoading || availableGenerations <= 0 || !webhookUrl
          }
        >
          {isLoading ? "Gerando..." : "Gerar Planilha"}
        </Button>
      </div>
      {output && (
        <div className="bg-muted rounded-lg p-5 text-center mt-4 fade-in">
          {/* Aqui é possível adicionar lógica extra para borrão/marca d'água para não premium */}
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
