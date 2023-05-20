import Config from "@/config";
import Provider from "@/provider/provider";

export default abstract class BaseApiClient {
    protected readonly config: Config;

    public constructor(provider: Provider) {
        this.config = provider.get(Config);
    }

    protected get(path: string, params?: Record<string,string>) {
        return this.wrapRequest(() => {
            const url = new URL(this.getFullPath(path));
            if (params) {
                for (const [key,value] of Object.entries(params)) {
                    url.searchParams.set(key, value);
                }
            }

            return fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
        });
    }

    protected post(path: string, data?: unknown) {
        return this.wrapRequest(() => {
            return fetch(this.getFullPath(path), {
                method: "POST",
                body: data === undefined ? undefined : JSON.stringify(data),
                headers: { "Content-Type": "application/json" }
            });
        });
    }

    private async wrapRequest(wrapper: () => Promise<Response>) {
        try {
            const response = await wrapper();
            if (!response.ok) {
                return { error: { status: response.status, statusText: response.statusText }}
            }

            const responseText = await response.text();
            return { data: responseText };
        } catch (error) {
            return { error };
        }
    }

    private getFullPath(path: string) {
        if (path.startsWith("/")) {
            return this.config.apiUrl + path;
        }
        return this.config.apiUrl + "/" + path;
    }
}