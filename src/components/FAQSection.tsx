
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Preciso pagar para usar a RunSheet?",
    a: "Você pode gerar uma planilha gratuitamente. Para criar ilimitadas e salvar seu histórico, basta assinar."
  },
  {
    q: "Quais métodos de pagamento são aceitos?",
    a: "Trabalhamos com Stripe. Aceitamos cartão de crédito e os principais métodos do mercado."
  },
  {
    q: "Posso excluir minhas planilhas?",
    a: "Sim! Você controla seu histórico de treinos e pode excluir o que quiser."
  },
  {
    q: "As planilhas seguem algum protocolo?",
    a: "Sim! Todas seguem princípios validados pela literatura científica esportiva."
  }
];

const FAQSection = () => (
  <section className="max-w-2xl mx-auto py-16">
    <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Dúvidas Frequentes</h2>
    <Accordion type="single" collapsible className="space-y-3">
      {faqs.map((item, i) => (
        <AccordionItem value={String(i)} key={item.q} className="border-b-0 shadow-sm rounded-xl">
          <AccordionTrigger className="text-lg font-medium">{item.q}</AccordionTrigger>
          <AccordionContent className="text-gray-600">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

export default FAQSection;
