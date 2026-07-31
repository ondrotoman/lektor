import type { Position } from '../enums/Position.js'
import type { StepMountHook, StepUnmountHook } from '../types/StepHooks.js'

export default interface StepParams {
  element: HTMLElement | null
  body: string
  dialogPosition?: Position
  onMounted?: StepMountHook | null
  onUnmounted?: StepUnmountHook | null
}
