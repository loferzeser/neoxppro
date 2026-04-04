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
  const base = import.meta.env.BASE_URL;
  const routerBase =
    base === "/" || base === "" ? undefined : base.replace(/\/$/, "") || undefined;

  console.log("[AppRoutes] BASE_URL:", base, "routerBase:", routerBase);

  // TEMPORARY: Test direct render without Router
  console.log("[AppRoutes] Testing direct Home render");
  return <Home />;

  /* DISABLED FOR TESTING
  // TEMPORARY DEBUG: Render Home directly to test if Router is the issue
  const [location] = useLocation();
  console.log("[AppRoutes] Current location:", location);

  try {
    console.log("[AppRoutes] About to render Router");
    return (
      <Router {...(routerBase ? { base: routerBase } : {})}>
        <Switch>
          <Route path="/">{() => {
            console.log("[Route /] Rendering Home");
            return <Home />;
          }}</Route>

        {/* Trailing slashes → canonical paths (must be before /shop/:slug) */}
        <Route path="/shop/">
          <Redirect to="/shop" replace />
        </Route>
        <Route path="/cart/">
          <Redirect to="/cart" replace />
        </Route>
        <Route path="/checkout/">
          <Redirect to="/checkout" replace />
        </Route>
        <Route path="/about/">
          <Redirect to="/about" replace />
        </Route>
        <Route path="/contact/">
          <Redirect to="/contact" replace />
        </Route>
        <Route path="/dashboard/">
          <Redirect to="/dashboard" replace />
        </Route>
        <Route path="/admin/">
          <Redirect to="/admin" replace />
        </Route>
        <Route path="/terms/">
          <Redirect to="/terms" replace />
        </Route>
        <Route path="/privacy/">
          <Redirect to="/privacy" replace />
        </Route>
        <Route path="/refund/">
          <Redirect to="/refund" replace />
        </Route>
        <Route path="/cookies/">
          <Redirect to="/cookies" replace />
        </Route>
        <Route path="/risk/">
          <Redirect to="/risk" replace />
        </Route>

          <Route path="/shop" component={Shop} />
          <Route path="/shop/:slug" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-success/:orderNumber" component={OrderSuccess} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/orders" component={Dashboard} />
        <Route path="/dashboard/settings" component={Dashboard} />
        <Route path="/admin" component={Admin} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/refund" component={RefundPage} />
        <Route path="/cookies" component={CookiesPage} />
        <Route path="/risk" component={RiskDisclosurePage} />
        <Route path="/affiliate" component={AffiliatePage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  } catch (error) {
    console.error("[AppRoutes] Error rendering Router:", error);
    return <div style={{ color: "white", padding: "20px" }}>Router Error: {String(error)}</div>;
  }
  */
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
