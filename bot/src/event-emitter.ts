export type EventListener<TEvent extends ReadonlyArray<unknown>> = (...args: TEvent) => void;

export default class EventEmitter<TEvent extends ReadonlyArray<unknown>> {
	private listeners: Set<EventListener<TEvent>>;

	public constructor(private readonly errorHandler?: (error: unknown) => void) {
		this.listeners = new Set();
	}
	
	public addListener(listener: EventListener<TEvent>) {
		this.listeners.add(listener);
	}

	public removeListener(listener: EventListener<TEvent>) {
		this.listeners.delete(listener);
	}

	public emit(...event: TEvent) {
		const listenersCopy = [...this.listeners];
		for (const listener of listenersCopy) {
			if (this.listeners.has(listener)) {
				try {
					listener(...event);
				} catch(error) {
					this.errorHandler?.(error);
				}
			}
		}
	}
}