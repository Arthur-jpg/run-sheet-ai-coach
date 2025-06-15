
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clerk provider
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Configure VITE_CLERK_PUBLISHABLE_KEY no seu .env.local");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
