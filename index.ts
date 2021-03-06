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

function getRouteData(req: Request) {
	const server = urlParse(req.url);
	const appName = server.hostname.replace(/(\.lh|\.pl|api\.)/g, '');
	const segments = server.pathname.substring(1).split('/');
	let method = segments.pop();
	let controller = segments.join('/') ?? '';

	if (!controller) {
		controller = method ? method : 'index';
		method = 'index';
	}
	method = (method) ? method.toLowerCase() : 'index';

	return {server: server, appName: appName, controller: controller, method: method};
}

async function getResource(appName: string, controller: string, isWS: boolean) {
	let path = isWS ? `${appName}/resources/ws/${controller}.ts` : `${appName}/resources/http/${controller}.ts`;
	const controllerExist = await exists(path);
	if (!controllerExist) {
		path = isWS ? `common/resources/ws/${controller}.ts` : `common/resources/http/${controller}.ts`;
	}
	return await import(`./${path}`);
}


async function route(req: Request) {
	try {
		const routeData = getRouteData(req);
		const resource = await getResource(routeData.appName, routeData.controller, false);
		const obj = new resource.default(req, false);
		return eval(`obj.${routeData.method}()`);
	} catch (e) {
		console.log(e);
		return false;
	}
}

async function wsRoute(req: Request, socket: WebSocket) {
	try {
		const routeData = getRouteData(req);
		const resource = await getResource(routeData.appName, routeData.controller, true);

		socket.onopen = () => {
			console.log('WebSocket connection opened')
		};
		socket.onmessage = (socketRequest) => {
			const data = isJson(socketRequest.data);
			if (!data || !data.method) {
				socket.send("Data must be a valid JSON");
				return false;
			}
			const obj = new resource.default(req, {socket: socket, socketRequest: socketRequest});
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