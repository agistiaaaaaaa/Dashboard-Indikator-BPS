import { isApiMode } from "../../lib/api";
import type { DataManagementProvider } from "../types";
import { developmentStoreDataManagementProvider } from "./developmentStoreProvider";
import { localApiDataManagementProvider } from "./localApiDataManagementProvider";

function selectProvider(): DataManagementProvider {
  const explicit = import.meta.env.VITE_DATA_MGMT_PROVIDER as string | undefined;
  if (explicit === "session" || explicit === "development-store") {
    return developmentStoreDataManagementProvider;
  }
  if (explicit === "api" || explicit === "local-api" || isApiMode()) {
    return localApiDataManagementProvider;
  }
  return localApiDataManagementProvider;
}

export const dataManagementProvider: DataManagementProvider = selectProvider();

export function getDataManagementMode(): DataManagementProvider["mode"] {
  return dataManagementProvider.mode;
}
