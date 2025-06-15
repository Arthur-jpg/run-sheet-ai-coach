import { Button } from "@/components/ui/button";

const PricingSection = () => (
  <section className="max-w-xl mx-auto py-16 text-center">
    <h2 className="text-2xl md:text-3xl font-bold mb-3">Assinatura</h2>
    <p className="text-lg text-gray-700 mb-10">
      Acesso total à RunSheet por apenas <span className="font-bold text-primary">R$ 19,90/mês</span>.
    </p>
    <div className="bg-white rounded-xl shadow-xl py-8 px-6 mx-auto flex flex-col items-center gap-4 max-w-md">
      <ul className="mb-6 text-left">
        <li className="flex gap-2 mb-2"><span className="font-bold text-primary">✔️</span> Planilhas ilimitadas</li>
        <li className="flex gap-2 mb-2"><span className="font-bold text-primary">✔️</span> Histórico completo</li>
        <li className="flex gap-2"><span className="font-bold text-primary">✔️</span> Portal de assinante</li>
      </ul>
      <Button
        size="lg"
        className="w-full text-lg font-bold px-10 py-6"
        onClick={() => window.alert("Checkout ainda não implementado. Em breve: integração Stripe!")}
      >
        Assinar RunSheet
      </Button>
    </div>
    <span className="block mt-4 text-sm text-gray-500">Cancele a qualquer momento</span>
  </section>
);

export default PricingSection;
