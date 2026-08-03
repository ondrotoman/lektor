import { Position } from './enums/Position.js'
import type Listener from './interfaces/Listener.js'
import type Notifier from './interfaces/Notifier.js'
import type StepParams from './interfaces/StepParams.js'
import type { StepMountHook, StepUnmountHook } from './types/StepHooks.js'

export class Step implements Notifier {
  private _element: HTMLElement | null = null
  private _body: string = ''
  private _header: string | null = null
  private _listeners: Listener<Step>[] = []
  private _dialogPosition: Position
  private _onMounted: StepMountHook | null = null
  private _onUnmounted: StepUnmountHook | null = null

  constructor(params: StepParams) {
    this._element = params.element ?? null
    this._body = params.body
    this._header = params.header ?? null
    this._dialogPosition = params.dialogPosition ?? Position.BOTTOM
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

  get dialogPosition(): Position {
    return this._dialogPosition
  }

  get onMounted(): StepMountHook | null {
    return this._onMounted
  }

  get onUnmounted(): StepUnmountHook | null {
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
