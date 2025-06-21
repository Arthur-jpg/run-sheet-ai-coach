import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CreditCard, ArrowLeft } from "lucide-react";
import { clients, ClientData, runningPlans } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const FREE_PLAN_LIMIT = 3; // 3 mensagens gratuitas por chat

// Acessa as variáveis de ambiente usando import.meta.env (Vite)
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ""; 
const N8N_WEBHOOK_ROUTE = import.meta.env.VITE_N8N_WEBHOOK_ROUTE || "";

// Verificação de segurança: alerta se as variáveis de ambiente não estão definidas
if (!N8N_WEBHOOK_URL || !N8N_WEBHOOK_ROUTE) {
  console.error("⚠️ As variáveis de ambiente do webhook n8n não estão configuradas!");
}

// Funções de utilidade para chat history
const getCurrentChatId = () => {
  let chatId = localStorage.getItem('current_chat_id');
  if (!chatId) {
    chatId = `chat_${Date.now()}`;
    localStorage.setItem('current_chat_id', chatId);
  }
  return chatId;
};

const getChatHistory = (chatId: string) => {
  const history = localStorage.getItem(`chat_history_${chatId}`);
  return history ? JSON.parse(history) : [];
};

const saveChatHistory = (chatId: string, history: ChatMessage[]) => {
  localStorage.setItem(`chat_history_${chatId}`, JSON.stringify(history));
};

const getChats = () => {
  const chats = localStorage.getItem('runsheet_chats');
  return chats ? JSON.parse(chats) : [];
};

const saveChats = (chats: any[]) => {
  localStorage.setItem('runsheet_chats', JSON.stringify(chats));
};

// Verifica se uma mensagem contém uma planilha
const containsSheet = (text: string): boolean => {
  return (
    text.includes("```excel") ||
    text.includes("```csv") ||
    text.includes("| ---") ||
    text.includes("<table")
  );
};

// Interface para as mensagens do chat
interface ChatMessage {
  from: "user" | "assistant";
  text: string;
  timestamp?: string;
  containsSheet?: boolean;
}

const Chat = () => {
  // Get client ID from URL query parameters
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientId = queryParams.get('clientId');
  const [client, setClient] = useState<ClientData | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<"checking" | "available" | "unavailable">("available");
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = useRef<string>(getCurrentChatId());

  // Premium status mock (localStorage). Troque/se integre após backend real.
  const isPremium = localStorage.getItem("userPremium") === "true";
  // Carrega as mensagens ao iniciar
  useEffect(() => {
    const history = getChatHistory(chatId.current);
    setMessages(history);
    
    // If clientId is provided, fetch client details
    if (clientId) {
      const fetchClient = async () => {
        try {
          // In a real app, fetch from API
          const clientsData = await clients.getClients("coach_123");
          const foundClient = clientsData.find((c: ClientData) => c.id === clientId);
          
          if (foundClient) {
            setClient(foundClient);
            // Set initial prompt with client information
            setInput(`Crie uma planilha de treino personalizada para ${foundClient.name}.`);
          }
        } catch (error) {
          console.error("Error fetching client:", error);
        }
      };
      
      fetchClient();
    }
  }, [clientId]);

  // Rola para a última mensagem quando adicionada
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Limite gratuito (apenas para quem não é premium)
  const userMessageCount = messages.filter(m => m.from === "user").length;
  const availableMessages = isPremium ? Infinity : (FREE_PLAN_LIMIT - userMessageCount);

  // Verifica se o webhook está disponível (simplificado para sempre disponível)
  useEffect(() => {
    const webhookDomain = N8N_WEBHOOK_URL.match(/^(https?:\/\/[^\/]+)/)?.[1] || N8N_WEBHOOK_URL;
    fetch(webhookDomain, { 
      method: "HEAD", 
      mode: "no-cors",
      signal: AbortSignal.timeout(3000)
    }).catch(() => {
      console.warn("Aviso: Domínio do webhook pode estar indisponível, mas tentaremos mesmo assim.");
    });
  }, []);

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!input.trim()) {
      toast({ title: "Digite uma mensagem primeiro!" });
      return;
    }
    
    if (availableMessages <= 0 && !isPremium) {
      toast({
        title: "Limite Gratuito Atingido",
        description: "Você já utilizou suas 3 mensagens gratuitas. Assine para continuar conversando.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Adiciona mensagem do usuário ao chat
    const userMessage: ChatMessage = { 
      from: "user", 
      text: input, 
      timestamp: new Date().toISOString() 
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveChatHistory(chatId.current, updatedMessages);
    
    // Se é o primeiro mensagem neste chat, atualiza a lista de chats
    const chats = getChats();
    if (!chats.some(c => c.id === chatId.current)) {
      chats.push({
        id: chatId.current,
        name: input.length > 30 ? input.slice(0, 30) + "..." : input,
        createdAt: new Date().toISOString(),
        history: updatedMessages
      });
      saveChats(chats);
    } else {
      // Atualiza o chat existente
      const chatIndex = chats.findIndex(c => c.id === chatId.current);
      if (chatIndex !== -1) {
        chats[chatIndex].history = updatedMessages;
        saveChats(chats);
      }
    }
    
    // Limpa o input
    setInput("");

    try {
      // Envia para o webhook
      const fullWebhookUrl = `${N8N_WEBHOOK_URL}/${N8N_WEBHOOK_ROUTE}`;
      
      const res = await fetch(fullWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatId.current,
          message: userMessage.text,
          route: N8N_WEBHOOK_ROUTE
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Sem detalhes de erro disponíveis");
        console.error(`Erro do webhook (Status ${res.status}):`, errorText);
        throw new Error(`Falha ao conectar ao webhook n8n. Status: ${res.status}`);
      }

      const data = await res.json();
      const assistantResponse = data?.output || "Desculpe, não entendi.";
      
      // Verifica se contém uma planilha
      const hasSheet = containsSheet(assistantResponse);
      
      // Adiciona resposta do assistente
      const assistantMessage: ChatMessage = { 
        from: "assistant", 
        text: assistantResponse, 
        timestamp: new Date().toISOString(),
        containsSheet: hasSheet
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
        // Salva no histórico local
      saveChatHistory(chatId.current, finalMessages);
      
      // Atualiza o chat na lista
      const updatedChats = getChats();
      const chatIndex = updatedChats.findIndex(c => c.id === chatId.current);
      if (chatIndex !== -1) {
        updatedChats[chatIndex].history = finalMessages;
        saveChats(updatedChats);
      }
      
      // If this is a client-specific plan, save it to the client's plans
      if (clientId && client && hasSheet) {
        try {
          // Save the running plan for this client
          await runningPlans.createPlan(clientId, {
            title: `Planilha para ${client.name} - ${new Date().toLocaleDateString()}`,
            content: assistantResponse
          });
          
          toast({
            title: "Planilha Salva",
            description: `A planilha foi salva para ${client.name}.`,
          });
        } catch (error) {
          console.error("Error saving plan:", error);
          toast({
            title: "Erro ao Salvar Planilha",
            description: "Não foi possível salvar a planilha para este cliente.",
            variant: "destructive",
          });
        }
      }

    } catch (err) {
      console.error("Erro detalhado:", err);
      
      // Adiciona mensagem de erro do sistema
      const errorMessage: ChatMessage = {
        from: "assistant",
        text: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date().toISOString()
      };
      
      const messagesWithError = [...updatedMessages, errorMessage];
      setMessages(messagesWithError);
      saveChatHistory(chatId.current, messagesWithError);
      
      toast({
        title: "Erro ao conectar com o webhook",
        description: err instanceof Error ? err.message : "Verifique o webhook do n8n e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderiza uma mensagem individual
  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.from === "user";
    
    // Verifica se é uma planilha e se o usuário não é premium
    const shouldBlur = !isPremium && message.containsSheet;
    
    return (
      <div 
        key={index} 
        className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`max-w-3/4 rounded-lg p-4 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <pre 
            className={`whitespace-pre-wrap ${shouldBlur ? 'blur-sm select-none' : ''}`}
            style={{ fontFamily: 'inherit' }}
          >
            {message.text}
          </pre>
          
          {shouldBlur && (
            <div className="mt-2 py-2 px-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
              <strong>💡 Conteúdo limitado:</strong> Faça upgrade para visualizar planilhas completas.
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <main className="max-w-3xl mx-auto py-6 flex flex-col h-[calc(100vh-60px)]">
      <div className="flex items-center justify-between mb-2">
        <Button variant="ghost" onClick={() => navigate(client ? "/dashboard" : "/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {client ? "Voltar ao Dashboard" : "Voltar ao Início"}
        </Button>
        
        <h1 className="text-2xl font-bold text-center">
          Assistente de Planilhas de Treino
        </h1>
        
        <div className="w-[100px]"></div>
      </div>
      
      {client && (
        <div className="flex items-center justify-center mb-4">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Criando planilha para: <span className="font-semibold ml-1">{client.name}</span>
          </Badge>
        </div>
      )}

      <p className="text-center text-muted-foreground mb-4">
        {isPremium
          ? "Assinante: conversas ilimitadas."
          : availableMessages > 0
          ? `Você possui ${availableMessages} ${availableMessages === 1 ? 'mensagem gratuita' : 'mensagens gratuitas'} restante${availableMessages === 1 ? '' : 's'}.`
          : "Você atingiu o limite gratuito. Assine para continuar!"}
      </p>

      {/* Área de mensagens */}
      <div className="flex-grow bg-white rounded-lg shadow overflow-y-auto p-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-2">
              Descreva seu objetivo de treino, nível e disponibilidade para começar...
            </p>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Área de entrada */}
      <div className="flex gap-2 items-end">
        <Textarea
          className="flex-grow resize-none"
          rows={2}
          placeholder={availableMessages <= 0 && !isPremium 
            ? "Assine para continuar conversando..." 
            : "Digite sua mensagem..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading || (availableMessages <= 0 && !isPremium)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button 
          className="h-10 px-4"
          onClick={handleSendMessage}
          disabled={isLoading || (availableMessages <= 0 && !isPremium)}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      {/* Botão de upgrade para usuários que atingiram o limite */}
      {availableMessages <= 0 && !isPremium && (
        <div className="mt-4 text-center">
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="default" 
            className="px-4"
          >
            <CreditCard className="h-4 w-4 mr-2" /> Assinar para Continuar
          </Button>
        </div>
      )}
    </main>
  );
};

export default Chat;
