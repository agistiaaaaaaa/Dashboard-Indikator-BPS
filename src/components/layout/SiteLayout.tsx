import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

interface SearchUiContextValue {
  openSearch: () => void;
  closeSearch: () => void;
  isSearchOpen: boolean;
}

const SearchUiContext = createContext<SearchUiContextValue | null>(null);

export function useSearchUi() {
  const ctx = useContext(SearchUiContext);
  if (!ctx) {
    throw new Error("useSearchUi must be used within SiteLayout");
  }
  return ctx;
}

export function SiteLayout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const value = useMemo(
    () => ({ openSearch, closeSearch, isSearchOpen }),
    [openSearch, closeSearch, isSearchOpen]
  );

  return (
    <SearchUiContext.Provider value={value}>
      <div className="page">
        <SiteNav />
        <Outlet />
        <SiteFooter />
        <GlobalSearch open={isSearchOpen} onClose={closeSearch} />
      </div>
    </SearchUiContext.Provider>
  );
}
