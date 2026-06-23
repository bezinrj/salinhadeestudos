import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.dataset.buildStamp = "2026-06-23-force-rebuild-1";

createRoot(document.getElementById("root")!).render(<App />);
