import type { LektorParams } from './interfaces/LektorParams.js'
import type Listener from './interfaces/Listener.js'
import type { Callable } from './types/Callable.js'
import { Position } from './enums/Position.js'
import type { Step } from './step.js'

export default class Lektor implements Listener<Step> {
  /**
   * Starting Z-index
   */
  private readonly _zIndex: number = 99990

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
   * Remember active step element styling
   */
  private _originalElementStyling: string = ''

  /**
   * UI elements
   */
  private _layout: HTMLElement | null = null
  private _curtain: HTMLElement | null = null
  private _dialog: HTMLElement | null = null
  private _dialogHeader: HTMLElement | null = null
  private _dialogHeaderText: HTMLElement | null = null
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
    return this
  }

  /**
   * Add step after another given step
   */
  public addStepAfter = (step: Step): this => {
    const index = this._steps.indexOf(step)
    if (index !== -1) {
      this._steps.splice(index + 1, 0, step)
    }
    step.setListener(this)
    return this
  }

  /**
   * Add step after before given step
   */
  public addStepBefore = (step: Step): this => {
    step.setListener(this)
    this._steps.push(step)
    return this
  }

  /**
   * Remove step to lektor
   */
  public removeStep = (step: Step): this => {
    const index = this._steps.indexOf(step)
    if (index !== -1) {
      this._steps.splice(index, 1)
    }
    return this
  }

  /**
   * Notify listener about step change
   */
  public notify(payload: Step) {
    if (payload === this._activeStep) {
      this.resetActiveStep()
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
    if (this.isActive()) {
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
    // Create dialog header
    this._dialogHeaderText = this.createDialogHeaderText()
    this._dialogCloseButton = this.createDialogCloseButton()
    this._dialogHeader = this.createDialogHeader()
    this._dialogHeader.appendChild(this._dialogHeaderText)
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
    // Create dialog
    this._dialog = this.createDialog()
    this._dialog.appendChild(this._dialogHeader)
    this._dialog.appendChild(this._dialogBody)
    this._dialog.appendChild(this._dialogFooter)
    // Create curtian
    this._curtain = this.createCurtain()
    // Create layout
    this._layout = this.createLayout()
    this._layout.appendChild(this._curtain)
    this._layout.appendChild(this._dialog)

    // Append UI to body
    document.body.appendChild(this._layout)

    document.addEventListener('scroll', this.moveDialog)
    window.addEventListener('resize', this.moveDialog)

    if (this._isKeyboardNavigationEnabled) {
      window.addEventListener('keydown', this.handleKeyboardNavigation)
    }
  }

  /**
   * Handle keyboard navigation
   */
  private handleKeyboardNavigation = (event: KeyboardEvent) => {
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
        this.end()
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
    this.renderActiveStep()
    this._activeStep.onMounted?.(step.element, this.getHookCallbacks())
    this._onStepChange?.()
  }

  /**
   * Render active step and dialog
   */
  private renderActiveStep = (): void => {
    if (!this._activeStep) {
      return
    }
    this._dialog?.classList.remove(this.buildClassName('dialog'))

    if (this._activeStep.element) {
      this._originalElementStyling = this._activeStep.element.style.cssText

      if (['', 'static'].includes(this._activeStep.element.style.position)) {
        this._activeStep.element.style.position = 'relative'
      }
      this._activeStep.element.style.zIndex = String(Number(this._zIndex) + 2)
      this._activeStep.element.classList.add(this.buildClassName('active-element'))
    }

    if (this._activeStep?.element && !this.isElementFullyVisible(this._activeStep.element)) {
      this._activeStep.element?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }

    this.setDialogHeaderText()
    this.setDialogBody()
    this.setDialogButtons()
    this._dialog?.classList.add(this.buildClassName('dialog'))
    this.moveDialog()
  }

  /**
   * Reset steps styling to it's original state
   */
  private resetActiveStep = (): void => {
    if (this._activeStep?.element) {
      this._activeStep.element.style.cssText = this._originalElementStyling || ''
      this._activeStep.element.classList.remove(this.buildClassName('active-element'))
    }

    this._activeStep?.onUnmounted?.(this._activeStep.element, this.getHookCallbacks())
  }

  /**
   * Move dialog to active step
   */
  private moveDialog = () => {
    if (!this._dialog || !this._activeStep) {
      return
    }

    let top = 0
    let left = 0
    const activeElementRect = this._activeStep.element?.getBoundingClientRect()
    const dialogRect = this._dialog.getBoundingClientRect()
    if (!activeElementRect) {
      console.log(
        'bez elementu ' +
          window.innerHeight +
          ' / ' +
          dialogRect.height +
          ' ' +
          window.innerWidth +
          ' / ' +
          dialogRect.width,
      )
      top = Math.round(window.innerHeight / 2 - dialogRect.height / 2)
      left = Math.round(window.innerWidth / 2 - dialogRect.width / 2)
    } else {
      let position: Position = this._activeStep.dialogPosition
      if (!this.canDialogFit(this._activeStep.dialogPosition)) {
        position =
          Object.values(Position).find((p) => this.canDialogFit(p)) ??
          this._activeStep.dialogPosition
      }

      const relativeTop = activeElementRect.top + window.scrollY
      const relativeLeft = activeElementRect.left + window.scrollX
      if (position == Position.TOP) {
        top = relativeTop - (dialogRect.height + this._dialogOffset)
        left = relativeLeft
      } else if (position == Position.BOTTOM) {
        top = relativeTop + activeElementRect.height + this._dialogOffset
        left = relativeLeft
      } else if (position == Position.LEFT) {
        left = relativeLeft - dialogRect.width - this._dialogOffset
        top = relativeTop
      } else if (position == Position.RIGHT) {
        top = relativeTop
        left = relativeLeft + activeElementRect.width + this._dialogOffset
      }
    }

    this._dialog.style.top = top + 'px'
    this._dialog.style.left = left + 'px'
  }

  /**
   * Check if dialog fits around the element
   */
  private canDialogFit = (position: Position): boolean => {
    if (!this._dialog || !this._activeStep?.element) {
      return false
    }

    const activeElementRect = this._activeStep.element.getBoundingClientRect()
    const dialogRect = this._dialog.getBoundingClientRect()
    const canFitAbove = activeElementRect.top - (dialogRect.height + this._dialogOffset) >= 0
    const canFitBellow =
      window.innerHeight > activeElementRect.bottom + (dialogRect.height + this._dialogOffset)
    const canFitLeft = activeElementRect.left - (dialogRect.width + this._dialogOffset) >= 0
    const canFitRight =
      window.innerWidth > activeElementRect.right + (dialogRect.width + this._dialogOffset)

    switch (position) {
      case Position.TOP:
        return canFitAbove
      case Position.BOTTOM:
        return canFitBellow
      case Position.LEFT:
        return canFitLeft
      case Position.RIGHT:
        return canFitRight
      default:
        return false
    }
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
   * Set header text
   */
  private setDialogHeaderText = () => {
    if (this._dialogHeaderText && this._activeStep) {
      this._dialogHeaderText.innerHTML = this._activeStep.header ?? this._header
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
    if (this.getPreviousStep()) {
      this.enablePreviousStep()
    } else {
      this.disablePreviousStep()
    }

    if (this.getNextStep()) {
      this._dialogNextButton!.style.removeProperty('display')
      this._dialogEndButton!.style.display = 'none'
    } else {
      this._dialogNextButton!.style.display = 'none'
      this._dialogEndButton!.style.removeProperty('display')
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

  private destroy = (): void => {
    this.resetActiveStep()
    this._activeStep = null
    this._dialogPreviousButton?.removeEventListener('click', this.previous)
    this._dialogNextButton?.removeEventListener('click', this.next)
    this._dialogCloseButton?.removeEventListener('click', this.close)
    this._dialogEndButton?.removeEventListener('click', this.end)
    document.removeEventListener('scroll', this.renderActiveStep)
    window.removeEventListener('resize', this.renderActiveStep)
    if (this._isKeyboardNavigationEnabled) {
      window.removeEventListener('keydown', this.handleKeyboardNavigation)
    }
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
    this._dialogNextButton!.disabled = true
    return this
  }

  /**
   * Enable next step
   */
  public enableNextStep = (): Lektor => {
    this._isNextStepEnabled = true
    this._dialogNextButton!.disabled = false
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
    const layout = document.createElement('div')
    layout.classList.add(this.buildClassName('layout'))
    return layout
  }

  /**
   * Create tutorial layout element
   */
  private createCurtain = (): HTMLElement => {
    const curtain = document.createElement('div')
    curtain.style.display = 'block'
    curtain.style.position = 'fixed'
    curtain.style.top = '0'
    curtain.style.bottom = '0'
    curtain.style.left = '0'
    curtain.style.right = '0'
    curtain.style.zIndex = String(Number(this._zIndex) + 1)
    curtain.classList.add(this.buildClassName('curtain'))
    return curtain
  }

  /**
   * Create tutorial dialog
   */
  private createDialog = (): HTMLElement => {
    const dialog = document.createElement('dialog')
    dialog.style.display = 'flex'
    dialog.style.position = 'absolute'
    dialog.style.top = '0'
    dialog.style.left = '0'
    dialog.style.zIndex = String(Number(this._zIndex) + 3)
    dialog.classList.add(this.buildClassName('dialog'))
    return dialog
  }

  /**
   * Create tutorial dialog header
   */
  private createDialogHeader = (): HTMLElement => {
    const header = document.createElement('header')
    header.classList.add(this.buildClassName('header'))
    return header
  }

  /**
   * Create tutorial dialog header text
   */
  private createDialogHeaderText = (): HTMLElement => {
    const headerText = document.createElement('h1')
    headerText.classList.add(this.buildClassName('text'))
    return headerText
  }

  /**
   * Create tutorial dialog clsoe button
   */
  private createDialogCloseButton(): HTMLButtonElement {
    const closeButton = document.createElement('button')
    closeButton.classList.add(this.buildClassName('close-button'))
    closeButton.innerText = '✕'
    closeButton.addEventListener('click', this.close)
    return closeButton
  }

  /**
   * Create tutorial dialog body
   */
  private createDialogBody = (): HTMLElement => {
    const body = document.createElement('main')
    body.classList.add(this.buildClassName('body'))
    return body
  }

  /**
   * Create tutorial dialog footer
   */
  private createDialogFooter = (): HTMLElement => {
    const body = document.createElement('footer')
    body.classList.add(this.buildClassName('footer'))
    return body
  }

  /**
   * Create dialog previous button
   */
  private createDialogPreviousButton = (): HTMLButtonElement => {
    const previousButton = document.createElement('button')
    previousButton.innerText = this._previousButtonText
    previousButton.classList.add(this.buildClassName('previous-button'))
    previousButton.addEventListener('click', this.previous)
    return previousButton
  }

  /**
   * Create tutorial next button
   */
  private createDialogNextButton = (): HTMLButtonElement => {
    const nextButton = document.createElement('button')
    nextButton.innerText = this._nextButtonText
    nextButton.classList.add(this.buildClassName('next-button'))
    nextButton.addEventListener('click', this.next)
    return nextButton
  }

  /**
   * Create tutorial end button
   */
  private createDialogEndButton = (): HTMLButtonElement => {
    const endButton = document.createElement('button')
    endButton.innerText = this._endButtonText
    endButton.classList.add(this.buildClassName('end-button'))
    endButton.addEventListener('click', this.end)
    return endButton
  }
}
