import { useEffect, useReducer } from "react";
import { SCREENS, STORAGE_KEYS } from "@/constants/routes";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { restoreSession } from "@/services/auth";
import { setUnauthorizedHandler } from "@/services/http";
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
      // extra keys (courseId, tab, assignmentId, studentId) merge when present,
      // so module screens can deep-link without losing the rest of the context
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

export default function AppProvider({ children }) {
  const [persisted, setPersisted] = useLocalStorage(STORAGE_KEYS.PREFS, {
    dark: false,
    lang: "en",
  });

  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    dark: persisted.dark,
    lang: persisted.lang,
  });

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
    restoreSession().then((user) => {
      if (!alive || !user) return;
      dispatch({ type: "SET_USER", user });
      dispatch({ type: "NAVIGATE", screen: homeScreenFor(user.role) });
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