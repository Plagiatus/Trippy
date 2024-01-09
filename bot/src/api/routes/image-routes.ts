import RouteMaker from "../route";
import DatabaseClient from "../../database-client";

export default (({server, responses, provider}) => { 
    const databaseClient = provider.get(DatabaseClient);

    server.route("/image/:id")
        .get(async (req, res) => {
            const imageId = req.params.id;
			const image = await databaseClient.imageRepository.get(imageId);

			if (!image) {
				responses.sendCustomError("Invalid image id.", res)
				return;
			}

			res.set("content-type", "image/png");
			res.send(image.imageData.buffer);
        })
		.all(responses.wrongMethod);
}) satisfies RouteMaker