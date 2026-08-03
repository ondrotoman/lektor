import type Lektor from '../lektor.js'
import type { Step } from '../step.js'

export interface LektorCallbacks {
  previous: () => Lektor
  next: () => Lektor
  disablePrevious: () => Lektor
  enablePrevious: () => Lektor
  disableNext: () => Lektor
  enableNext: () => Lektor
  addStep: (step: Step) => Lektor
  removeStep: (step: Step) => Lektor
}
