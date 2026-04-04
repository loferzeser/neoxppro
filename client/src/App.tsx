import * as React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AIChatWidget } from "./components/AIChatWidget";
import ErrorBoundary from "./components/ErrorBoundary";

// Import all pages
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
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/legal/Terms";
import PrivacyPage from "./pages/legal/Privacy";
import RefundPage from "./pages/legal/Refund";
import CookiesPage from "./pages/legal/Cookies";
import RiskDisclosurePage from "./pages/legal/RiskDisclosure";
import AffiliatePage from "./pages/Affiliate";

// Simple hash-based router
function useHashRoute() {
  const [route, setRoute] = React.useState(() => {
    const hash = window.location.hash.slice(1) || "/";
    return hash;
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "/";
      setRoute(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

function AppRoutes() {
  const route = useHashRoute();

  // Match routes
  if (route === "/" || route === "") return <Home />;
  if (route === "/shop") return <Shop />;
  if (route.startsWith("/shop/")) {
    const slug = route.split("/")[2];
    return <ProductDetail params={{ slug }} />;
  }
  if (route === "/cart") return <Cart />;
  if (route === "/checkout") return <Checkout />;
  if (route.startsWith("/order-success/")) {
    const orderNumber = route.split("/")[2];
    return <OrderSuccess params={{ orderNumber }} />;
  }
  if (route === "/dashboard") return <Dashboard />;
  if (route === "/dashboard/orders") return <Dashboard />;
  if (route === "/dashboard/settings") return <Dashboard />;
  if (route === "/admin") return <Admin />;
  if (route === "/about") return <About />;
  if (route === "/contact") return <Contact />;
  if (route === "/auth") return <AuthPage />;
  if (route === "/terms") return <TermsPage />;
  if (route === "/privacy") return <PrivacyPage />;
  if (route === "/refund") return <RefundPage />;
  if (route === "/cookies") return <CookiesPage />;
  if (route === "/risk") return <RiskDisclosurePage />;
  if (route === "/affiliate") return <AffiliatePage />;
  
  return <NotFound />;
}

function App() {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
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
