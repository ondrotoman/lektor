# @ondrotoman/lektor

> A lightweight, framework-agnostic, TypeScript-first library for building step-by-step tutorials, guided tours, and precisely positioned dialogs.

[![npm version](https://img.shields.io/npm/v/@ondrotoman/lektor.svg)](https://www.npmjs.com/package/@ondrotoman/lektor)
[![license](https://img.shields.io/npm/l/@ondrotoman/lektor.svg)](https://github.com/ondrotoman/lektor/blob/main/LICENSE)

## Overview

**Lektor** is a lightweight, framework-agnostic library for creating interactive step-by-step tutorials and guided experiences. It is written with TypeScript in mind and provides flexible dialog positioning, lifecycle hooks, and runtime step management.

Lektor is intentionally unopinionated about styling, allowing you to integrate it into an existing application's visual language.

## Installation

Install Lektor using your preferred package manager:

```bash
# npm
npm install @ondrotoman/lektor

# pnpm
pnpm add @ondrotoman/lektor

# yarn
yarn add @ondrotoman/lektor
```

# ⚠️ Security Notice

> **Be careful with `body` and `header` content.**

`Lektor` and `Step` body and headers can contain **HTML**, not just plain text.

If you use **user-provided or untrusted content**, unsanitized HTML can introduce **XSS vulnerabilities**.

### 🔒 Recommendation

**Never pass untrusted content directly into `body` and `header`.**

If HTML is required, make sure it is **properly sanitized** first.

```ts
new Lektor({
  header: safeContent,
})
```

```ts
new Step({
  header: safeContent,
  body: safeContent,
})
```

> **Treat dynamic HTML as untrusted by default.**

## Usage

Lektor supports both static step definitions and dynamically added steps.

### 1. Import Lektor

```ts
import Lektor, { Position, Step, type LektorCallbacks } from '@ondrotoman/lektor'
```

### 2. Create a tour with steps

You can define steps when creating a `Lektor` instance:

```ts
const siteTour = new Lektor({
  steps: [
    new Step({
      element: document.getElementById('form'),
      body: 'This can be simple text or rich HTML!',
    }),
  ],
})
```

### Add steps dynamically

Steps can also be added after the `Lektor` instance has been created, even while the tour is running:

```ts
siteTour.addStep(
  new Step({
    element: document.getElementById('form'),
    body: 'This can be simple text or rich HTML!',
  }),
)
```

To insert a step at a specific place, use `addStepAfter` or `addStepBefore` with a reference step. If the reference step is not part of the tour, the new step is added at the end:

```ts
siteTour.addStepAfter(newStep, existingStep)
siteTour.addStepBefore(newStep, existingStep)
```

### Remove steps

```ts
siteTour.removeStep(existingStep)
```

If the removed step is currently active, the tour moves to the next step (or the previous one when it was the last step). When no steps remain, the tour ends.

### Create a centered message

A step does not require an associated element. This is useful for displaying a message in the center of the screen:

```ts
siteTour.addStep(
  new Step({
    body: 'This will be shown in center of the screen!',
  }),
)
```

### Assign an element dynamically

You can create a step without an element and assign one later:

```ts
const newItemStep = new Step({
  body: 'This is your new item in the list!',
})

siteTour.addStep(newItemStep)

newItemStep.setElement(document.getElementById('item-' + id))
```

Changing a step's content (`setElement`, `setBody`, `setHeader`, ...) while it is active re-renders the dialog immediately.

### Dialog position

The dialog is placed below the highlighted element by default. You can change the default for the whole tour and override it per step:

```ts
const siteTour = new Lektor({
  dialogPosition: Position.RIGHT,
  steps: [
    new Step({
      element: document.getElementById('menu'),
      body: 'Shown above the menu',
      dialogPosition: Position.TOP,
    }),
  ],
})
```

The dialog always stays on the visible screen:

1. If it does not fit in the preferred position, Lektor tries the opposite side, then the remaining sides, starting with the one with more space.
2. When the element is close to a screen edge, the dialog is shifted along the element so it does not overflow (e.g. a bottom dialog next to the right edge moves left).
3. If it fits nowhere around the element, it is placed on the side with the most space and kept inside the screen, even if it partially covers the element.

The chosen side is exposed as `data-position` (`top`, `bottom`, `left` or `right`) on the dialog, which you can use for styling, e.g. an arrow:

```css
.lektor-dialog[data-position='bottom'] .lektor-arrow {
  /* arrow pointing up to the element */
}
```

### Start the tour

Once your steps have been configured, start the tour with `start()`:

```ts
siteTour.start()
```

Calling `start()` on a tour without steps, or on a tour that is already running, does nothing.

## Hooks

Lektor provides lifecycle hooks that allow you to control the tour based on application state.

For example, you can prevent the user from continuing until an input contains a value:

```ts
let keyupHandler: (() => void) | null = null

const validateInput = (value: string): boolean => {
  return value.length >= 1
}

new Step({
  element: document.getElementById('input'),
  body: 'Type whatever you want right here',

  onMounted: (step: Step | null, callbacks: LektorCallbacks) => {
    const input = step?.element as HTMLInputElement

    if (!validateInput(input.value)) {
      callbacks.disableNext()
    }

    keyupHandler = () => {
      if (validateInput(input.value)) {
        callbacks.enableNext()
      } else {
        callbacks.disableNext()
      }
    }

    input.addEventListener('keyup', keyupHandler)
    input.focus()
  },

  onUnmounted: (step: Step | null) => {
    if (keyupHandler) {
      step?.element?.removeEventListener('keyup', keyupHandler)
      keyupHandler = null
    }
  },
})
```

When the step is mounted, the **Next** action remains disabled until the input contains at least one character. The event listener is removed when the step is unmounted.

Every step starts with **Previous** and **Next** enabled, so navigation disabled in one step's hook does not carry over to the following step.

`onMounted` runs each time the step becomes active. `onUnmounted` runs when the tour leaves the step, or when the tour ends or is closed. Updating the active step's content does not trigger either hook.

## Keyboard navigation

By default you can use `Arrow Left` to navigate to previous step, `Enter` and `Arrow Right` to go to next step and `Escape` for closing Lektor.
Key presses are ignored while the user is typing into an input, textarea, select or contenteditable element.
Keyboard navigation can be disabled with `enableKeyboardNavigation: false` in `LektorParams`.

# API

## Lektor

### Methods

```ts
interface Lektor {
  isActive: () => boolean
  start: () => void
  end: () => void
  close: () => void
  previous: () => Lektor
  next: () => Lektor
  disablePreviousStep: () => Lektor
  enablePreviousStep: () => Lektor
  disableNextStep: () => Lektor
  enableNextStep: () => Lektor
  addStep: (step: Step) => Lektor
  addStepAfter: (step: Step, after: Step) => Lektor
  addStepBefore: (step: Step, before: Step) => Lektor
  removeStep: (step: Step) => Lektor
}
```

`end()` finishes the tour and calls `onEnd`. `close()` dismisses it (close button or `Escape`) and calls `onClose`.

### Constructor parameters

```ts
interface LektorParams {
  steps?: Step[]
  header?: string
  previousButtonText?: string
  nextButtonText?: string
  endButtonText?: string
  classPrefix?: string
  dialogOffset?: number
  dialogPosition?: Position
  enableKeyboardNavigation?: boolean
  onStart?: () => void
  onEnd?: () => void
  onStepChange?: () => void
  onClose?: () => void
}
```

| Parameter                  | Default           |
| -------------------------- | ----------------- |
| `header`                   | `''`              |
| `previousButtonText`       | `'Previous'`      |
| `nextButtonText`           | `'Next'`          |
| `endButtonText`            | `'Done!'`         |
| `classPrefix`              | `'lektor'`        |
| `dialogOffset`             | `10` (pixels)     |
| `dialogPosition`           | `Position.BOTTOM` |
| `enableKeyboardNavigation` | `true`            |

### Lifecycle hooks

```ts
onStart: () => void
onEnd: () => void
onStepChange: () => void
onClose: () => void
```

## Step

### Methods

```ts
interface Step {
  setElement: (element: HTMLElement | null) => Step
  setBody: (body: string) => Step
  setHeader: (header: string | null) => Step
  setPreviousButtonText: (text: string | null) => Step
  setNextButtonText: (text: string | null) => Step
  setEndButtonText: (text: string | null) => Step
}
```

### Properties

```ts
interface Step {
  readonly element: HTMLElement | null
  readonly body: string
  readonly header: string | null
  readonly previousButtonText: string | null
  readonly nextButtonText: string | null
  readonly endButtonText: string | null
  readonly dialogPosition: Position | null // null = use Lektor default
}
```

### Constructor parameters

```ts
interface StepParams {
  body: string
  element?: HTMLElement | null
  header?: string
  previousButtonText?: string
  nextButtonText?: string
  endButtonText?: string
  dialogPosition?: Position
  onMounted?: ((step: Step | null, callbacks: LektorCallbacks) => void) | null
  onUnmounted?: ((step: Step | null, callbacks: LektorCallbacks) => void) | null
}
```

Step values override the matching `Lektor` values for that step only.

### Hooks

```ts
onMounted: (step: Step | null, callbacks: LektorCallbacks) => void

onUnmounted: (step: Step | null, callbacks: LektorCallbacks) => void
```

### Lektor callbacks

Each `Step` hook receives a set of callbacks that provide access to the active `Lektor` instance (note the shorter names compared to the `Lektor` methods):

```ts
interface LektorCallbacks {
  previous: () => Lektor
  next: () => Lektor
  disablePrevious: () => Lektor
  enablePrevious: () => Lektor
  disableNext: () => Lektor
  enableNext: () => Lektor
  addStep: (step: Step) => Lektor
  removeStep: (step: Step) => Lektor
}
```

# Styling

Lektor does not impose a styling system, so you can customize its appearance to match your application.

Elements get classes built from `classPrefix` (default `lektor`):

| Class                    | Element                                |
| ------------------------ | -------------------------------------- |
| `lektor-layout`          | Wrapper of all Lektor elements         |
| `lektor-curtain`         | Overlay behind the dialog              |
| `lektor-dialog`          | Dialog                                 |
| `lektor-dialog-active`   | Dialog, added on every step activation |
| `lektor-header`          | Dialog header                          |
| `lektor-header-content`  | Header text                            |
| `lektor-close-button`    | Close button                           |
| `lektor-body`            | Dialog body                            |
| `lektor-footer`          | Dialog footer                          |
| `lektor-previous-button` | Previous button                        |
| `lektor-next-button`     | Next button                            |
| `lektor-end-button`      | End button (shown on the last step)    |
| `lektor-active-element`  | Highlighted element of the active step |

The following example provides a clean starting point:

```css
.lektor-dialog {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  color: #0f172a;
  width: 100%;
  max-width: 420px;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.08),
    0 8px 10px -6px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  transform: translateY(-30px);
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lektor-curtain {
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(1px);
}

.lektor-active-element {
  box-shadow: 0 0 25px 15px rgba(107, 243, 175, 0.8);
}

.lektor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.lektor-header-content {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.lektor-close-button {
  background: transparent;
  border: none;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lektor-close-button:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.lektor-body {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #475569;
  margin-bottom: 24px;
}

.lektor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lektor-previous-button,
.lektor-next-button,
.lektor-end-button {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lektor-previous-button {
  background-color: #ffffff;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.lektor-previous-button:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.lektor-previous-button:disabled {
  border-color: #e2e8f0;
}

.lektor-next-button {
  background-color: #0f172a;
  color: #ffffff;
  border: 1px solid #0f172a;
}

.lektor-next-button:hover {
  background-color: #1e293b;
  border-color: #1e293b;
}

.lektor-previous-button:disabled,
.lektor-next-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lektor-end-button {
  background-color: #6bf3af;
  color: #0f172a;
  border: 1px solid #6bf3af;
}

.lektor-end-button:hover {
  background-color: #63eba7;
  border-color: #63eba7;
}
```
