import { defineComponent } from "vue";

const url: URL = new URL(window.location.href);
const requestUrl: string = (url.hostname == "localhost") ? "http://localhost:9009" : "https://api.maptesting.de";

export default defineComponent({
    name: "request",
    methods: {
        async sendRequest(_path: string, _method: "GET" | "POST", _data: any = {}): Promise<RequestReply> {
            try {
                if (!_path.startsWith("/")) _path = "/" + _path;
                let response: Response;
                if (_method == "GET") {
                    response = await fetch(requestUrl + _path);
                }
                else if (_method == "POST") {
                    response = await fetch(requestUrl + _path, {
                        method: _method,
                        body: JSON.stringify(_data),
                        headers: { "Content-Type": "application/json" }
                    });
                } else {
                    return { error: "No supported method specified" };
                }

                if (!response.ok) {
                    return { error: response.status + "; " + response.statusText }
                }

                const responseText = await response.text();

                return { data: responseText };
            } catch (error) {
                return { error };
            }
        }
    }
});

interface RequestReply {
    error?: any;
    data?: string;
}