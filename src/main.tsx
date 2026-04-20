//Mounts the React app into #root
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./gallery.css";
import "./pressure.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
