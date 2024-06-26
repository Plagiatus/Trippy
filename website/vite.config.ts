import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"$": path.resolve(__dirname, "./../bot/src/shared"),
		}
	},
  plugins: [vue()]
})
