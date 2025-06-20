import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CreditCard, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const FREE_PLAN_LIMIT = 100; // 3 mensagens gratuitas por chat

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
    text.includes("```sheet") ||
    text.includes("| ---") ||
    text.includes("| ----") ||
    text.includes("| ===") ||
    text.includes("<table") ||
    (text.includes("|") && text.includes("\n|")) // Possível tabela markdown
  );
};

// Interface para as mensagens do chat
interface ChatMessage {
  from: "user" | "assistant";
  text: string;
  timestamp?: string;
  containsSheet?: boolean;
}

const Chat = () => {  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<"checking" | "available" | "unavailable">("available");
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = useRef<string>(getCurrentChatId());

  // Premium status mock (localStorage). Troque/se integre após backend real.
  const isPremium = localStorage.getItem("userPremium") === "true";

  // Carrega as mensagens ao iniciar
  useEffect(() => {
    const history = getChatHistory(chatId.current);
    setMessages(history);
  }, []);

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
  // Função para copiar o texto da resposta para a área de transferência
  const handleCopyText = (text: string, index: number) => {
    // Remove formatações markdown antes de copiar (opcional, depende da sua preferência)
    // Mantemos o texto original para preservar formatação, mas podemos melhorar isso no futuro
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedMessageId(index);
        toast({ 
          title: "Texto copiado!", 
          description: "O texto foi copiado para a área de transferência."
        });
        
        // Resetar o ícone para o estado inicial após 2 segundos
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 2000);
      })
      .catch(err => {
        console.error("Erro ao copiar texto:", err);
        toast({ 
          title: "Erro ao copiar", 
          description: "Não foi possível copiar o texto.",
          variant: "destructive" 
        });
      });
  };

  // Renderiza uma mensagem individual
  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.from === "user";
    
    // Verifica se é uma planilha e se o usuário não é premium
    // mudar isso se precissar mexer sem limite
    const shouldBlur = isPremium && message.containsSheet;
    
    return (      <div 
        key={index} 
        className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      ><div 
          className={`max-w-3/4 rounded-lg p-4 relative ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className={`markdown-body ${shouldBlur ? 'blur-sm select-none' : ''}`}>
            {isUser ? (
              // Para mensagens do usuário, usamos texto simples
              <p className="whitespace-pre-wrap" style={{ margin: 0 }}>
                {message.text}
              </p>
            ) : (
              // Para mensagens do assistente, renderizamos como Markdown
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },                  table({node, ...props}: any) {
                    return <table className="border-collapse border border-gray-300 my-4" {...props} />;
                  },
                  th({node, ...props}: any) {
                    return <th className="border border-gray-300 px-4 py-2 bg-gray-100" {...props} />;
                  },
                  td({node, ...props}: any) {
                    return <td className="border border-gray-300 px-4 py-2" {...props} />;
                  }
                }}
              >
                {message.text}
              </ReactMarkdown>
            )}
          </div>
          
          {shouldBlur && (
            <div className="mt-2 py-2 px-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs">
              <strong>💡 Conteúdo limitado:</strong> Faça upgrade para visualizar planilhas completas.
            </div>
          )}          {/* Ícone de cópia - posicionado no canto superior direito */}
          {!isUser && (            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyText(message.text, index)}
              disabled={isLoading}
              className="absolute top-1 right-1 p-1 h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-gray-200 focus:opacity-100 transition-opacity"
              title="Copiar mensagem"
            >
              {copiedMessageId === index ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Estilos para o Markdown
  const markdownStyles = `
    .markdown-body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      line-height: 1.6;
    }
    .markdown-body h1 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; }
    .markdown-body h2 { font-size: 1.25em; margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; }
    .markdown-body h3 { font-size: 1.1em; margin-top: 0.8em; margin-bottom: 0.4em; font-weight: 600; }
    .markdown-body p { margin-top: 0.5em; margin-bottom: 0.5em; }
    .markdown-body ul, .markdown-body ol { padding-left: 1.5em; margin: 0.5em 0; }
    .markdown-body li { margin-top: 0.25em; margin-bottom: 0.25em; }
    .markdown-body pre { margin: 0.5em 0; }
    .markdown-body blockquote { border-left: 0.25em solid #ccc; padding-left: 1em; color: #555; margin: 0.5em 0; }
    .markdown-body a { color: #0366d6; text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
    .markdown-body table { width: 100%; }
    .markdown-body img { max-width: 100%; }
    .bg-blue-500 .markdown-body { color: white; }
    .bg-blue-500 .markdown-body a { color: #cce4ff; }
    .bg-blue-500 .markdown-body blockquote { border-left-color: #ffffff80; color: #ffffffcc; }
  `;

  return (
    <main className="max-w-3xl mx-auto py-6 flex flex-col h-[calc(100vh-60px)]">
      <style>{markdownStyles}</style>

      <h1 className="text-2xl font-bold text-center mb-2">
        Assistente de Planilhas de Treino
      </h1>

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
