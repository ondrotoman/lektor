import { Position } from './enums/Position.js';
export default class Lektor {
    _zIndex = 99990;
    _steps = [];
    _classPrefix;
    _header;
    _previousButtonText;
    _isPreviousStepEnabled = true;
    _nextButtonText;
    _isNextStepEnabled = true;
    _endButtonText;
    _dialogOffset = 10;
    _isKeyboardNavigationEnabled = true;
    _onStart;
    _onEnd;
    _onStepChange;
    _onClose;
    _activeStep = null;
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
        params?.steps?.forEach((step) => this.addStep(step));
        this._header = params?.header ?? '';
        this._previousButtonText = params?.previousButtonText ?? 'Previous';
        this._nextButtonText = params?.nextButtonText ?? 'Next';
        this._endButtonText = params?.endButtonText ?? 'Done!';
        this._dialogOffset = params?.dialogOffset ?? 10;
        this._isKeyboardNavigationEnabled = params?.enableKeyboardNavigation ?? true;
        this._classPrefix =
            params?.classPrefix === undefined || params?.classPrefix === ''
                ? 'lektor'
                : params?.classPrefix;
        this._onStart = params?.onStart ?? null;
        this._onEnd = params?.onEnd ?? null;
        this._onStepChange = params?.onStepChange ?? null;
        this._onClose = params?.onClose ?? null;
    }
    addStep = (step) => {
        step.setListener(this);
        this._steps.push(step);
        return this;
    };
    addStepAfter = (step) => {
        const index = this._steps.indexOf(step);
        if (index !== -1) {
            this._steps.splice(index + 1, 0, step);
        }
        step.setListener(this);
        return this;
    };
    addStepBefore = (step) => {
        step.setListener(this);
        this._steps.push(step);
        return this;
    };
    removeStep = (step) => {
        const index = this._steps.indexOf(step);
        if (index !== -1) {
            this._steps.splice(index, 1);
        }
        return this;
    };
    notify(payload) {
        if (payload === this._activeStep) {
            this.resetActiveStep();
            this.renderActiveStep();
        }
    }
    isActive = () => {
        return this._activeStep !== null;
    };
    start = () => {
        if (this.isActive()) {
            return;
        }
        this.buildUI();
        this.enablePreviousStep();
        this.enableNextStep();
        this.next();
        this._onStart?.();
    };
    buildUI = () => {
        this._dialogHeaderText = this.createDialogHeaderText();
        this._dialogCloseButton = this.createDialogCloseButton();
        this._dialogHeader = this.createDialogHeader();
        this._dialogHeader.appendChild(this._dialogHeaderText);
        this._dialogHeader.appendChild(this._dialogCloseButton);
        this._dialogPreviousButton = this.createDialogPreviousButton();
        this._dialogNextButton = this.createDialogNextButton();
        this._dialogEndButton = this.createDialogEndButton();
        this._dialogFooter = this.createDialogFooter();
        this._dialogFooter.appendChild(this._dialogPreviousButton);
        this._dialogFooter.appendChild(this._dialogNextButton);
        this._dialogFooter.appendChild(this._dialogEndButton);
        this._dialogBody = this.createDialogBody();
        this._dialog = this.createDialog();
        this._dialog.appendChild(this._dialogHeader);
        this._dialog.appendChild(this._dialogBody);
        this._dialog.appendChild(this._dialogFooter);
        this._curtain = this.createCurtain();
        this._layout = this.createLayout();
        this._layout.appendChild(this._curtain);
        this._layout.appendChild(this._dialog);
        document.body.appendChild(this._layout);
        document.addEventListener('scroll', this.moveDialog);
        window.addEventListener('resize', this.moveDialog);
        if (this._isKeyboardNavigationEnabled) {
            window.addEventListener('keydown', this.handleKeyboardNavigation);
        }
    };
    handleKeyboardNavigation = (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                this.previous();
                break;
            case 'ArrowRight':
                this.next();
                break;
            case 'Enter':
                this.next();
                break;
            case 'Escape':
                this.end();
                break;
            default:
                return;
        }
        event.preventDefault();
    };
    getHookCallbacks = () => {
        return {
            previous: this.previous,
            next: this.next,
            disablePrevious: this.disablePreviousStep,
            enablePrevious: this.enablePreviousStep,
            disableNext: this.disableNextStep,
            enableNext: this.enableNextStep,
            addStep: this.addStep,
            removeStep: this.removeStep,
        };
    };
    setActiveStep = (step) => {
        this.resetActiveStep();
        this._activeStep = step;
        this.renderActiveStep();
        this._activeStep.onMounted?.(step.element, this.getHookCallbacks());
        this._onStepChange?.();
    };
    renderActiveStep = () => {
        if (!this._activeStep) {
            return;
        }
        this._dialog?.classList.remove(this.buildClassName('dialog'));
        if (this._activeStep.element) {
            this._originalElementStyling = this._activeStep.element.style.cssText;
            if (['', 'static'].includes(this._activeStep.element.style.position)) {
                this._activeStep.element.style.position = 'relative';
            }
            this._activeStep.element.style.zIndex = String(Number(this._zIndex) + 2);
            this._activeStep.element.classList.add(this.buildClassName('active-element'));
        }
        if (this._activeStep?.element && !this.isElementFullyVisible(this._activeStep.element)) {
            this._activeStep.element?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
            });
        }
        this.setDialogHeaderText();
        this.setDialogBody();
        this.setDialogButtons();
        this._dialog?.classList.add(this.buildClassName('dialog'));
        this.moveDialog();
    };
    resetActiveStep = () => {
        if (this._activeStep?.element) {
            this._activeStep.element.style.cssText = this._originalElementStyling || '';
            this._activeStep.element.classList.remove(this.buildClassName('active-element'));
        }
        this._activeStep?.onUnmounted?.(this._activeStep.element, this.getHookCallbacks());
    };
    moveDialog = () => {
        if (!this._dialog || !this._activeStep) {
            return;
        }
        let top = 0;
        let left = 0;
        const activeElementRect = this._activeStep.element?.getBoundingClientRect();
        const dialogRect = this._dialog.getBoundingClientRect();
        if (!activeElementRect) {
            console.log('bez elementu ' +
                window.innerHeight +
                ' / ' +
                dialogRect.height +
                ' ' +
                window.innerWidth +
                ' / ' +
                dialogRect.width);
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
    isElementFullyVisible(element) {
        const rect = element.getBoundingClientRect();
        return (rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth));
    }
    setDialogHeaderText = () => {
        if (this._dialogHeaderText && this._activeStep) {
            this._dialogHeaderText.innerHTML = this._activeStep.header ?? this._header;
        }
    };
    setDialogBody = () => {
        if (this._dialogBody && this._activeStep) {
            this._dialogBody.innerHTML = this._activeStep.body ?? '';
        }
    };
    setDialogButtons = () => {
        if (this.getPreviousStep()) {
            this.enablePreviousStep();
        }
        else {
            this.disablePreviousStep();
        }
        if (this.getNextStep()) {
            this._dialogNextButton.style.removeProperty('display');
            this._dialogEndButton.style.display = 'none';
        }
        else {
            this._dialogNextButton.style.display = 'none';
            this._dialogEndButton.style.removeProperty('display');
        }
    };
    end = () => {
        this.destroy();
        this._onEnd?.();
    };
    close = () => {
        this.destroy();
        this._onClose?.();
    };
    destroy = () => {
        this.resetActiveStep();
        this._activeStep = null;
        this._dialogPreviousButton?.removeEventListener('click', this.previous);
        this._dialogNextButton?.removeEventListener('click', this.next);
        this._dialogCloseButton?.removeEventListener('click', this.close);
        this._dialogEndButton?.removeEventListener('click', this.end);
        document.removeEventListener('scroll', this.renderActiveStep);
        window.removeEventListener('resize', this.renderActiveStep);
        if (this._isKeyboardNavigationEnabled) {
            window.removeEventListener('keydown', this.handleKeyboardNavigation);
        }
        this._layout?.remove();
        this._layout = null;
    };
    previous = () => {
        if (this._isPreviousStepEnabled) {
            const previousStep = this.getPreviousStep();
            if (previousStep) {
                this.setActiveStep(previousStep);
            }
        }
        return this;
    };
    getPreviousStep = () => {
        if (this._steps.length === 0) {
            return null;
        }
        let previousStep = null;
        if (!this._activeStep) {
            previousStep = this._steps[0];
        }
        else {
            const index = this._steps.indexOf(this._activeStep);
            if (index !== -1 && this._steps[index - 1]) {
                previousStep = this._steps[index - 1];
            }
        }
        return previousStep;
    };
    disablePreviousStep = () => {
        this._isPreviousStepEnabled = false;
        if (this._dialogPreviousButton) {
            this._dialogPreviousButton.disabled = true;
        }
        return this;
    };
    enablePreviousStep = () => {
        this._isPreviousStepEnabled = true;
        if (this._dialogPreviousButton) {
            this._dialogPreviousButton.disabled = false;
        }
        return this;
    };
    next = () => {
        if (this._isNextStepEnabled) {
            const nextStep = this.getNextStep();
            if (nextStep) {
                this.setActiveStep(nextStep);
            }
            else {
                this.end();
            }
        }
        return this;
    };
    getNextStep = () => {
        if (this._steps.length === 0) {
            return null;
        }
        let nextStep = null;
        if (!this._activeStep) {
            nextStep = this._steps[0];
        }
        else {
            const index = this._steps.indexOf(this._activeStep);
            if (index !== -1 && this._steps[index + 1]) {
                nextStep = this._steps[index + 1];
            }
        }
        return nextStep;
    };
    disableNextStep = () => {
        this._isNextStepEnabled = false;
        this._dialogNextButton.disabled = true;
        return this;
    };
    enableNextStep = () => {
        this._isNextStepEnabled = true;
        this._dialogNextButton.disabled = false;
        return this;
    };
    buildClassName = (name) => {
        return [this._classPrefix, name].join('-');
    };
    createLayout = () => {
        const layout = document.createElement('div');
        layout.classList.add(this.buildClassName('layout'));
        return layout;
    };
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
    createDialog = () => {
        const dialog = document.createElement('dialog');
        dialog.style.display = 'flex';
        dialog.style.position = 'absolute';
        dialog.style.top = '0';
        dialog.style.left = '0';
        dialog.style.zIndex = String(Number(this._zIndex) + 3);
        dialog.classList.add(this.buildClassName('dialog'));
        return dialog;
    };
    createDialogHeader = () => {
        const header = document.createElement('header');
        header.classList.add(this.buildClassName('header'));
        return header;
    };
    createDialogHeaderText = () => {
        const headerText = document.createElement('h1');
        headerText.classList.add(this.buildClassName('text'));
        return headerText;
    };
    createDialogCloseButton() {
        const closeButton = document.createElement('button');
        closeButton.classList.add(this.buildClassName('close-button'));
        closeButton.innerText = '✕';
        closeButton.addEventListener('click', this.close);
        return closeButton;
    }
    createDialogBody = () => {
        const body = document.createElement('main');
        body.classList.add(this.buildClassName('body'));
        return body;
    };
    createDialogFooter = () => {
        const body = document.createElement('footer');
        body.classList.add(this.buildClassName('footer'));
        return body;
    };
    createDialogPreviousButton = () => {
        const previousButton = document.createElement('button');
        previousButton.innerText = this._previousButtonText;
        previousButton.classList.add(this.buildClassName('previous-button'));
        previousButton.addEventListener('click', this.previous);
        return previousButton;
    };
    createDialogNextButton = () => {
        const nextButton = document.createElement('button');
        nextButton.innerText = this._nextButtonText;
        nextButton.classList.add(this.buildClassName('next-button'));
        nextButton.addEventListener('click', this.next);
        return nextButton;
    };
    createDialogEndButton = () => {
        const endButton = document.createElement('button');
        endButton.innerText = this._endButtonText;
        endButton.classList.add(this.buildClassName('end-button'));
        endButton.addEventListener('click', this.end);
        return endButton;
    };
}
