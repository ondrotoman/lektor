import { Position } from './enums/Position'
import type Listener from './interfaces/Listener'
import type Notifier from './interfaces/Notifier'
import type StepParams from './interfaces/StepParams'
import type { StepMountHook, StepUnmountHook } from './types/StepHooks'

export default class Step implements Notifier {
  private _element: HTMLElement | null = null
  private _listeners: Listener<Step>[] = []
  private _body: string = ''

  /**
   * Default dialog position
   */
  private _dialogPosition: Position

  /**
   * Callback for element click
   */
  private _onMounted: StepMountHook | null = null
  /**
   * Callback for element click
   */
  private _onUnmounted: StepUnmountHook | null = null

  constructor(params: StepParams) {
    this._element = params.element
    this._body = params.body
    this._dialogPosition = params.dialogPosition ?? Position.BOTTOM
    this._onMounted = params.onMounted ?? null
    this._onUnmounted = params.onUnmounted ?? null
  }

  get element(): HTMLElement | null {
    return this._element
  }

  set element(element: HTMLElement | null) {
    this._element = element
    this.notifyListeners()
  }

  get body(): string {
    return this._body
  }

  set body(body: string) {
    this._body = body
    this.notifyListeners()
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

  static make = (step: StepParams): Step => {
    return new Step(step)
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
