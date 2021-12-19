import {exists} from "fs";
import {urlParse} from "urlParse";
import {serve} from "server";

function isJson(str: string) {
	try {
		return JSON.parse(str);
	} catch (e) {
		return false;
	}
}

async function route(req: Request) {
	try {
		const server = urlParse(req.url);
		const appName = server.hostname.replace(/(\.lh|\.pl|api\.)/g, '');
		const segments = server.pathname.substring(1).split('/');
		let method = segments.pop();
		let controller = segments.join('/') ?? '';

		if (!controller) {
			controller = method ? method : 'index';
			method = 'index';
		}
		if (!method) {
			method = 'index';
		}

		let path = `${appName}/resources/${controller}.ts`;
		const controllerExist = await exists(path);
		if (!controllerExist) {
			path = `common/resources/${controller}.ts`;
		}

		const resource = await import(`./${path}`);
		const obj = new resource.default(req, false);
		return eval(`obj.${method}()`);
	} catch (error) {
		console.log(error);
		return false;
	}
}

async function wsRoute(req: Request, socket: WebSocket) {
	try {
		const server = urlParse(req.url);
		const appName = server.hostname.replace(/(\.lh|\.pl|api\.)/g, '');
		let controller = server.pathname.substring(1);
		if (!controller) {
			controller = 'index';
		}

		let path = `${appName}/resources/${controller}.ts`;
		const controllerExist = await exists(path);
		if (!controllerExist) {
			path = `common/resources/${controller}.ts`;
		}

		socket.onopen = () => {
			console.log('WebSocket connection opened'); //TODO autoryzacja sprawdza poprawnosc danych JWT?
		};

		const resource = await import(`./${path}`);

		socket.onmessage = (socketRequest) => {
			const data = isJson(socketRequest.data);
			if (!data || !data.method) {
				socket.send("Data must be a valid JSON");
				return false;
			}
			const socketData = {
				socket: socket,
				socketRequest: socketRequest
			}
			const obj = new resource.default(req, socketData);
			return eval(`obj.${data.method}()`);
		};
		socket.onclose = () => console.log("WebSocket has been closed.");
		socket.onerror = (e) => console.error("WebSocket error:", e);
	} catch (error) {
		console.log(error);
		return false;
	}
}

const handler = async (req: Request): Promise<Response> => {
	const server = urlParse(req.url);
	const isWS = req.headers.get('upgrade') === 'websocket';

	if (isWS) {
		const {socket, response} = Deno.upgradeWebSocket(req);
		await wsRoute(req, socket);
		return response;
	} else {
		if (server.pathname !== '/favicon.ico') {
			return await route(req);
		} else {
			return new Response('Hello world', {status: 200});
		}
	}
};

await serve(await handler, {port: 80});