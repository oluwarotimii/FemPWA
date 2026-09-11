
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Safety net: a promise rejection nobody awaited (e.g. a fire-and-forget
  // sync call) would otherwise vanish into the console with no user-visible
  // feedback and no recovery. This doesn't fix the underlying bug, but it
  // stops it from silently failing.
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  createRoot(document.getElementById("root")!).render(<App />);
