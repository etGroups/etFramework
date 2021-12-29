import BaseResource from "BaseResource";

class IndexResource extends BaseResource {

	constructor(req: Request, socket: any = false) {
		super(req, socket);
	}

	async index(): Promise<any> {
		const body = await this.getBody();
		return new Response('Hello deno', {
			status: 200,
		});
	}
}

export default IndexResource;