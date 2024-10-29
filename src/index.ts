/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const VERSION = "1.0.0";
const TIMEOUT = 1000 * 5;

export default {
	async fetch(request, _env, _ctx): Promise<Response> {
		const url = new URL(request.url);

		if (request.method !== "GET" || url.pathname !== "/") {
			return new Response(null, { status: 404 });
		}

		return await checkWebsocketHealth().then(() => {
			return new Response(null, { status: 204 });
		}).catch((err) => {
			return new Response(err, { status: 500 });
		});
	},
} satisfies ExportedHandler<Env>;

function checkWebsocketHealth(): Promise<string | null> {
	// anti-pattern but necessary here
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(`wss://events.7tv.io/v3?app=7tv-monitoring&version=${VERSION}`);

		socket.addEventListener("message", (msg) => {
			const json = JSON.parse(msg.data.toString());

			if (json.op === 1 || json.op === 2) {
				// Healthy
				resolve(null);
			} else {
				// Unhealthy
				reject(`invalid message: ${json}`);
			}
		});

		setTimeout(() => {
			// Unhealthy
			reject("timeout");
		}, TIMEOUT);
	});
}
