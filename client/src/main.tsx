import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { getApiUrl } from "./lib/runtimeConfig";
import "./index.css";

const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;
if (
  typeof document !== "undefined" &&
  analyticsEndpoint &&
  analyticsWebsiteId &&
  !analyticsEndpoint.includes("%VITE_")
) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = `${analyticsEndpoint.replace(/\/$/, "")}/umami`;
  s.setAttribute("data-website-id", analyticsWebsiteId);
  document.body.appendChild(s);
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

console.log("[main.tsx] Starting app initialization");

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl("/api/trpc"),
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("[main.tsx] FATAL: #root element not found!");
  document.body.innerHTML = '<div style="color:white;padding:20px;">FATAL: #root not found</div>';
} else {
  createRoot(rootElement).render(
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    );
  } catch (err) {
    console.error("[main.tsx] Render error:", err);
    document.body.innerHTML = `<div style="color:white;padding:20px;">Render Error: ${err}</div>`;
  }
}
