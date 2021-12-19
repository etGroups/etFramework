import BaseResource from "BaseResource";

class IndexResource extends BaseResource {

	constructor(req: Request, socket: any = false) {
		super(req, socket);
	}

	async index(): Promise<any> {
		const body = await this.getBody();
		console.log(body);
		return this.respond('Hello deno', {
			status: 200,
		});
	}
}

export default IndexResource;