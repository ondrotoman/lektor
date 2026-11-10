import type { LektorParams } from './interfaces/LektorParams.js'
import type Listener from './interfaces/Listener.js'
import type { Callable } from './types/Callable.js'
import { Position } from './enums/Position.js'
import type { Step } from './step.js'

export default class Lektor implements Listener<Step> {
  /**
   * Starting Z-index
   */
  private readonly _zIndex: number = 9990

  /**
   * Tutorial steps
   */
  private _steps: Step[] = []

  /**
   * Elements class prefix
   */
  private _classPrefix: string

  /**
   * Header text or HTML
   */
  private _header: string

  /**
   * Previous button text
   */
  private _previousButtonText: string

  /**
   * Check if previous step is enabled
   */
  private _isPreviousStepEnabled: boolean = true

  /**
   * Next button text
   */
  private _nextButtonText: string

  /**
   * Check if next step is enabled
   */
  private _isNextStepEnabled: boolean = true

  /**
   * End button text
   */
  private _endButtonText: string

  /**
   * Dialog offset in pixels
   */
  private _dialogOffset: number = 10

  /**
   * Default dialog position
   */
  private _dialogPosition: Position

  /**
   * Check if the keyboard navigation is enabled
   */
  private _isKeyboardNavigationEnabled: boolean = true

  /**
   * Callback after start of tutorial
   */
  private _onStart: Callable | null

  /**
   * Callback after end of tutorial
   */
  private _onEnd: Callable | null

  /**
   * Callback everytime active step changes
   */
  private _onStepChange: Callable | null

  /**
   * Callback after closing the tutorial
   */
  private _onClose: Callable | null

  /**
   * Track active step
   */
  private _activeStep: Step | null = null

  /**
   * Track highlighted element of active step
   */
  private _activeElement: HTMLElement | null = null

  /**
   * Remember active step element styling
   */
  private _originalElementStyling: string = ''

  /**
   * Abort controller for UI event listeners
   */
  private _abort: AbortController | null = null

  /**
   * UI elements
   */
  private _layout: HTMLElement | null = null
  private _curtain: HTMLElement | null = null
  private _dialog: HTMLElement | null = null
  private _dialogArrow: HTMLElement | null = null
  private _dialogHeader: HTMLElement | null = null
  private _dialogHeaderContent: HTMLElement | null = null
  private _dialogBody: HTMLElement | null = null
  private _dialogFooter: HTMLElement | null = null
  private _dialogCloseButton: HTMLButtonElement | null = null
  private _dialogPreviousButton: HTMLButtonElement | null = null
  private _dialogNextButton: HTMLButtonElement | null = null
  private _dialogEndButton: HTMLButtonElement | null = null

  constructor(params?: LektorParams) {
    params?.steps?.forEach((step) => this.addStep(step))

    this._header = params?.header ?? ''
    this._previousButtonText = params?.previousButtonText ?? 'Previous'
    this._nextButtonText = params?.nextButtonText ?? 'Next'
    this._endButtonText = params?.endButtonText ?? 'Done!'
    this._dialogOffset = params?.dialogOffset ?? 10
    this._dialogPosition = params?.dialogPosition ?? Position.BOTTOM
    this._isKeyboardNavigationEnabled = params?.enableKeyboardNavigation ?? true

    this._classPrefix =
      params?.classPrefix === undefined || params?.classPrefix === ''
        ? 'lektor'
        : params?.classPrefix
    this._onStart = params?.onStart ?? null
    this._onEnd = params?.onEnd ?? null
    this._onStepChange = params?.onStepChange ?? null
    this._onClose = params?.onClose ?? null
  }

  /**
   * Add step to lektor
   */
  public addStep = (step: Step): this => {
    step.setListener(this)
    this._steps.push(step)
    this.refreshDialogButtons()
    return this
  }

  /**
   * Add step after another given step, or at the end if the given step is not found
   */
  public addStepAfter = (step: Step, after: Step): this => {
    const index = this._steps.indexOf(after)
    if (index === -1) {
      return this.addStep(step)
    }

    step.setListener(this)
    this._steps.splice(index + 1, 0, step)
    this.refreshDialogButtons()
    return this
  }

  /**
   * Add step before another given step, or at the end if the given step is not found
   */
  public addStepBefore = (step: Step, before: Step): this => {
    const index = this._steps.indexOf(before)
    if (index === -1) {
      return this.addStep(step)
    }

    step.setListener(this)
    this._steps.splice(index, 0, step)
    this.refreshDialogButtons()
    return this
  }

  /**
   * Remove step from lektor
   */
  public removeStep = (step: Step): this => {
    const index = this._steps.indexOf(step)
    if (index === -1) {
      return this
    }

    step.unsetListener(this)

    if (step !== this._activeStep) {
      this._steps.splice(index, 1)
      this.refreshDialogButtons()
      return this
    }

    // Move away from removed active step
    const replacement = this._steps[index + 1] ?? this._steps[index - 1] ?? null
    this._steps.splice(index, 1)
    if (replacement) {
      this.setActiveStep(replacement)
    } else {
      this.end()
    }

    return this
  }

  /**
   * Notify listener about step change
   */
  public notify(payload: Step) {
    if (payload === this._activeStep) {
      this.resetActiveElement()
      this.renderActiveStep()
    }
  }

  /**
   * Check if the tutorial is running
   */
  public isActive = (): boolean => {
    return this._activeStep !== null
  }

  /**
   * Start the tutorial and mount all lektor elements to DOM
   */
  public start = (): void => {
    if (this.isActive() || this._steps.length === 0) {
      return
    }

    this.buildUI()
    this.enablePreviousStep()
    this.enableNextStep()
    this.next()
    this._onStart?.()
  }

  /**
   * Build dialog UI
   */
  private buildUI = () => {
    this._abort = new AbortController()
    const { signal } = this._abort

    // Create dialog header
    this._dialogHeaderContent = this.createDialogHeaderContent()
    this._dialogCloseButton = this.createDialogCloseButton()
    this._dialogHeader = this.createDialogHeader()
    this._dialogHeader.appendChild(this._dialogHeaderContent)
    this._dialogHeader.appendChild(this._dialogCloseButton)
    // Create dialog footer
    this._dialogPreviousButton = this.createDialogPreviousButton()
    this._dialogNextButton = this.createDialogNextButton()
    this._dialogEndButton = this.createDialogEndButton()
    this._dialogFooter = this.createDialogFooter()
    this._dialogFooter.appendChild(this._dialogPreviousButton)
    this._dialogFooter.appendChild(this._dialogNextButton)
    this._dialogFooter.appendChild(this._dialogEndButton)
    // Create dialog body
    this._dialogBody = this.createDialogBody()
    // Create dialog arrow
    this._dialogArrow = this.createDialogArrow()
    // Create dialog
    this._dialog = this.createDialog()
    this._dialog.appendChild(this._dialogArrow)
    this._dialog.appendChild(this._dialogHeader)
    this._dialog.appendChild(this._dialogBody)
    this._dialog.appendChild(this._dialogFooter)
    // Create curtain
    this._curtain = this.createCurtain()
    // Create layout
    this._layout = this.createLayout()
    this._layout.appendChild(this._curtain)
    this._layout.appendChild(this._dialog)

    // Append UI to body
    document.body.appendChild(this._layout)

    document.addEventListener('scroll', this.moveDialog, { signal })
    window.addEventListener('resize', this.moveDialog, { signal })

    if (this._isKeyboardNavigationEnabled) {
      window.addEventListener('keydown', this.handleKeyboardNavigation, { signal })
    }
  }

  /**
   * Check if element accepts text input
   */
  private isEditableElement = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation = (event: KeyboardEvent) => {
    // Do not interfere with user typing into form fields
    if (this.isEditableElement(event.target)) {
      return
    }

    switch (event.key) {
      case 'ArrowLeft':
        this.previous()
        break
      case 'ArrowRight':
        this.next()
        break
      case 'Enter':
        this.next()
        break
      case 'Escape':
        this.close()
        break
      default:
        return
    }
    event.preventDefault()
  }

  /**
   * Get callbacks for hooks
   */
  private getHookCallbacks = () => {
    return {
      previous: this.previous,
      next: this.next,
      disablePrevious: this.disablePreviousStep,
      enablePrevious: this.enablePreviousStep,
      disableNext: this.disableNextStep,
      enableNext: this.enableNextStep,
      addStep: this.addStep,
      removeStep: this.removeStep,
    }
  }

  /**
   * Activate step
   */
  private setActiveStep = (step: Step) => {
    this.resetActiveStep()
    this._activeStep = step
    // Each step starts with navigation enabled, hooks may disable it
    this.enablePreviousStep()
    this.enableNextStep()
    this.beforeStepActivation()
    this.renderActiveStep()
    this.afterStepActivation()
    this._activeStep.onMounted?.(step, this.getHookCallbacks())
    this._onStepChange?.()
  }

  /**
   * Do all the things before step activation
   */
  private beforeStepActivation = () => {
    this._dialog?.classList.remove(this.buildClassName('dialog-active'))
  }

  /**
   * Do all the things after step activation
   */
  private afterStepActivation = () => {
    this._dialog?.classList.add(this.buildClassName('dialog-active'))
  }

  /**
   * Render active step and dialog
   */
  private renderActiveStep = (): void => {
    if (!this._activeStep) {
      return
    }

    const element = this._activeStep.element
    if (element) {
      this._activeElement = element
      this._originalElementStyling = element.style.cssText

      if (['', 'static'].includes(element.style.position)) {
        element.style.position = 'relative'
      }
      element.style.zIndex = String(Number(this._zIndex) + 2)
      element.classList.add(this.buildClassName('active-element'))

      if (!this.isElementFullyVisible(element)) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        })
      }
    }

    this.setDialogHeaderContent()
    this.setDialogBody()
    this.setDialogButtons()

    this.moveDialog()
  }

  /**
   * Reset highlighted element styling to its original state
   */
  private resetActiveElement = (): void => {
    if (this._activeElement) {
      this._activeElement.style.cssText = this._originalElementStyling
      this._activeElement.classList.remove(this.buildClassName('active-element'))
      this._activeElement = null
    }
  }

  /**
   * Reset active step to its original state
   */
  private resetActiveStep = (): void => {
    this.resetActiveElement()
    this._activeStep?.onUnmounted?.(this._activeStep, this.getHookCallbacks())
  }

  /**
   * Move dialog to active step
   */
  private moveDialog = () => {
    if (!this._dialog || !this._activeStep) {
      return
    }

    // Measure dialog at its natural size, not squeezed by its previous position
    this._dialog.style.top = '0'
    this._dialog.style.left = '0'
    const dialogRect = this._dialog.getBoundingClientRect()
    const viewport = this.getViewportSize()

    let top: number
    let left: number
    if (!this._activeStep.element) {
      top = (viewport.height - dialogRect.height) / 2
      left = (viewport.width - dialogRect.width) / 2
      delete this._dialog.dataset.position
    } else {
      const elementRect = this._activeStep.element.getBoundingClientRect()
      const position = this.getDialogPosition(elementRect, dialogRect, viewport)
      const coordinates = this.getDialogCoordinates(position, elementRect, dialogRect)
      top = coordinates.top
      left = coordinates.left
      this._dialog.dataset.position = position
    }

    // Keep dialog inside the visible screen
    const offset = this._dialogOffset
    top = this.clamp(top, offset, viewport.height - dialogRect.height - offset)
    left = this.clamp(left, offset, viewport.width - dialogRect.width - offset)

    this._dialog.style.top = Math.round(top + window.scrollY) + 'px'
    this._dialog.style.left = Math.round(left + window.scrollX) + 'px'
  }

  /**
   * Get visible screen size without scrollbars
   */
  private getViewportSize = (): { width: number; height: number } => {
    return {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: document.documentElement.clientHeight || window.innerHeight,
    }
  }

  /**
   * Pick dialog position around the element, starting with the preferred one,
   * then the opposite side and then the remaining sides with more space first
   */
  private getDialogPosition = (
    elementRect: DOMRect,
    dialogRect: DOMRect,
    viewport: { width: number; height: number },
  ): Position => {
    const offset = this._dialogOffset
    const preferred = this._activeStep?.dialogPosition ?? this._dialogPosition

    // Space left around the element after the dialog and offsets are placed
    const spaceLeft: Record<Position, number> = {
      [Position.TOP]: elementRect.top - dialogRect.height - offset * 2,
      [Position.BOTTOM]: viewport.height - elementRect.bottom - dialogRect.height - offset * 2,
      [Position.LEFT]: elementRect.left - dialogRect.width - offset * 2,
      [Position.RIGHT]: viewport.width - elementRect.right - dialogRect.width - offset * 2,
    }

    const opposite: Record<Position, Position> = {
      [Position.TOP]: Position.BOTTOM,
      [Position.BOTTOM]: Position.TOP,
      [Position.LEFT]: Position.RIGHT,
      [Position.RIGHT]: Position.LEFT,
    }

    const remaining = Object.values(Position)
      .filter((p) => p !== preferred && p !== opposite[preferred])
      .sort((a, b) => spaceLeft[b] - spaceLeft[a])
    const candidates = [preferred, opposite[preferred], ...remaining]

    // Fall back to the side with the most space, the dialog is clamped to the screen anyway
    return (
      candidates.find((p) => spaceLeft[p] >= 0) ??
      candidates.reduce((best, p) => (spaceLeft[p] > spaceLeft[best] ? p : best))
    )
  }

  /**
   * Get dialog coordinates next to the element in given position
   */
  private getDialogCoordinates = (
    position: Position,
    elementRect: DOMRect,
    dialogRect: DOMRect,
  ): { top: number; left: number } => {
    const offset = this._dialogOffset
    switch (position) {
      case Position.TOP:
        return { top: elementRect.top - dialogRect.height - offset, left: elementRect.left }
      case Position.LEFT:
        return { top: elementRect.top, left: elementRect.left - dialogRect.width - offset }
      case Position.RIGHT:
        return { top: elementRect.top, left: elementRect.right + offset }
      case Position.BOTTOM:
      default:
        return { top: elementRect.bottom + offset, left: elementRect.left }
    }
  }

  /**
   * Clamp value between min and max, preferring min when the range is empty
   */
  private clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(value, max))
  }

  /**
   * Check if element is fully visible
   */
  private isElementFullyVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  /**
   * Set header content
   */
  private setDialogHeaderContent = () => {
    if (this._dialogHeaderContent && this._activeStep) {
      this._dialogHeaderContent.innerHTML = this._activeStep.header ?? this._header
    }
  }

  /**
   * Set dialog body
   */
  private setDialogBody = () => {
    if (this._dialogBody && this._activeStep) {
      this._dialogBody.innerHTML = this._activeStep.body ?? ''
    }
  }

  /**
   * Set text for dialog buttons
   */
  private setDialogButtons = () => {
    if (this._dialogPreviousButton) {
      this._dialogPreviousButton.innerText =
        this._activeStep?.previousButtonText ?? this._previousButtonText
    }

    if (this._dialogNextButton) {
      this._dialogNextButton.innerText = this._activeStep?.nextButtonText ?? this._nextButtonText
    }

    if (this._dialogEndButton) {
      this._dialogEndButton.innerText = this._activeStep?.endButtonText ?? this._endButtonText
    }

    if (this.getPreviousStep()) {
      this._dialogPreviousButton?.style.removeProperty('display')
    } else if (this._dialogPreviousButton) {
      this._dialogPreviousButton.style.display = 'none'
    }

    if (this.getNextStep()) {
      this._dialogNextButton?.style.removeProperty('display')
      if (this._dialogEndButton) {
        this._dialogEndButton.style.display = 'none'
      }
    } else {
      if (this._dialogNextButton) {
        this._dialogNextButton.style.display = 'none'
      }
      this._dialogEndButton?.style.removeProperty('display')
    }
  }

  /**
   * Update dialog buttons after steps change while tutorial is running
   */
  private refreshDialogButtons = (): void => {
    if (this.isActive()) {
      this.setDialogButtons()
    }
  }

  /**
   * End tutorial
   */
  public end = () => {
    this.destroy()
    this._onEnd?.()
  }

  /**
   * Close tutorial
   */
  public close = (): void => {
    this.destroy()
    this._onClose?.()
  }

  /**
   * Destroy Lektor
   */
  private destroy = (): void => {
    this.resetActiveStep()
    this._activeStep = null
    this._abort?.abort()
    this._abort = null
    this._layout?.remove()
    this._layout = null
  }

  /**
   * Go to previous step
   */
  public previous = (): Lektor => {
    if (this._isPreviousStepEnabled) {
      const previousStep = this.getPreviousStep()
      if (previousStep) {
        this.setActiveStep(previousStep)
      }
    }

    return this
  }

  /**
   * Get previous step if there is any
   */
  private getPreviousStep = (): Step | null => {
    if (this._steps.length === 0) {
      return null
    }

    let previousStep: Step | null = null
    if (!this._activeStep) {
      previousStep = this._steps[0]
    } else {
      const index = this._steps.indexOf(this._activeStep)
      if (index !== -1 && this._steps[index - 1]) {
        previousStep = this._steps[index - 1]
      }
    }

    return previousStep
  }

  /**
   * Disable previous step
   */
  public disablePreviousStep = (): Lektor => {
    this._isPreviousStepEnabled = false
    if (this._dialogPreviousButton) {
      this._dialogPreviousButton.disabled = true
    }
    return this
  }

  /**
   * Enable previous step
   */
  public enablePreviousStep = (): Lektor => {
    this._isPreviousStepEnabled = true
    if (this._dialogPreviousButton) {
      this._dialogPreviousButton.disabled = false
    }

    return this
  }

  /**
   * Go to next step
   */
  public next = (): Lektor => {
    if (this._isNextStepEnabled) {
      const nextStep = this.getNextStep()
      if (nextStep) {
        this.setActiveStep(nextStep)
      } else {
        this.end()
      }
    }

    return this
  }

  /**
   * Get next step if there is any
   */
  private getNextStep = (): Step | null => {
    if (this._steps.length === 0) {
      return null
    }

    let nextStep: Step | null = null
    if (!this._activeStep) {
      nextStep = this._steps[0]
    } else {
      const index = this._steps.indexOf(this._activeStep)
      if (index !== -1 && this._steps[index + 1]) {
        nextStep = this._steps[index + 1]
      }
    }

    return nextStep
  }

  /**
   * Disable next step
   */
  public disableNextStep = (): Lektor => {
    this._isNextStepEnabled = false
    if (this._dialogNextButton) {
      this._dialogNextButton.disabled = true
    }

    return this
  }

  /**
   * Enable next step
   */
  public enableNextStep = (): Lektor => {
    this._isNextStepEnabled = true
    if (this._dialogNextButton) {
      this._dialogNextButton.disabled = false
    }

    return this
  }

  /**
   * Generate class name for element with given prefix
   */
  private buildClassName = (name: string): string => {
    return [this._classPrefix, name].join('-')
  }

  /**
   * Create tutorial layout element
   */
  private createLayout = (): HTMLElement => {
    const name = 'layout'
    const layout = document.createElement('div')
    layout.dataset.lektor = name
    layout.classList.add(this.buildClassName(name))
    return layout
  }

  /**
   * Create tutorial curtain element
   */
  private createCurtain = (): HTMLElement => {
    const name = 'curtain'
    const curtain = document.createElement('div')
    curtain.dataset.lektor = name
    curtain.style.display = 'block'
    curtain.style.position = 'fixed'
    curtain.style.top = '0'
    curtain.style.bottom = '0'
    curtain.style.left = '0'
    curtain.style.right = '0'
    curtain.style.zIndex = String(Number(this._zIndex) + 1)
    curtain.classList.add(this.buildClassName(name))
    return curtain
  }

  /**
   * Create tutorial dialog
   */
  private createDialog = (): HTMLElement => {
    const name = 'dialog'
    const dialog = document.createElement('dialog')
    dialog.dataset.lektor = name
    dialog.style.display = 'flex'
    dialog.style.position = 'absolute'
    dialog.style.top = '0'
    dialog.style.left = '0'
    dialog.style.zIndex = String(Number(this._zIndex) + 3)
    dialog.classList.add(this.buildClassName(name))

    return dialog
  }

  /**
   * Create dialog to element arrow
   */
  private createDialogArrow = (): HTMLElement => {
    const name = 'arrow'
    const arrow = document.createElement('div')
    arrow.dataset.lektor = name
    arrow.style.position = 'absolute'
    arrow.style.top = '0'
    arrow.style.left = '0'
    arrow.style.zIndex = String(Number(this._zIndex) + 5)
    arrow.classList.add(this.buildClassName(name))
    return arrow
  }

  /**
   * Create tutorial dialog header
   */
  private createDialogHeader = (): HTMLElement => {
    const name = 'header'
    const header = document.createElement('header')
    header.dataset.lektor = name
    header.classList.add(this.buildClassName(name))
    return header
  }

  /**
   * Create tutorial dialog header content
   */
  private createDialogHeaderContent = (): HTMLElement => {
    const name = 'header-content'
    const headerContent = document.createElement('div')
    headerContent.dataset.lektor = name
    headerContent.classList.add(this.buildClassName(name))
    return headerContent
  }

  /**
   * Create tutorial dialog close button
   */
  private createDialogCloseButton = (): HTMLButtonElement => {
    const name = 'close-button'
    const closeButton = document.createElement('button')
    closeButton.dataset.lektor = name
    closeButton.classList.add(this.buildClassName(name))
    closeButton.innerText = '✕'
    closeButton.addEventListener('click', this.close, { signal: this._abort?.signal })
    return closeButton
  }

  /**
   * Create tutorial dialog body
   */
  private createDialogBody = (): HTMLElement => {
    const name = 'body'
    const body = document.createElement('main')
    body.dataset.lektor = name
    body.classList.add(this.buildClassName(name))
    return body
  }

  /**
   * Create tutorial dialog footer
   */
  private createDialogFooter = (): HTMLElement => {
    const name = 'footer'
    const footer = document.createElement('footer')
    footer.dataset.lektor = name
    footer.classList.add(this.buildClassName(name))
    return footer
  }

  /**
   * Create dialog previous button
   */
  private createDialogPreviousButton = (): HTMLButtonElement => {
    const name = 'previous-button'
    const previousButton = document.createElement('button')
    previousButton.dataset.lektor = name
    previousButton.innerText = this._previousButtonText
    previousButton.classList.add(this.buildClassName(name))
    previousButton.addEventListener('click', this.previous, { signal: this._abort?.signal })
    return previousButton
  }

  /**
   * Create tutorial next button
   */
  private createDialogNextButton = (): HTMLButtonElement => {
    const name = 'next-button'
    const nextButton = document.createElement('button')
    nextButton.dataset.lektor = name
    nextButton.innerText = this._nextButtonText
    nextButton.classList.add(this.buildClassName(name))
    nextButton.addEventListener('click', this.next, { signal: this._abort?.signal })
    return nextButton
  }

  /**
   * Create tutorial end button
   */
  private createDialogEndButton = (): HTMLButtonElement => {
    const name = 'end-button'
    const endButton = document.createElement('button')
    endButton.dataset.lektor = name
    endButton.innerText = this._endButtonText
    endButton.classList.add(this.buildClassName(name))
    endButton.addEventListener('click', this.end, { signal: this._abort?.signal })
    return endButton
  }
}
