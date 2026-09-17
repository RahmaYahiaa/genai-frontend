import { useEffect, useReducer } from "react";
import { SCREENS, STORAGE_KEYS } from "@/constants/routes";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { restoreSession } from "@/services/auth";
import { readSession, setUnauthorizedHandler } from "@/services/http";
import { homeScreenFor } from "@/utils";
import { AppContext } from "./app-context";

const initialState = {
  screen: SCREENS.WELCOME,
  dark: false,
  lang: "en",
  role: null,
  user: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "NAVIGATE": {
      const rest = { ...action };
      delete rest.type;
      return { ...state, ...rest };
    }
    case "TOGGLE_THEME":
      return { ...state, dark: !state.dark };
    case "SET_THEME":
      return { ...state, dark: action.dark };
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "SET_USER":
      return { ...state, user: action.user, role: action.user?.role ?? null };
    case "RESET":
      return { ...initialState, dark: state.dark, lang: state.lang };
    default:
      return state;
  }
}

function bootstrap(persisted) {
  const user = readSession()?.user ?? null;
  return {
    ...initialState,
    dark: persisted.dark,
    lang: persisted.lang,
    user,
    role: user?.role ?? null,
    screen: user ? homeScreenFor(user.role) : SCREENS.WELCOME,
  };
}

export default function AppProvider({ children }) {
  const [persisted, setPersisted] = useLocalStorage(STORAGE_KEYS.PREFS, {
    dark: false,
    lang: "en",
  });

  const [state, dispatch] = useReducer(reducer, persisted, bootstrap);

  useEffect(() => {
    setPersisted({ dark: state.dark, lang: state.lang });
  }, [state.dark, state.lang, setPersisted]);

  useEffect(() => {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
  }, [state.lang]);

  useEffect(() => {
    let alive = true;
    setUnauthorizedHandler(() => dispatch({ type: "RESET" }));
    if (!readSession()) return;
    restoreSession().then((user) => {
      if (!alive) return;
      if (user) dispatch({ type: "SET_USER", user });
      else dispatch({ type: "RESET" });
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}