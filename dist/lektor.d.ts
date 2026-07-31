import type { LektorParams } from './interfaces/LektorParams.js';
import type Listener from './interfaces/Listener.js';
import type { Step } from './step.js';
export default class Lektor implements Listener<Step> {
    /**
     * Tutorial steps
     */
    private _steps;
    /**
     * Elements class prefix
     */
    private _classPrefix;
    /**
     * Starting Z-index
     */
    private _zIndex;
    /**
     * Header text
     */
    private _headerText;
    /**
     * Previous button text
     */
    private _previousButtonText;
    /**
     * Next button text
     */
    private _nextButtonText;
    /**
     * End button text
     */
    private _endButtonText;
    /**
     * Dialog offset in pixels
     */
    private _dialogOffset;
    /**
     * Callback after start of tutorial
     */
    private _onStart;
    /**
     * Callback after end of tutorial
     */
    private _onEnd;
    /**
     * Callback after closing the tutorial
     */
    private _onClose;
    /**
     * Track active step
     */
    private _activeStep;
    /**
     * Remember active step element styling
     */
    private _originalElementStyling;
    private _layout;
    private _curtain;
    private _dialog;
    private _dialogHeader;
    private _dialogHeaderText;
    private _dialogBody;
    private _dialogFooter;
    private _dialogCloseButton;
    private _dialogPreviousButton;
    private _dialogNextButton;
    private _dialogEndButton;
    constructor(params: LektorParams);
    /**
     *
     * @param payload
     */
    notify(payload: Step): void;
    /**
     * Check if the tutorial is running
     */
    isActive: () => boolean;
    /**
     * Start the tutorial and mount all lektor elements to DOM
     */
    start: () => void;
    /**
     * Get callbacks for hooks
     */
    private getHookCallbacks;
    /**
     * Activate step
     */
    private setActiveStep;
    /**
     * Render active step and dialog
     */
    private renderActiveStep;
    /**
     * Move dialog to active step
     */
    private moveDialog;
    /**
     * Check if dialog fits around the element
     */
    private canDialogFit;
    /**
     * Check if element is fully visible
     */
    private isElementFullyVisible;
    /**
     * Set header text
     */
    private setDialogHeaderText;
    private setDialogBody;
    /**
     * Set text for dialog buttons
     */
    private setDialogButtons;
    /**
     * End tutorial
     */
    end: () => void;
    /**
     * Close tutorial
     */
    close: () => void;
    private destroy;
    /**
     * Go to previous step
     */
    previousStep: () => void;
    /**
     * Get previous step if there is any
     */
    private getPreviousStep;
    /**
     * Go to next step
     */
    nextStep: () => void;
    /**
     * Get next step if there is any
     */
    private getNextStep;
    /**
     * Reset steps styling to it's original state
     */
    private resetActiveStep;
    /**
     * Disable next button
     */
    disableNextButton: () => void;
    /**
     * Enable next button
     */
    enableNextButton: () => void;
    /**
     * Disable previous button
     */
    disablePreviousButton: () => void;
    /**
     * Enable previous button
     */
    enablePreviousButton: () => void;
    /**
     * Generate class name for element with given prefix
     */
    private buildClassName;
    /**
     * Create tutorial layout element
     */
    private createLayout;
    /**
     * Create tutorial layout element
     */
    private createCurtain;
    /**
     * Create tutorial dialog
     */
    private createDialog;
    /**
     * Create tutorial dialog header
     */
    private createDialogHeader;
    /**
     * Create tutorial dialog header text
     */
    private createDialogHeaderText;
    /**
     * Create tutorial dialog clsoe button
     */
    private createDialogCloseButton;
    /**
     * Create tutorial dialog body
     */
    private createDialogBody;
    /**
     * Create tutorial dialog footer
     */
    private createDialogFooter;
    /**
     * Create dialog previous button
     */
    private createDialogPreviousButton;
    /**
     * Create tutorial next button
     */
    private createDialogNextButton;
    /**
     * Create tutorial end button
     */
    private createDialogEndButton;
}
