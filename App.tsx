import React from "react";
import { AuthProvider } from "./components/context/AuthContext";
import SmartSchedulerApp from "./SmartSchedulerApp"; 

export default function App() {
  return (
    <AuthProvider>
      <SmartSchedulerApp />
    </AuthProvider>
  );
}
