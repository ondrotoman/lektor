export interface LektorCallbacks {
    previousStep: () => void;
    nextStep: () => void;
    disablePreviousButton: () => void;
    enablePreviousButton: () => void;
    disableNextButton: () => void;
    enableNextButton: () => void;
}
