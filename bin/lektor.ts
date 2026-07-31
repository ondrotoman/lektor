import NoStepsException from './exceptions/NoStepsException'
import type { LektorParams } from './interfaces/LektorParams'
import type Listener from './interfaces/Listener'
import Step from './step'
import type { Callable } from './types/Callable'
import { Position } from './enums/Position'

export default class Lektor implements Listener<Step> {
  /**
   * Tutorial steps
   */
  private _steps: Step[] = []

  /**
   * Elements class prefix
   */
  private _classPrefix: string

  /**
   * Starting Z-index
   */
  private _zIndex: number

  /**
   * Header text
   */
  private _headerText: string

  /**
   * Previous button text
   */
  private _previousButtonText: string

  /**
   * Next button text
   */
  private _nextButtonText: string

  /**
   * End button text
   */
  private _endButtonText: string

  /**
   * Dialog offset in pixels
   */
  private _dialogOffset: number = 10

  /**
   * Callback after start of tutorial
   */
  private _onStart: Callable | null

  /**
   * Callback after end of tutorial
   */
  private _onEnd: Callable | null

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

  constructor(params: LektorParams) {
    params.steps.forEach((step) => {
      step.setListener(this)
      this._steps.push(step)
    })

    this._headerText = params.headerText ?? 'Step: '
    this._previousButtonText = params.previousButtonText ?? 'Previous'
    this._nextButtonText = params.nextButtonText ?? 'Next'
    this._endButtonText = params.endButtonText ?? 'Done!'
    this._dialogOffset = params.dialogOffset ?? 10

    this._classPrefix =
      params.classPrefix === undefined || params.classPrefix === '' ? 'lektor' : params.classPrefix
    this._zIndex = params.startingZIndex ?? 9990
    this._onStart = params.onStart ?? null
    this._onEnd = params.onEnd ?? null
    this._onClose = params.onClose ?? null
  }

  /**
   *
   * @param payload
   */
  notify(payload: Step) {
    if (payload === this._activeStep) {
      this.resetActiveStep()
      this.renderActiveStep()
    }
  }

  /**
   * Check if the tutorial is running
   */
  isActive = (): boolean => {
    return this._activeStep !== null
  }

  /**
   * Start the tutorial and mount all lektor elements to DOM
   */
  public start = (): void => {
    if (!this._steps[0]) {
      throw new NoStepsException()
    }

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

    document.body.appendChild(this._layout)

    this.setActiveStep(this._steps[0])

    document.addEventListener('scroll', this.moveDialog)
    window.addEventListener('resize', this.moveDialog)
    this._onStart?.()
  }

  /**
   * Get callbacks for hooks
   */
  private getHookCallbacks = () => {
    return {
      previousStep: this.previousStep,
      nextStep: this.nextStep,
      disablePreviousButton: this.disablePreviousButton,
      enablePreviousButton: this.enablePreviousButton,
      disableNextButton: this.disableNextButton,
      enableNextButton: this.enableNextButton,
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
  }

  /**
   * Render active step and dialog
   */
  private renderActiveStep = (): void => {
    if (this._activeStep?.element) {
      this._originalElementStyling = this._activeStep.element.style.cssText

      if (['', 'static'].includes(this._activeStep.element.style.position)) {
        this._activeStep.element.style.position = 'relative'
      }
      this._activeStep.element.style.zIndex = String(Number(this._zIndex) + 2)
      this._activeStep.element.classList.add(this.buildClassName('active-element'))
    }

    if (this._activeStep?.element && !this.isElementFullyVisible(this._activeStep.element)) {
      this._activeStep.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })
    }

    this.setDialogHeaderText()
    this.setDialogBody()
    this.setDialogButtons()
    this.moveDialog()
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
    if (!this._dialogHeaderText || !this._activeStep) {
      return
    }

    const index = this._steps.indexOf(this._activeStep)
    if (index == -1) {
      return
    }

    this._dialogHeaderText.innerText = `${this._headerText} ${index + 1} / ${this._steps.length}`
  }

  private setDialogBody = () => {
    this._dialogBody!.innerHTML = this._activeStep?.body ?? ''
  }

  /**
   * Set text for dialog buttons
   */
  private setDialogButtons = () => {
    if (this.getPreviousStep() === null) {
      this.disablePreviousButton()
    } else {
      this.enablePreviousButton()
    }

    if (this.getNextStep() === null) {
      this._dialogNextButton!.style.display = 'none'
      this._dialogEndButton!.style.removeProperty('display')
    } else {
      this._dialogNextButton!.style.removeProperty('display')
      this._dialogEndButton!.style.display = 'none'
    }
  }

  /**
   * End tutorial
   */
  end = () => {
    this.destroy()
    this._onEnd?.()
  }

  /**
   * Close tutorial
   */
  close = (): void => {
    this.destroy()
    this._onClose?.()
  }

  private destroy = (): void => {
    this.resetActiveStep()
    this._activeStep = null
    this._dialogPreviousButton?.removeEventListener('click', this.previousStep)
    this._dialogNextButton?.removeEventListener('click', this.nextStep)
    this._dialogCloseButton?.removeEventListener('click', this.close)
    this._dialogEndButton?.removeEventListener('click', this.end)
    document.removeEventListener('scroll', this.renderActiveStep)
    window.removeEventListener('resize', this.renderActiveStep)
    this._layout?.remove()
    this._layout = null
  }

  /**
   * Go to previous step
   */
  previousStep = () => {
    const previousStep = this.getPreviousStep()
    if (previousStep === null) {
      return
    }

    this.setActiveStep(previousStep)
  }

  /**
   * Get previous step if there is any
   */
  private getPreviousStep = (): Step | null => {
    if (!this._activeStep) {
      return null
    }

    const index = this._steps.indexOf(this._activeStep)
    if (index === -1) {
      return null
    }

    const previousStep = this._steps[index - 1]
    return previousStep === undefined ? null : previousStep
  }

  /**
   * Go to next step
   */
  nextStep = () => {
    const nextStep = this.getNextStep()
    if (nextStep === null) {
      return
    }

    this.setActiveStep(nextStep)
  }

  /**
   * Get next step if there is any
   */
  private getNextStep = (): Step | null => {
    if (!this._activeStep) {
      return null
    }

    const index = this._steps.indexOf(this._activeStep)
    if (index === -1) {
      return null
    }

    const nextStep = this._steps[index + 1]
    return nextStep === undefined ? null : nextStep
  }

  /**
   * Reset steps styling to it's original state
   */
  private resetActiveStep = (): void => {
    if (!this._activeStep) {
      return
    }

    if (this._activeStep.element) {
      this._activeStep.element.style.cssText = this._originalElementStyling || ''
      this._activeStep.element.classList.remove(this.buildClassName('active-element'))
    }

    this._activeStep.onUnmounted?.(this._activeStep.element, this.getHookCallbacks())
  }

  /**
   * Disable next button
   */
  disableNextButton = () => {
    this._dialogNextButton!.disabled = true
  }

  /**
   * Enable next button
   */
  enableNextButton = () => {
    this._dialogNextButton!.disabled = false
  }

  /**
   * Disable previous button
   */
  disablePreviousButton = () => {
    this._dialogPreviousButton!.disabled = true
  }

  /**
   * Enable previous button
   */
  enablePreviousButton = () => {
    this._dialogPreviousButton!.disabled = false
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
    const dialog = document.createElement('div')
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
    previousButton.addEventListener('click', this.previousStep)
    return previousButton
  }

  /**
   * Create tutorial next button
   */
  private createDialogNextButton = (): HTMLButtonElement => {
    const nextButton = document.createElement('button')
    nextButton.innerText = this._nextButtonText
    nextButton.classList.add(this.buildClassName('next-button'))
    nextButton.addEventListener('click', this.nextStep)
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
