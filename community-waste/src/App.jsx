import { useEffect, useState } from "react";
import Home from "./Home";
import Login from "./Login";
import "./App.css";

const read = () => window.location.hash.replace("#", "");

export default function App() {
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onHash = () => setRoute(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "login" || route === "register") {
    return (
      <Login
        key={route}
        startOnRegister={route === "register"}
        onBack={() => { window.location.hash = ""; }}
      />
    );
  }

  return (
    <Home
      onLogin={() => { window.location.hash = "login"; }}
      onRegister={() => { window.location.hash = "register"; }}
    />
  );
}