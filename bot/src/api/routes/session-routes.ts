import validationUtils from "../../utils/validation-utils";
import RouteMaker from "../route";
import hash from "object-hash";

export default (({server, responses}) => { 
    server.route("/session/getcode/")
        .post(async (req, res) => {
            let code: string = parseInt(hash(req.body), 16).toString(36).slice(0, 5);
            res.send({ code });
        })
        .all(responses.wrongMethod);

    server.route("/session/setup/:code")
        .get(async (req, res) => {
            let code: string = req.params.code;
            if (!code || code.length != 5) {
                return responses.sendCustomError("Code needs to be 5 characters long.", res);
            }
            if (!validationUtils.isAlphaNumeric(code)) {
                return responses.sendCustomError("Code can only be alphanumerical.", res);
            }
            res.send({ description: "description", name: "name", edition: "java", image: "", ip: "example.com", mode: "other", playerAmt: 0, preferences: { communication: "none", newPlayers: "none", timeEstimate: 0 }, rpLink: "", type: "test", vcAmount: 1, version: "1.19.2", testDescription: "blabla" })
        })
        .all(responses.wrongMethod);
}) satisfies RouteMaker