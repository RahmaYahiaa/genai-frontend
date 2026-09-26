import { createContext, useContext } from "react";

/** True when a page is rendered as a tab inside the AI Tutor hub. */
export const StudyHubContext = createContext(false);
export const useInsideStudyHub = () => useContext(StudyHubContext);
