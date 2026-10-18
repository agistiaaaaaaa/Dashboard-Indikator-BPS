import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import {
  didIndicatorHydrateFail,
  hydrateIndicatorCache,
} from "./data/providers";
import { isApiMode } from "./lib/api";
import "./styles.css";

async function boot() {
  if (isApiMode()) {
    try {
      await hydrateIndicatorCache();
    } catch (err) {
      console.error(
        "Gagal memuat data dari API. Pastikan server API berjalan di :4000.",
        err
      );
    }
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppErrorBoundary>
    </StrictMode>
  );

  if (import.meta.env.DEV && didIndicatorHydrateFail()) {
    console.warn(
      "[boot] Indicator hydrate failed — public pages will show ErrorState until API is available."
    );
  }
}

void boot();
