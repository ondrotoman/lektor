import { describe, it, expect, beforeEach } from 'vitest'
import Lektor from '../bin/lektor.js'
import { Step } from '../bin/step.js'

describe('Lektor visibility test', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('Is Lektor visible', () => {
    const mockElement = document.createElement('div')
    document.body.appendChild(mockElement)

    const step = new Step({ body: 'Step test', element: mockElement })
    const lektor = new Lektor({ steps: [step] })
    lektor.start()
    const lektorLayout = document.querySelector('[data-lektor="layout"]')
    expect(lektorLayout).toBeVisible()
  })
})
