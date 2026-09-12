import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

describe('Exclusive Toggle Mobile 2x2 Grid CSS', () => {
  const cssPath = path.resolve(import.meta.dirname, '../src/styles/components/view-toggle.css')
  const cssContent = fs.readFileSync(cssPath, 'utf-8')

  it('defines 2x2 grid layout for .exclusive-toggle under mobile media query', () => {
    assert.ok(
      cssContent.includes('.exclusive-toggle') ||
        cssContent.includes('view-toggle.exclusive-toggle'),
      'view-toggle.css must reference .exclusive-toggle',
    )
    assert.ok(
      cssContent.includes('grid-template-columns: repeat(2, 1fr)') ||
        cssContent.includes('grid-template-columns: 1fr 1fr'),
      'Must define 2 columns via grid-template-columns',
    )
    assert.ok(
      cssContent.includes('grid-template-rows: repeat(2, auto)') ||
        cssContent.includes('grid-template-rows: auto auto') ||
        cssContent.includes('grid-template-rows: repeat(2, 1fr)') ||
        cssContent.includes('grid-template-rows: 1fr 1fr'),
      'Must define 2 rows via grid-template-rows',
    )
  })

  it('resets fusion bridge and border radius for 2x2 grid layout', () => {
    assert.ok(
      cssContent.includes('display: none') && cssContent.includes('exclusive-toggle'),
      'Must disable the horizontal fusion bridge (::before) in 2x2 grid',
    )
  })
})
