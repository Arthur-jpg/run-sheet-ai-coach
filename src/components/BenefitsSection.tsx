
import { ArrowUp } from "lucide-react";

const benefits = [
  {
    title: "Personalização Total",
    desc: "Cada planilha é única, adaptada ao seu perfil, objetivo e desempenho.",
    icon: <ArrowUp size={28} className="text-primary" />
  },
  {
    title: "Base Científica",
    desc: "Monte treinos com respaldo em estudos atuais, evitando achismos.",
    icon: <ArrowUp size={28} className="text-primary" />
  },
  {
    title: "Fácil e Rápido",
    desc: "Gere sua planilha em menos de 1 minuto e receba recomendações por IA.",
    icon: <ArrowUp size={28} className="text-primary" />
  },
  {
    title: "Melhore Seu Desempenho",
    desc: "Acompanhe a evolução e ajuste sua rotina sem complicações.",
    icon: <ArrowUp size={28} className="text-primary" />
  }
];

const BenefitsSection = () => (
  <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
    {benefits.map((item, idx) => (
      <div
        key={item.title}
        className="bg-white rounded-xl p-8 shadow flex flex-col items-start hover:scale-105 transition-transform cursor-pointer"
      >
        <div className="mb-2">{item.icon}</div>
        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
        <p className="text-gray-600">{item.desc}</p>
      </div>
    ))}
  </section>
);

export default BenefitsSection;
