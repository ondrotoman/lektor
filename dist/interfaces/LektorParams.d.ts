import type { Position } from '../enums/Position.js';
import type { Step } from '../step.js';
import type { Callable } from '../types/Callable.js';
export interface LektorParams {
    steps: Step[];
    headerText?: string;
    previousButtonText?: string;
    nextButtonText?: string;
    endButtonText?: string;
    classPrefix?: string;
    startingZIndex?: number;
    dialogOffset?: number;
    dialogPositon?: Position;
    onStart?: Callable;
    onEnd?: Callable;
    onClose?: Callable;
}
