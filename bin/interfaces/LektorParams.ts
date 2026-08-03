import type { Position } from '../enums/Position.js'
import type { Step } from '../step.js'
import type { Callable } from '../types/Callable.js'

export interface LektorParams {
  steps?: Step[]
  header?: string
  previousButtonText?: string
  nextButtonText?: string
  endButtonText?: string
  classPrefix?: string
  dialogOffset?: number
  dialogPositon?: Position
  enableKeyboardNavigation?: boolean
  onStart?: Callable
  onEnd?: Callable
  onStepChange?: Callable
  onClose?: Callable
}
