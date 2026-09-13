import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('ci-deploy workflow includes .netlify/build and .netlify/v1 artifacts', () => {
  const root = process.cwd()
  const workflowPath = path.join(root, '.github/workflows/ci-deploy.yml')
  assert.ok(fs.existsSync(workflowPath), 'ci-deploy.yml must exist')

  const content = fs.readFileSync(workflowPath, 'utf-8')

  // In build-test job, .netlify/build must be uploaded so Netlify SSR function entrypoint is available
  assert.match(
    content,
    /path:\s*\.netlify\/build/,
    'build-test job must upload .netlify/build artifact',
  )

  // In build-test job, .netlify/v1 must be uploaded
  assert.match(content, /path:\s*\.netlify\/v1/, 'build-test job must upload .netlify/v1 artifact')

  // In deploy job, both artifacts must be downloaded
  const deployJobIndex = content.indexOf('deploy:')
  assert.ok(deployJobIndex > 0, 'deploy job must exist in workflow')
  const deployJobContent = content.slice(deployJobIndex)

  assert.match(
    deployJobContent,
    /path:\s*\.netlify\/build/,
    'deploy job must download .netlify/build artifact',
  )
  assert.match(
    deployJobContent,
    /path:\s*\.netlify\/v1/,
    'deploy job must download .netlify/v1 artifact',
  )
})
