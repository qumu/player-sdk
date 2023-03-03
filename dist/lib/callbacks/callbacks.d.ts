export declare type FunctionOrPromise = Function | {
    reject: Function;
    resolve: Function;
};
export declare class CallbackStore {
    private readonly map;
    /**
     * Gets all the callbacks for a specific event name
     *
     * @param name the event name we want the callbacks from
     */
    getCallbacks(name: string): Function[] | FunctionOrPromise[];
    /**
     * Removes the given callback for the event
     *
     * @param name the event name we want the callbacks from
     * @param callback the callback to remove. If empty, it will remove all callbacks
     */
    removeCallback(name: string, callback?: FunctionOrPromise): void;
    /**
     * Removes and return the first callback for the name
     *
     * @param name the event name we want the callbacks from
     */
    shiftCallback(name: string): FunctionOrPromise | undefined;
    /**
     * Stores the callback for the event
     *
     * @param name the event name we want the callbacks from
     * @param callback the callback to store
     */
    storeCallback(name: string, callback: FunctionOrPromise): void;
}
