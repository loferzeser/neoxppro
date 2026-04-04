import { useEffect, useState } from "react";

// Hash-based routing helpers
export function useLocation(): [string, (path: string) => void] {
  const [location, setLocation] = useState(() => {
    const hash = window.location.hash.slice(1) || "/";
    return hash;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || "/";
      setLocation(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return [location, navigate];
}

export function useParams<T = Record<string, string>>(): T {
  const [location] = useLocation();
  const parts = location.split("/").filter(Boolean);
  
  // Simple param extraction - customize based on your routes
  return {} as T;
}

export function useSearch(): string {
  return window.location.search;
}

export function Link({ href, children, className, ...props }: any) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = href;
  };

  return (
    <a href={`#${href}`} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
