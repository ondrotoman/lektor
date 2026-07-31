import NoStepsException from './exceptions/NoStepsException.js';
import { Position } from './enums/Position.js';
export default class Lektor {
    /**
     * Tutorial steps
     */
    _steps = [];
    /**
     * Elements class prefix
     */
    _classPrefix;
    /**
     * Starting Z-index
     */
    _zIndex;
    /**
     * Header text
     */
    _headerText;
    /**
     * Previous button text
     */
    _previousButtonText;
    /**
     * Next button text
     */
    _nextButtonText;
    /**
     * End button text
     */
    _endButtonText;
    /**
     * Dialog offset in pixels
     */
    _dialogOffset = 10;
    /**
     * Callback after start of tutorial
     */
    _onStart;
    /**
     * Callback after end of tutorial
     */
    _onEnd;
    /**
     * Callback after closing the tutorial
     */
    _onClose;
    /**
     * Track active step
     */
    _activeStep = null;
    /**
     * Remember active step element styling
     */
    _originalElementStyling = '';
    _layout = null;
    _curtain = null;
    _dialog = null;
    _dialogHeader = null;
    _dialogHeaderText = null;
    _dialogBody = null;
    _dialogFooter = null;
    _dialogCloseButton = null;
    _dialogPreviousButton = null;
    _dialogNextButton = null;
    _dialogEndButton = null;
    constructor(params) {
        params.steps.forEach((step) => {
            step.setListener(this);
            this._steps.push(step);
        });
        this._headerText = params.headerText ?? 'Step: ';
        this._previousButtonText = params.previousButtonText ?? 'Previous';
        this._nextButtonText = params.nextButtonText ?? 'Next';
        this._endButtonText = params.endButtonText ?? 'Done!';
        this._dialogOffset = params.dialogOffset ?? 10;
        this._classPrefix =
            params.classPrefix === undefined || params.classPrefix === '' ? 'lektor' : params.classPrefix;
        this._zIndex = params.startingZIndex ?? 9990;
        this._onStart = params.onStart ?? null;
        this._onEnd = params.onEnd ?? null;
        this._onClose = params.onClose ?? null;
    }
    /**
     *
     * @param payload
     */
    notify(payload) {
        if (payload === this._activeStep) {
            this.resetActiveStep();
            this.renderActiveStep();
        }
    }
    /**
     * Check if the tutorial is running
     */
    isActive = () => {
        return this._activeStep !== null;
    };
    /**
     * Start the tutorial and mount all lektor elements to DOM
     */
    start = () => {
        if (!this._steps[0]) {
            throw new NoStepsException();
        }
        // Create dialog header
        this._dialogHeaderText = this.createDialogHeaderText();
        this._dialogCloseButton = this.createDialogCloseButton();
        this._dialogHeader = this.createDialogHeader();
        this._dialogHeader.appendChild(this._dialogHeaderText);
        this._dialogHeader.appendChild(this._dialogCloseButton);
        // Create dialog footer
        this._dialogPreviousButton = this.createDialogPreviousButton();
        this._dialogNextButton = this.createDialogNextButton();
        this._dialogEndButton = this.createDialogEndButton();
        this._dialogFooter = this.createDialogFooter();
        this._dialogFooter.appendChild(this._dialogPreviousButton);
        this._dialogFooter.appendChild(this._dialogNextButton);
        this._dialogFooter.appendChild(this._dialogEndButton);
        // Create dialog body
        this._dialogBody = this.createDialogBody();
        // Create dialog
        this._dialog = this.createDialog();
        this._dialog.appendChild(this._dialogHeader);
        this._dialog.appendChild(this._dialogBody);
        this._dialog.appendChild(this._dialogFooter);
        // Create curtian
        this._curtain = this.createCurtain();
        // Create layout
        this._layout = this.createLayout();
        this._layout.appendChild(this._curtain);
        this._layout.appendChild(this._dialog);
        document.body.appendChild(this._layout);
        this.setActiveStep(this._steps[0]);
        document.addEventListener('scroll', this.moveDialog);
        window.addEventListener('resize', this.moveDialog);
        this._onStart?.();
    };
    /**
     * Get callbacks for hooks
     */
    getHookCallbacks = () => {
        return {
            previousStep: this.previousStep,
            nextStep: this.nextStep,
            disablePreviousButton: this.disablePreviousButton,
            enablePreviousButton: this.enablePreviousButton,
            disableNextButton: this.disableNextButton,
            enableNextButton: this.enableNextButton,
        };
    };
    /**
     * Activate step
     */
    setActiveStep = (step) => {
        this.resetActiveStep();
        this._activeStep = step;
        this.renderActiveStep();
        this._activeStep.onMounted?.(step.element, this.getHookCallbacks());
    };
    /**
     * Render active step and dialog
     */
    renderActiveStep = () => {
        if (this._activeStep?.element) {
            this._originalElementStyling = this._activeStep.element.style.cssText;
            if (['', 'static'].includes(this._activeStep.element.style.position)) {
                this._activeStep.element.style.position = 'relative';
            }
            this._activeStep.element.style.zIndex = String(Number(this._zIndex) + 2);
            this._activeStep.element.classList.add(this.buildClassName('active-element'));
        }
        if (this._activeStep?.element && !this.isElementFullyVisible(this._activeStep.element)) {
            this._activeStep.element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
        }
        this.setDialogHeaderText();
        this.setDialogBody();
        this.setDialogButtons();
        this.moveDialog();
    };
    /**
     * Move dialog to active step
     */
    moveDialog = () => {
        if (!this._dialog || !this._activeStep) {
            return;
        }
        let top = 0;
        let left = 0;
        const activeElementRect = this._activeStep.element?.getBoundingClientRect();
        const dialogRect = this._dialog.getBoundingClientRect();
        if (!activeElementRect) {
            top = Math.round(window.innerHeight / 2 - dialogRect.height / 2);
            left = Math.round(window.innerWidth / 2 - dialogRect.width / 2);
        }
        else {
            let position = this._activeStep.dialogPosition;
            if (!this.canDialogFit(this._activeStep.dialogPosition)) {
                position =
                    Object.values(Position).find((p) => this.canDialogFit(p)) ??
                        this._activeStep.dialogPosition;
            }
            const relativeTop = activeElementRect.top + window.scrollY;
            const relativeLeft = activeElementRect.left + window.scrollX;
            if (position == Position.TOP) {
                top = relativeTop - (dialogRect.height + this._dialogOffset);
                left = relativeLeft;
            }
            else if (position == Position.BOTTOM) {
                top = relativeTop + activeElementRect.height + this._dialogOffset;
                left = relativeLeft;
            }
            else if (position == Position.LEFT) {
                left = relativeLeft - dialogRect.width - this._dialogOffset;
                top = relativeTop;
            }
            else if (position == Position.RIGHT) {
                top = relativeTop;
                left = relativeLeft + activeElementRect.width + this._dialogOffset;
            }
        }
        this._dialog.style.top = top + 'px';
        this._dialog.style.left = left + 'px';
    };
    /**
     * Check if dialog fits around the element
     */
    canDialogFit = (position) => {
        if (!this._dialog || !this._activeStep?.element) {
            return false;
        }
        const activeElementRect = this._activeStep.element.getBoundingClientRect();
        const dialogRect = this._dialog.getBoundingClientRect();
        const canFitAbove = activeElementRect.top - (dialogRect.height + this._dialogOffset) >= 0;
        const canFitBellow = window.innerHeight > activeElementRect.bottom + (dialogRect.height + this._dialogOffset);
        const canFitLeft = activeElementRect.left - (dialogRect.width + this._dialogOffset) >= 0;
        const canFitRight = window.innerWidth > activeElementRect.right + (dialogRect.width + this._dialogOffset);
        switch (position) {
            case Position.TOP:
                return canFitAbove;
            case Position.BOTTOM:
                return canFitBellow;
            case Position.LEFT:
                return canFitLeft;
            case Position.RIGHT:
                return canFitRight;
            default:
                return false;
        }
    };
    /**
     * Check if element is fully visible
     */
    isElementFullyVisible(element) {
        const rect = element.getBoundingClientRect();
        return (rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth));
    }
    /**
     * Set header text
     */
    setDialogHeaderText = () => {
        if (!this._dialogHeaderText || !this._activeStep) {
            return;
        }
        const index = this._steps.indexOf(this._activeStep);
        if (index == -1) {
            return;
        }
        this._dialogHeaderText.innerText = `${this._headerText} ${index + 1} / ${this._steps.length}`;
    };
    setDialogBody = () => {
        this._dialogBody.innerHTML = this._activeStep?.body ?? '';
    };
    /**
     * Set text for dialog buttons
     */
    setDialogButtons = () => {
        if (this.getPreviousStep() === null) {
            this.disablePreviousButton();
        }
        else {
            this.enablePreviousButton();
        }
        if (this.getNextStep() === null) {
            this._dialogNextButton.style.display = 'none';
            this._dialogEndButton.style.removeProperty('display');
        }
        else {
            this._dialogNextButton.style.removeProperty('display');
            this._dialogEndButton.style.display = 'none';
        }
    };
    /**
     * End tutorial
     */
    end = () => {
        this.destroy();
        this._onEnd?.();
    };
    /**
     * Close tutorial
     */
    close = () => {
        this.destroy();
        this._onClose?.();
    };
    destroy = () => {
        this.resetActiveStep();
        this._activeStep = null;
        this._dialogPreviousButton?.removeEventListener('click', this.previousStep);
        this._dialogNextButton?.removeEventListener('click', this.nextStep);
        this._dialogCloseButton?.removeEventListener('click', this.close);
        this._dialogEndButton?.removeEventListener('click', this.end);
        document.removeEventListener('scroll', this.renderActiveStep);
        window.removeEventListener('resize', this.renderActiveStep);
        this._layout?.remove();
        this._layout = null;
    };
    /**
     * Go to previous step
     */
    previousStep = () => {
        const previousStep = this.getPreviousStep();
        if (previousStep === null) {
            return;
        }
        this.setActiveStep(previousStep);
    };
    /**
     * Get previous step if there is any
     */
    getPreviousStep = () => {
        if (!this._activeStep) {
            return null;
        }
        const index = this._steps.indexOf(this._activeStep);
        if (index === -1) {
            return null;
        }
        const previousStep = this._steps[index - 1];
        return previousStep === undefined ? null : previousStep;
    };
    /**
     * Go to next step
     */
    nextStep = () => {
        const nextStep = this.getNextStep();
        if (nextStep === null) {
            return;
        }
        this.setActiveStep(nextStep);
    };
    /**
     * Get next step if there is any
     */
    getNextStep = () => {
        if (!this._activeStep) {
            return null;
        }
        const index = this._steps.indexOf(this._activeStep);
        if (index === -1) {
            return null;
        }
        const nextStep = this._steps[index + 1];
        return nextStep === undefined ? null : nextStep;
    };
    /**
     * Reset steps styling to it's original state
     */
    resetActiveStep = () => {
        if (!this._activeStep) {
            return;
        }
        if (this._activeStep.element) {
            this._activeStep.element.style.cssText = this._originalElementStyling || '';
            this._activeStep.element.classList.remove(this.buildClassName('active-element'));
        }
        this._activeStep.onUnmounted?.(this._activeStep.element, this.getHookCallbacks());
    };
    /**
     * Disable next button
     */
    disableNextButton = () => {
        this._dialogNextButton.disabled = true;
    };
    /**
     * Enable next button
     */
    enableNextButton = () => {
        this._dialogNextButton.disabled = false;
    };
    /**
     * Disable previous button
     */
    disablePreviousButton = () => {
        this._dialogPreviousButton.disabled = true;
    };
    /**
     * Enable previous button
     */
    enablePreviousButton = () => {
        this._dialogPreviousButton.disabled = false;
    };
    /**
     * Generate class name for element with given prefix
     */
    buildClassName = (name) => {
        return [this._classPrefix, name].join('-');
    };
    /**
     * Create tutorial layout element
     */
    createLayout = () => {
        const layout = document.createElement('div');
        layout.classList.add(this.buildClassName('layout'));
        return layout;
    };
    /**
     * Create tutorial layout element
     */
    createCurtain = () => {
        const curtain = document.createElement('div');
        curtain.style.display = 'block';
        curtain.style.position = 'fixed';
        curtain.style.top = '0';
        curtain.style.bottom = '0';
        curtain.style.left = '0';
        curtain.style.right = '0';
        curtain.style.zIndex = String(Number(this._zIndex) + 1);
        curtain.classList.add(this.buildClassName('curtain'));
        return curtain;
    };
    /**
     * Create tutorial dialog
     */
    createDialog = () => {
        const dialog = document.createElement('div');
        dialog.style.display = 'flex';
        dialog.style.position = 'absolute';
        dialog.style.top = '0';
        dialog.style.left = '0';
        dialog.style.zIndex = String(Number(this._zIndex) + 3);
        dialog.classList.add(this.buildClassName('dialog'));
        return dialog;
    };
    /**
     * Create tutorial dialog header
     */
    createDialogHeader = () => {
        const header = document.createElement('header');
        header.classList.add(this.buildClassName('header'));
        return header;
    };
    /**
     * Create tutorial dialog header text
     */
    createDialogHeaderText = () => {
        const headerText = document.createElement('h1');
        headerText.classList.add(this.buildClassName('text'));
        return headerText;
    };
    /**
     * Create tutorial dialog clsoe button
     */
    createDialogCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.classList.add(this.buildClassName('close-button'));
        closeButton.innerText = '✕';
        closeButton.addEventListener('click', this.close);
        return closeButton;
    }
    /**
     * Create tutorial dialog body
     */
    createDialogBody = () => {
        const body = document.createElement('main');
        body.classList.add(this.buildClassName('body'));
        return body;
    };
    /**
     * Create tutorial dialog footer
     */
    createDialogFooter = () => {
        const body = document.createElement('footer');
        body.classList.add(this.buildClassName('footer'));
        return body;
    };
    /**
     * Create dialog previous button
     */
    createDialogPreviousButton = () => {
        const previousButton = document.createElement('button');
        previousButton.innerText = this._previousButtonText;
        previousButton.classList.add(this.buildClassName('previous-button'));
        previousButton.addEventListener('click', this.previousStep);
        return previousButton;
    };
    /**
     * Create tutorial next button
     */
    createDialogNextButton = () => {
        const nextButton = document.createElement('button');
        nextButton.innerText = this._nextButtonText;
        nextButton.classList.add(this.buildClassName('next-button'));
        nextButton.addEventListener('click', this.nextStep);
        return nextButton;
    };
    /**
     * Create tutorial end button
     */
    createDialogEndButton = () => {
        const endButton = document.createElement('button');
        endButton.innerText = this._endButtonText;
        endButton.classList.add(this.buildClassName('end-button'));
        endButton.addEventListener('click', this.end);
        return endButton;
    };
}
