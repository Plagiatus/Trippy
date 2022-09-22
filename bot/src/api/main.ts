import express, { NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "../data";
import { db } from "../db";

export const server = express();
server.use(bodyParser.json());

const corsOptions: cors.CorsOptions = {
    origin: ["https://localhost:3000", "https://maptesting.de"],
}

server.use(cors(corsOptions));

// Catch-all
server.all("*", (req, res) => {
	res.sendStatus(404);
});