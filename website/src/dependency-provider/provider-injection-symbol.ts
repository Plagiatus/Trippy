import { InjectionKey } from "vue";
import DependencyProvider from "$/dependency-provider/dependency-provider";

export default Symbol("provider") as InjectionKey<DependencyProvider>;