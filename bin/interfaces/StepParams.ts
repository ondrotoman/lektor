import type { Position } from '../enums/Position'
import type { StepMountHook, StepUnmountHook } from '../types/StepHooks'

export default interface StepParams {
  element: HTMLElement | null
  body: string
  dialogPosition?: Position
  onMounted?: StepMountHook | null
  onUnmounted?: StepUnmountHook | null
}
