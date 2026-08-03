import { Position } from './enums/Position.js';
export class Step {
    _element = null;
    _body = '';
    _header = null;
    _listeners = [];
    _dialogPosition;
    _onMounted = null;
    _onUnmounted = null;
    constructor(params) {
        this._element = params.element ?? null;
        this._body = params.body;
        this._header = params.header ?? null;
        this._dialogPosition = params.dialogPosition ?? Position.BOTTOM;
        this._onMounted = params.onMounted ?? null;
        this._onUnmounted = params.onUnmounted ?? null;
    }
    get element() {
        return this._element;
    }
    setElement(element) {
        this._element = element;
        this.notifyListeners();
        return this;
    }
    get body() {
        return this._body;
    }
    setBody(body) {
        this._body = body;
        this.notifyListeners();
        return this;
    }
    get header() {
        return this._header;
    }
    setHeader(header) {
        this._header = header;
        this.notifyListeners();
        return this;
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
