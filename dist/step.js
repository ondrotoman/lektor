import { Position } from './enums/Position.js';
export class Step {
    _element = null;
    _listeners = [];
    _body = '';
    /**
     * Default dialog position
     */
    _dialogPosition;
    /**
     * Callback for element click
     */
    _onMounted = null;
    /**
     * Callback for element click
     */
    _onUnmounted = null;
    constructor(params) {
        this._element = params.element;
        this._body = params.body;
        this._dialogPosition = params.dialogPosition ?? Position.BOTTOM;
        this._onMounted = params.onMounted ?? null;
        this._onUnmounted = params.onUnmounted ?? null;
    }
    get element() {
        return this._element;
    }
    set element(element) {
        this._element = element;
        this.notifyListeners();
    }
    get body() {
        return this._body;
    }
    set body(body) {
        this._body = body;
        this.notifyListeners();
    }
    get dialogPosition() {
        return this._dialogPosition;
    }
    get onMounted() {
        return this._onMounted;
    }
    get onUnmounted() {
        return this._onUnmounted;
    }
    static make = (step) => {
        return new Step(step);
    };
    notifyListeners = () => {
        this._listeners.forEach((listener) => listener?.notify(this));
    };
    setListener = (listener) => {
        this._listeners.push(listener);
    };
    unsetListener = (listener) => {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
            this._listeners.splice(index, 1);
        }
    };
}
