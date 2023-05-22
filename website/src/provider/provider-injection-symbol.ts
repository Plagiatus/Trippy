import { InjectionKey } from "vue";
import Provider from "./provider";

export default Symbol("provider") as InjectionKey<Provider>;