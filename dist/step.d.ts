import { Position } from './enums/Position.js';
import type Listener from './interfaces/Listener.js';
import type Notifier from './interfaces/Notifier.js';
import type StepParams from './interfaces/StepParams.js';
import type { StepMountHook, StepUnmountHook } from './types/StepHooks.js';
export declare class Step implements Notifier {
    private _element;
    private _body;
    private _header;
    private _listeners;
    private _dialogPosition;
    private _onMounted;
    private _onUnmounted;
    constructor(params: StepParams);
    get element(): HTMLElement | null;
    setElement(element: HTMLElement | null): this;
    get body(): string;
    setBody(body: string): this;
    get header(): string | null;
    setHeader(header: string | null): this;
    get dialogPosition(): Position;
    get onMounted(): StepMountHook | null;
    get onUnmounted(): StepUnmountHook | null;
    private notifyListeners;
    setListener: (listener: Listener<Step>) => void;
    unsetListener: (listener: Listener<Step>) => void;
}
