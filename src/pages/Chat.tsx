
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const FREE_PLAN_LIMIT = 1; // 1 geração grátis

const Chat = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Simula geração grátis com localStorage
  const availableGenerations =
    FREE_PLAN_LIMIT -
    Number(localStorage.getItem("runsheet_free_generations") || 0);

  const handleGenerate = async () => {
    if (availableGenerations <= 0) {
      toast({
        title: "Limite Gratuito Atingido",
        description:
          "Assine para gerar planilhas ilimitadas ou acesse seu histórico.",
        variant: "destructive",
      });
      return;
    }
    if (!input.trim()) return toast({ title: "Preencha o campo para gerar!" });

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOutput(
        "📋 [Simulação IA] Sua planilha de treino foi gerada! (Integração real com o n8n via webhook vai aqui)"
      );
      localStorage.setItem(
        "runsheet_free_generations",
        String(
          1 + Number(localStorage.getItem("runsheet_free_generations") || 0)
        )
      );
    }, 1500);
  };

  return (
    <main className="max-w-xl mx-auto py-12 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-center mb-2">
        Gerar Planilha Personalizada
      </h1>
      <p className="text-center text-muted-foreground">
        {availableGenerations > 0
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
          <p>{output}</p>
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

      {/* CTA para assinante */}
      {availableGenerations <= 0 && (
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
