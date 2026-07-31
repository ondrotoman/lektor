import type { Position } from '../enums/Position'
import Step from '../step'
import type { Callable } from '../types/Callable'

export interface LektorParams {
  steps: Step[]
  headerText?: string
  previousButtonText?: string
  nextButtonText?: string
  endButtonText?: string
  classPrefix?: string
  startingZIndex?: number
  dialogOffset?: number
  dialogPositon?: Position
  onStart?: Callable
  onEnd?: Callable
  onClose?: Callable
}
