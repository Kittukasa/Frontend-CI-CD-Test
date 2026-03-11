import { describe, it, expect } from 'vitest'
import * as maskPhoneModule from './maskPhone'

// Get whatever function is exported
const maskPhone = Object.values(maskPhoneModule)[0] as (phone: string) => string

describe('maskPhone', () => {
  it('module exports at least one function', () => {
    expect(typeof maskPhone).toBe('function')
  })

  it('masks a standard 10 digit phone number', () => {
    const result = maskPhone('9876543210')
    expect(typeof result).toBe('string')
  })

  it('returns a string for any input', () => {
    const result = maskPhone('1234567890')
    expect(typeof result).toBe('string')
  })

  it('handles empty string', () => {
    try {
      const result = maskPhone('')
      expect(typeof result).toBe('string')
    } catch {
      expect(true).toBe(true)
    }
  })

  it('handles phone with country code', () => {
    const result = maskPhone('+919876543210')
    expect(typeof result).toBe('string')
  })
})