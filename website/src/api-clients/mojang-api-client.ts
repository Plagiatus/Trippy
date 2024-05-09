import { JavaVersion } from "@/types/types";

export default class MojangApiClient {
	public async getJavaVersions() {
		type VersionResponse = {
            "id": string;
            "type": "snapshot"|"release"|"old_beta"|"old_alpha";
            "url": string;
            "time": string;
            "releaseTime": string;
        };

		const reply: {versions: VersionResponse[]} = await (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json")).json();
		const versions: JavaVersion[] = [];
		let currentVersion: JavaVersion = {label: "snapshots", versions: []};
		for (const version of reply.versions) {
			if (version.type === "snapshot" && currentVersion.label === "snapshots") {
				currentVersion.versions.push(version.id);
			} else if (version.type === "release") {
				const versionParts = version.id.split(".");
				const majorVersion = `${versionParts[0]}.${versionParts[1]}`;
				if (majorVersion !== currentVersion.label) {
					if (currentVersion.versions.length > 0) {
						versions.push(currentVersion);
					}
					currentVersion = {label: majorVersion, versions: []};
				}
				currentVersion.versions.push(version.id);
			}
		}
		if (currentVersion.versions.length > 0) {
			versions.push(currentVersion);
		}

		return versions;
	}
}