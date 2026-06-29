import { Loader2 } from "lucide-react";
import { useAuth } from "./lib/useAuth";
import { AuthScreen } from "./components/AuthScreen";
import { ScannerScreen } from "./components/ScannerScreen";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return user ? <ScannerScreen /> : <AuthScreen />;
}

export default App;
