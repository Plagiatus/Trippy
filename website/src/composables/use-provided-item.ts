import providerInjectionSymbol from "@/provider/provider-injection-symbol";
import Provider, {type ItemType} from "@/provider/provider";
import { inject } from "vue";

export default function useProvidedItem<T extends {}>(type: ItemType<T>) {
    const provider = inject(providerInjectionSymbol, () => new Provider(), true);
    return provider.get<T>(type);
}