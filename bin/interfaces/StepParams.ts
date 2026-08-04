import type { Position } from '../enums/Position.js'
import type { Step } from '../step.js'
import type { LektorCallbacks } from './LektorCallbacks.js'

export default interface StepParams {
  body: string
  element?: HTMLElement | null
  header?: string
  dialogPosition?: Position
  onMounted?: (step: Step | null, callbacks: LektorCallbacks) => void | null
  onUnmounted?: (step: Step | null, callbacks: LektorCallbacks) => void | null
}
