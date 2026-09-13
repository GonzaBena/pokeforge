import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { shouldToggleTooltip } from '../src/lib/moveTooltip'

test('shouldToggleTooltip - toggles if different element clicked', () => {
  const el1 = {}
  const el2 = {}
  assert.equal(shouldToggleTooltip(el1, el2, 1000, 2000), true)
})

test('shouldToggleTooltip - ignores click if shown less than 400ms ago on same trigger', () => {
  const el = {}
  assert.equal(shouldToggleTooltip(el, el, 1000, 1200), false)
})

test('shouldToggleTooltip - closes if clicked after 400ms on same trigger', () => {
  const el = {}
  assert.equal(shouldToggleTooltip(el, el, 1000, 1500), true)
})

test('moveTooltip listeners safely handle non-Element targets like document or window', async () => {
  const moveTooltipSource = fs.readFileSync('src/lib/moveTooltip.ts', 'utf-8')

  // None of the event listeners should blindly cast e.target as HTMLElement without checking instanceof Element
  assert.doesNotMatch(
    moveTooltipSource,
    /const target = e\.target as HTMLElement/,
    'moveTooltip should not blindly cast e.target as HTMLElement because document/window targets lack .closest',
  )
})
