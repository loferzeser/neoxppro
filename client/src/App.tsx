import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Router, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AuthPage from "./pages/Auth";
import { AIChatWidget } from "./components/AIChatWidget";
import TermsPage from "./pages/legal/Terms";
import PrivacyPage from "./pages/legal/Privacy";
import RefundPage from "./pages/legal/Refund";
import CookiesPage from "./pages/legal/Cookies";
import RiskDisclosurePage from "./pages/legal/RiskDisclosure";
import AffiliatePage from "./pages/Affiliate";

function AppRoutes() {
  console.log("[AppRoutes] Rendering");
  
  // TEMPORARY: Test direct render without Router
  console.log("[AppRoutes] Testing direct Home render");
  
  // Ultra simple test
  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: "red", 
      color: "white", 
      padding: "50px",
      fontSize: "24px",
      zIndex: 9999 
    }}>
      <h1>TEST: If you see this, React is rendering!</h1>
      <p>AppRoutes is working</p>
      <Home />
    </div>
  );
}

function App() {
  console.log("[App] Component rendering");
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    console.log("[App] Mounted");
    const handleError = (event: ErrorEvent) => {
      console.error("[Global Error]", event.error);
      setHasError(true);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[Unhandled Promise Rejection]", event.reason);
    };
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div style={{ padding: "20px", color: "white", background: "#000" }}>
        <h1>Error detected - check console</h1>
      </div>
    );
  }

  console.log("[App] Rendering children");
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
          <AIChatWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
