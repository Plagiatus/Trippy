export default class MojangApiClient {
    private static readonly oldestVersion = 7;

    public constructor() {

    }

    public async getJavaVersions() {
        const reply = await (await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json")).json();
        const versions: JavaVersion[] = [];
        let prevMajor = "";
        if (reply.versions) {
            let javaVersion: JavaVersion = { label: "", versions: [] };
            for (let i: number = 0; i < reply.versions.length; i++) {
                if (reply.versions[i].type == "release") {
                    let id = reply.versions[i].id;
                    let v = id.split(".");
                    if (+v[1] < MojangApiClient.oldestVersion) break;
                    if (v[1] != prevMajor) {
                        javaVersion = { label: `${v[0]}.${v[1]}`, versions: [] };
                        prevMajor = v[1];
                        versions.push(javaVersion);
                    }
                    javaVersion.versions.push(id);
                }
            }
        }

        return versions;
    }
}