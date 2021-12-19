class BaseResource {
	protected socket: WebSocket | false;
	protected req: Request;
	protected socketRequest: any;

	constructor(req: Request, socket: any = false) {
		this.req = req;
		this.socket = false;
		if (socket) {
			this.socket = socket.socket;
			this.socketRequest = socket.socketRequest;
		}
	}

	async getBody(): Promise<string> {
		let body = '';
		if (this.socketRequest) {
			body = await this.socketRequest.data;
		} else {
			body = await this.req.text();
		}
		return body;
	}

	respond(body: any, init?: ResponseInit): void | Response {
		if (this.socket) {
			this.socket.send(body);
		} else {
			return new Response(body, init);
		}
	}
}

export default BaseResource;