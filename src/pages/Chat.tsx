import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const FREE_PLAN_LIMIT = 10; // 1 geração grátis

// Acessa as variáveis de ambiente usando import.meta.env (Vite)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ""; 
const N8N_WEBHOOK_ROUTE = import.meta.env.VITE_N8N_WEBHOOK_ROUTE || "";

// Verificação de segurança: alerta se as variáveis de ambiente não estão definidas
if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_ROUTE) {
  console.error("⚠️ As variáveis de ambiente do webhook n8n não estão configuradas!");
}

// Funções de utilidade para chat history, similar ao exemplo que funcionou
const getCurrentChatId = () => {
  let chatId = localStorage.getItem('current_chat_id');
  if (!chatId) {
    chatId = `chat_${Date.now()}`;
    localStorage.setItem('current_chat_id', chatId);
  }
  return chatId;
};

const getChatHistory = (chatId) => {
  const history = localStorage.getItem(`chat_history_${chatId}`);
  return history ? JSON.parse(history) : [];
};

const saveChatHistory = (chatId, history) => {
  localStorage.setItem(`chat_history_${chatId}`, JSON.stringify(history));
};

const getChats = () => {
  const chats = localStorage.getItem('runsheet_chats');
  return chats ? JSON.parse(chats) : [];
};

const saveChats = (chats) => {
  localStorage.setItem('runsheet_chats', JSON.stringify(chats));
};

const Chat = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<"checking" | "available" | "unavailable">("checking");

  const navigate = useNavigate();

  // Premium status mock (localStorage). Troque/se integre após backend real.
  const isPremium = localStorage.getItem("userPremium") === "true";

  // Limite gratuito (apenas para quem não é premium)
  const freeGenerations = Number(localStorage.getItem("runsheet_free_generations") || 0);
  const availableGenerations = isPremium ? Infinity : (FREE_PLAN_LIMIT - freeGenerations);
  // Verifica se o webhook está disponível ao carregar a página
  useEffect(() => {
    // Uma vez que o webhook funciona com POST e não com OPTIONS,
    // vamos presumir que ele está sempre disponível ou verificá-lo de outra forma
    setWebhookStatus("available");
    
    // Se você quiser fazer uma verificação real posteriormente, pode
    // usar um endpoint de status ou health check específico
    // ou verificar apenas se o domínio está acessível
    const checkDomainOnly = async () => {
      try {        // Verifica apenas se o domínio base é acessível, não o webhook específico
        // Isso evita problemas com CORS ou métodos não suportados
        // Extrai o domínio base da URL do webhook
        const webhookDomain = N8N_WEBHOOK_URL.match(/^(https?:\/\/[^\/]+)/)?.[1] || N8N_WEBHOOK_URL;
        await fetch(webhookDomain, { 
          method: "HEAD",
          mode: "no-cors", // Isso permite verificar sem problemas de CORS
          signal: AbortSignal.timeout(3000)
        });
        // Se não lançou exceção, consideramos que o serviço está online
      } catch (err) {
        console.warn("Aviso: Domínio do webhook pode estar indisponível, mas tentaremos mesmo assim.");
        // Não alteramos o status para evitar bloquear funcionalidade que pode estar funcionando
      }
    };
    
    checkDomainOnly();
  }, []);

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
    }    // Removida verificação de disponibilidade do webhook, já que o POST funciona mesmo quando OPTIONS falha

    setIsLoading(true);
    setOutput(null);

    try {      // Usando a estrutura que funcionou anteriormente
      const fullWebhookUrl = `${N8N_WEBHOOK_URL}/${N8N_WEBHOOK_ROUTE}`;
        // Obtém o chatId atual
      const chatId = getCurrentChatId();
      
      // Salva mensagem do usuário no histórico
      let history = getChatHistory(chatId);
      history.push({ from: "user", text: input });
      saveChatHistory(chatId, history);
      
      // Se é a primeira mensagem, salva como nome do chat
      const chats = getChats();
      if (!chats.some(c => c.id === chatId)) {
        chats.push({
          id: chatId,
          name: input.length > 30 ? input.slice(0, 30) + "..." : input,
          history: history
        });
        saveChats(chats);
      }
      
      const res = await fetch(fullWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId,
          message: input,
          route: N8N_WEBHOOK_ROUTE
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Sem detalhes de erro disponíveis");
        console.error(`Erro do webhook (Status ${res.status}):`, errorText);
        throw new Error(`Falha ao conectar ao webhook n8n. Status: ${res.status}`);
      }      const data = await res.json();
      // Espera-se que o n8n responda com { output: "..." }
      const chatOutput = data?.output || "Desculpe, não entendi.";

      // Salva resposta no histórico do chat
      let updatedHistory = getChatHistory(chatId);
      updatedHistory.push({ from: "assistant", text: chatOutput });
      saveChatHistory(chatId, updatedHistory);

      // Atualiza o chat na lista
      let updatedChats = getChats();
      const chatIndex = updatedChats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        updatedChats[chatIndex].history = updatedHistory;
        saveChats(updatedChats);
      }

      // Incrementa o uso gratuito se não for premium
      if (!isPremium) {
        localStorage.setItem(
          "runsheet_free_generations",
          String(freeGenerations + 1)
        );
      }

      setOutput(chatOutput);
    } catch (err) {
      console.error("Erro detalhado:", err);
      toast({
        title: "Erro ao conectar com o webhook",
        description: err instanceof Error ? err.message : "Verifique o webhook do n8n e tente novamente.",
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
      </h1>      {/* Removido aviso de serviço indisponível, já que o webhook POST está funcionando */}

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
          placeholder="Descreva seu objetivo, nível e disponibilidade..."          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || availableGenerations <= 0}
        />
        <Button          className="w-full"
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

