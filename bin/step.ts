import type { Position } from './enums/Position.js'
import type { LektorCallbacks } from './interfaces/LektorCallbacks.js'
import type Listener from './interfaces/Listener.js'
import type Notifier from './interfaces/Notifier.js'
import type StepParams from './interfaces/StepParams.js'

export class Step implements Notifier {
  private _listeners: Listener<Step>[] = []
  private _element: HTMLElement | null = null
  private _body: string = ''
  private _header: string | null = null
  private _previousButtonText: string | null = null
  private _nextButtonText: string | null = null
  private _endButtonText: string | null = null
  private _dialogPosition: Position | null = null
  private _onMounted: ((step: Step | null, callbacks: LektorCallbacks) => void) | null = null
  private _onUnmounted: ((step: Step | null, callbacks: LektorCallbacks) => void) | null = null

  constructor(params: StepParams) {
    this._element = params.element ?? null
    this._body = params.body
    this._header = params.header ?? null
    this._previousButtonText = params.previousButtonText ?? null
    this._nextButtonText = params.nextButtonText ?? null
    this._endButtonText = params.endButtonText ?? null
    this._dialogPosition = params.dialogPosition ?? null
    this._onMounted = params.onMounted ?? null
    this._onUnmounted = params.onUnmounted ?? null
  }

  get element(): HTMLElement | null {
    return this._element
  }

  setElement(element: HTMLElement | null): this {
    this._element = element
    this.notifyListeners()
    return this
  }

  get body(): string {
    return this._body
  }

  setBody(body: string): this {
    this._body = body
    this.notifyListeners()
    return this
  }

  get header(): string | null {
    return this._header
  }

  setHeader(header: string | null): this {
    this._header = header
    this.notifyListeners()
    return this
  }

  get previousButtonText(): string | null {
    return this._previousButtonText
  }

  setPreviousButtonText(text: string | null): this {
    this._previousButtonText = text
    this.notifyListeners()
    return this
  }

  get nextButtonText(): string | null {
    return this._nextButtonText
  }

  setNextButtonText(text: string | null): this {
    this._nextButtonText = text
    this.notifyListeners()
    return this
  }

  get endButtonText(): string | null {
    return this._endButtonText
  }

  setEndButtonText(text: string | null): this {
    this._endButtonText = text
    this.notifyListeners()
    return this
  }

  get dialogPosition(): Position | null {
    return this._dialogPosition
  }

  get onMounted(): ((step: Step | null, callbacks: LektorCallbacks) => void) | null {
    return this._onMounted
  }

  get onUnmounted(): ((step: Step | null, callbacks: LektorCallbacks) => void) | null {
    return this._onUnmounted
  }

  private notifyListeners = (): void => {
    this._listeners.forEach((listener) => listener?.notify(this))
  }

  setListener = (listener: Listener<Step>): void => {
    this._listeners.push(listener)
  }

  unsetListener = (listener: Listener<Step>): void => {
    const index = this._listeners.indexOf(listener)
    if (index !== -1) {
      this._listeners.splice(index, 1)
    }
  }
}
