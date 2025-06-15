
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full flex items-center justify-between py-5 px-10 bg-white/80 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="flex items-center cursor-pointer select-none" onClick={() => navigate("/")}>
        <span className="font-black text-2xl tracking-tight text-primary">RunSheet</span>
        <span className="ml-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">BETA</span>
      </div>
      <nav>
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="default" size="lg">Entrar</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
          <Button
            variant="ghost"
            size="lg"
            className="ml-4"
            onClick={() => navigate("/dashboard")}
          >
            Minha Área
          </Button>
        </SignedIn>
      </nav>
    </header>
  );
};

export default Header;
