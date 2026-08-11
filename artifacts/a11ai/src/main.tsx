import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { VisionFilters } from "./components/VisionFilters";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PreferencesProvider>
      <VisionFilters />
      <App />
    </PreferencesProvider>
  </AuthProvider>
);
