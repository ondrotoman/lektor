import { Position } from './enums/Position.js';
import type Listener from './interfaces/Listener.js';
import type Notifier from './interfaces/Notifier.js';
import type StepParams from './interfaces/StepParams.js';
import type { StepMountHook, StepUnmountHook } from './types/StepHooks.js';
export declare class Step implements Notifier {
    private _element;
    private _listeners;
    private _body;
    /**
     * Default dialog position
     */
    private _dialogPosition;
    /**
     * Callback for element click
     */
    private _onMounted;
    /**
     * Callback for element click
     */
    private _onUnmounted;
    constructor(params: StepParams);
    get element(): HTMLElement | null;
    set element(element: HTMLElement | null);
    get body(): string;
    set body(body: string);
    get dialogPosition(): Position;
    get onMounted(): StepMountHook | null;
    get onUnmounted(): StepUnmountHook | null;
    static make: (step: StepParams) => Step;
    private notifyListeners;
    setListener: (listener: Listener<Step>) => void;
    unsetListener: (listener: Listener<Step>) => void;
}
