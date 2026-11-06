import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('joins the classes with a space and leaves out what is not a class', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('takes a list of classes, however deeply nested, as one of the values', () => {
    expect(cx(['a', 'b'], false, ['c', [false, 'd']], 'e')).toBe('a b c d e')
  })

  it('is an empty string when nothing is left, so a className is never "undefined"', () => {
    expect(cx(false, [], [undefined, [null]])).toBe('')
  })
})
