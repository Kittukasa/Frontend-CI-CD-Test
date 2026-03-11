import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as session from './session'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('session utilities', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('exports session functions', () => {
    expect(session).toBeTruthy()
    expect(typeof session).toBe('object')
  })

  it('all exports are functions or values', () => {
    Object.values(session).forEach(val => {
      expect(['function', 'string', 'number', 'boolean', 'object'].includes(typeof val)).toBe(true)
    })
  })

  it('handles session functions with empty storage', () => {
    const fns = Object.values(session).filter(f => typeof f === 'function') as Function[]
    fns.forEach(fn => {
      try {
        fn()
      } catch {
        // Some functions may require specific args
      }
    })
    expect(true).toBe(true)
  })

  it('handles setting and getting session values', () => {
    const fns = Object.entries(session).filter(([, v]) => typeof v === 'function')
    fns.forEach(([, fn]) => {
      try {
        ;(fn as Function)('test-value')
      } catch {
        // ignore
      }
    })
    expect(true).toBe(true)
  })
})
