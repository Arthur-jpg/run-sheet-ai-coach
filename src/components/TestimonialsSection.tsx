
const testimonials = [
  {
    name: "João S.",
    text: "A RunSheet fez minha preparação para 10K muito mais fácil. A planilha se adaptou à minha rotina.",
    img: "https://i.pravatar.cc/100?img=1"
  },
  {
    name: "Maria V.",
    text: "Sempre usei planilhas genéricas, mas o resultado com IA foi muito superior. Recomendo!",
    img: "https://i.pravatar.cc/100?img=2"
  },
  {
    name: "Lucas G.",
    text: "Consigo acompanhar minha evolução e ajustar o treino na hora, tudo automático.",
    img: "https://i.pravatar.cc/100?img=3"
  }
];

const TestimonialsSection = () => (
  <section className="max-w-4xl mx-auto py-12">
    <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Depoimentos de Usuários</h2>
    <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
      {testimonials.map((t) => (
        <figure
          key={t.name}
          className="bg-white px-8 py-6 rounded-xl shadow max-w-xs flex flex-col items-center animate-fade-in"
        >
          <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full mb-3" />
          <blockquote className="text-gray-700 italic text-center mb-2">"{t.text}"</blockquote>
          <figcaption className="text-primary font-semibold">{t.name}</figcaption>
        </figure>
      ))}
    </div>
  </section>
);

export default TestimonialsSection;
