import { InjectionKey } from "vue";
import Provider from "$/provider/provider";

export default Symbol("provider") as InjectionKey<Provider>;