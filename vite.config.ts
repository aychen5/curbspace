// runs and builds the app
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
//import { Scrolly } from "@/components/scrolly";


export default defineConfig({
  base: "/curbspace/",
  plugins: [react()]
});
