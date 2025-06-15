
const ComparisonSection = () => (
  <section className="py-12 max-w-5xl mx-auto">
    <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">RunSheet x Planilhas Genéricas</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-separate border-spacing-x-4 shadow-xl bg-white/90 rounded-xl">
        <thead>
          <tr className="text-gray-600">
            <th className="text-left p-4"> </th>
            <th className="text-primary text-lg font-bold p-4">RunSheet</th>
            <th className="p-4">Planilhas Genéricas</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-4 font-semibold">Personalização</td>
            <td className="p-4">100%, com IA + base científica</td>
            <td className="p-4 text-gray-500">Pouca ou nenhuma</td>
          </tr>
          <tr className="border-t">
            <td className="p-4 font-semibold">Recomendações Inteligentes</td>
            <td className="p-4">Sim, em tempo real</td>
            <td className="p-4 text-gray-500">Não</td>
          </tr>
          <tr className="border-t">
            <td className="p-4 font-semibold">Histórico & Dashboard</td>
            <td className="p-4">Completo e seguro</td>
            <td className="p-4 text-gray-500">Não</td>
          </tr>
          <tr className="border-t">
            <td className="p-4 font-semibold">Facilidade de Uso</td>
            <td className="p-4">Rápido & intuitivo</td>
            <td className="p-4 text-gray-500">Complicado</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
);

export default ComparisonSection;
