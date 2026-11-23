import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import "@fontsource-variable/hanken-grotesk";
import "./styles/theme.css";
import "./styles/global.css";
import "./styles/app.css";
import { App } from "./App";
import { applyThemePreference, readThemePreference } from "./theme/preference";

applyThemePreference(readThemePreference());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
