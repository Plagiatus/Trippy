import express, { NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { db } from "../db";
import hash from "object-hash";
import { isAlphaNumeric } from "../validator/util";

export const server = express();
server.use(bodyParser.json());

const corsOptions: cors.CorsOptions = {
    origin: ["http://localhost:3000", "https://maptesting.de"],
}

server.use(cors(corsOptions));


server.route("/session/getcode/")
    .post(async (req, res) => {
        let code: string = parseInt(hash(req.body), 16).toString(36).slice(0, 5);
        res.send({ code });
    })
    .all(wrongMethod);

server.route("/session/setup/:code")
    .get(async (req, res) => {
        let code: string = req.params.code;
        if (!code || code.length != 5) {
            sendCustomError("Code needs to be 5 characters long.", res);
            return;
        }
        if (!isAlphaNumeric(code)) {
            sendCustomError("Code can only be alphanumerical.", res)
            return;
        }
        res.send({ description: "description", name: "name", edition: "java", image: "", ip: "example.com", mode: "other", playerAmt: 0, preferences: { communication: "none", newPlayers: "none", timeEstimate: 0 }, rpLink: "", type: "test", vcAmount: 1, version: "1.19.2", testDescription: "blabla" })
    })
    .all(wrongMethod);


// Catch-all
server.all("*", (req, res) => {
    res.sendStatus(404);
});

function wrongMethod(req: express.Request, res: express.Response) {
    res.sendStatus(405);
}

function aServerErrorOccured(error: Error, res: express.Response) {
    console.error(error);
    res.sendStatus(500);
}

function sendCustomError(error: string, res: express.Response, status: number = 400) {
    res.statusMessage = error;
    res.sendStatus(status);
}