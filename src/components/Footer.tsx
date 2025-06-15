
const Footer = () => (
  <footer className="mt-24 py-8 bg-gray-50 border-t border-gray-200">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between px-6 gap-6">
      <span className="font-black text-xl text-primary tracking-tight select-none">RunSheet</span>
      <span className="text-gray-500 text-sm">© {new Date().getFullYear()} RunSheet. Todos os direitos reservados.</span>
      <div className="flex items-center gap-4">
        <a
          href="mailto:contato@runsheet.com"
          className="text-gray-400 hover:text-primary transition-colors"
        >
          contato@runsheet.com
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
