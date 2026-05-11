import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	server: {
		port: 4321,
		host: true,
	},
	security: {
		allowedDomains: [
			{
				protocol: "https",
				hostname: "blog.feroad.com",
			},
		],
	},
});
