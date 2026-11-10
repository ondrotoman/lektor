import { afterEach, describe, expect, it, vi } from 'vitest'
import Lektor from './lektor.js'
import { Step } from './step.js'
import { Position } from './enums/Position.js'

const createElement = (): HTMLElement => {
  const element = document.createElement('div')
  document.body.appendChild(element)
  return element
}

const getButton = (name: string): HTMLButtonElement =>
  document.querySelector(`[data-lektor="${name}"]`) as HTMLButtonElement

const getBody = (): string => document.querySelector('[data-lektor="body"]')!.innerHTML

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Lektor', () => {
  it('does not start without steps', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const lektor = new Lektor({ onStart, onEnd })

    lektor.start()

    expect(lektor.isActive()).toBe(false)
    expect(onStart).not.toHaveBeenCalled()
    expect(onEnd).not.toHaveBeenCalled()
    expect(document.querySelector('[data-lektor="layout"]')).toBeNull()
  })

  it('removes all listeners on close', () => {
    const lektor = new Lektor({ steps: [new Step({ body: 'one' }), new Step({ body: 'two' })] })
    lektor.start()
    lektor.close()

    const next = vi.spyOn(lektor, 'next')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(next).not.toHaveBeenCalled()
  })

  it('inserts steps after and before given step', () => {
    const first = new Step({ body: 'first' })
    const last = new Step({ body: 'last' })
    const after = new Step({ body: 'after' })
    const before = new Step({ body: 'before' })
    const lektor = new Lektor({ steps: [first, last] })

    lektor.addStepAfter(after, first).addStepBefore(before, last)
    lektor.start()

    const bodies = [getBody()]
    for (let i = 0; i < 3; i++) {
      lektor.next()
      bodies.push(getBody())
    }
    expect(bodies).toEqual(['first', 'after', 'before', 'last'])
  })

  it('moves to next step when active step is removed', () => {
    const first = new Step({ body: 'first' })
    const second = new Step({ body: 'second' })
    const lektor = new Lektor({ steps: [first, second] })
    lektor.start()

    lektor.removeStep(first)
    expect(getBody()).toBe('second')

    first.setBody('changed')
    expect(getBody()).toBe('second')
  })

  it('ends tutorial when last remaining step is removed', () => {
    const onEnd = vi.fn()
    const step = new Step({ body: 'only' })
    const lektor = new Lektor({ steps: [step], onEnd })
    lektor.start()

    lektor.removeStep(step)
    expect(lektor.isActive()).toBe(false)
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('uses default dialog position from params', () => {
    const step = new Step({ body: 'one', element: createElement() })
    const lektor = new Lektor({ steps: [step], dialogPosition: Position.RIGHT, dialogOffset: 10 })
    lektor.start()

    const dialog = document.querySelector('[data-lektor="dialog"]') as HTMLElement
    expect(dialog.style.left).toBe('10px')
    expect(dialog.style.top).toBe('0px')
    lektor.close()
  })

  it('allows disabling next step before start', () => {
    const lektor = new Lektor()
    expect(() => lektor.disableNextStep().enableNextStep()).not.toThrow()
  })

  it('ignores keyboard navigation while typing into inputs', () => {
    const lektor = new Lektor({ steps: [new Step({ body: 'one' }), new Step({ body: 'two' })] })
    lektor.start()

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(getBody()).toBe('one')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(getBody()).toBe('two')
  })

  it('re-renders active step without calling unmount hook', () => {
    const onUnmounted = vi.fn()
    const element = createElement()
    element.style.color = 'red'
    const step = new Step({ body: 'one', element, onUnmounted })
    const lektor = new Lektor({ steps: [step] })
    lektor.start()

    step.setBody('changed')
    expect(getBody()).toBe('changed')
    expect(onUnmounted).not.toHaveBeenCalled()

    lektor.close()
    expect(onUnmounted).toHaveBeenCalledOnce()
    expect(element.style.cssText).toBe('color: red;')
  })

  it('restores original element when step element changes', () => {
    const original = createElement()
    const replacement = createElement()
    const step = new Step({ body: 'one', element: original })
    const lektor = new Lektor({ steps: [step] })
    lektor.start()

    step.setElement(replacement)
    expect(original.classList.contains('lektor-active-element')).toBe(false)
    expect(original.style.cssText).toBe('')
    expect(replacement.classList.contains('lektor-active-element')).toBe(true)
    lektor.close()
  })

  it('keeps previous step disabled by hook after re-render', () => {
    const second = new Step({
      body: 'two',
      onMounted: (_step, callbacks) => callbacks.disablePrevious(),
    })
    const lektor = new Lektor({ steps: [new Step({ body: 'one' }), second] })
    lektor.start()
    lektor.next()

    second.setBody('changed')
    expect(getButton('previous-button').disabled).toBe(true)
  })

  it('enables next step again on next step activation', () => {
    const first = new Step({
      body: 'one',
      onMounted: (_step, callbacks) => callbacks.disableNext(),
    })
    const lektor = new Lektor({ steps: [first, new Step({ body: 'two' })] })
    lektor.start()
    expect(getButton('next-button').disabled).toBe(true)

    lektor.enableNextStep().next()
    expect(getButton('next-button').disabled).toBe(false)
  })
})
