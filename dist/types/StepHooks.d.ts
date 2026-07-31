import type { LektorCallbacks } from '../interfaces/LektorCallbacks.ts';
export type StepMountHook = <T extends HTMLElement>(element: T | null, callbacks: LektorCallbacks) => void;
export type StepUnmountHook = <T extends HTMLElement>(element: T | null, callbacks: LektorCallbacks) => void;
