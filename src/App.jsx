import AppProvider from "@/store/AppProvider";
import { useApp } from "@/store/useApp";
import { SCREENS } from "@/constants/routes";
import WelcomePage from "@/pages/WelcomePage";
import "./App.css";

function AppContent() {
  const { state } = useApp();

  switch (state.screen) {
    case SCREENS.WELCOME:
    default:
      return <WelcomePage />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
