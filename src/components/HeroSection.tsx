
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-4xl mx-auto flex flex-col items-center py-20">
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight text-center">
        Planilhas de Treino com <span className="text-primary">IA Esportiva</span>
      </h1>
      <p className="mt-6 text-xl md:text-2xl text-gray-600 text-center max-w-2xl">
        Crie planilhas personalizadas para corrida com base em estudos comprovados, usando inteligência artificial.
      </p>
      <Button
        size="xl"
        className="mt-10 px-10 py-6 text-lg font-bold shadow-lg animate-fade-in"
        onClick={() => navigate("/chat")}
      >
        Experimente Grátis
      </Button>
    </section>
  );
};

export default HeroSection;
