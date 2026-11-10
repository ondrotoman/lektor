import type { LektorCallbacks } from '../interfaces/LektorCallbacks.js'

export type StepHook = <T extends HTMLElement>(
  element: T | null,
  callbacks: LektorCallbacks,
) => void

export type StepUnmountHook = <T extends HTMLElement>(
  element: T | null,
  callbacks: LektorCallbacks,
) => void
