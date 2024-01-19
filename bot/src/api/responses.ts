import express from "express";

export default class WebResponses {
	wrongMethod(_: express.Request, res: express.Response) {
		res.sendStatus(405);
	}
	
	aServerErrorOccured(error: Error, res: express.Response) {
		console.error(error);
		res.sendStatus(500);
	}
	
	sendCustomError(error: string, res: express.Response, status: number = 400) {
		res.status(status);
		res.send(error);
	}
}