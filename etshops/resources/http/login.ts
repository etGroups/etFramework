import BaseResource from "BaseResource";
import {decode} from "base64";

class LoginResource extends BaseResource {

	constructor(req: Request, socket: any = false) {
		super(req, socket);
	}

	async index(): Promise<any> {
		const token = this.req.headers.get('authorization')?.split(' ')[1];
		if (!token) {
			return new Response('Invalid authorization token', {
				status: 200,
			});
		}

		const [login, password] = new TextDecoder().decode(decode(token)).split(':');
		return new Response('Hello deno: '+login+':'+password, {
			status: 200,
		});
	}
}

export default LoginResource;