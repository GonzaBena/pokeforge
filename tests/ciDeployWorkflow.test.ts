import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

test("ci-deploy workflow builds and deploys in the same job so pnpm symlinks stay intact", () => {
  const root = process.cwd()
  const workflowPath = path.join(root, ".github/workflows/ci-deploy.yml")
  assert.ok(fs.existsSync(workflowPath), "ci-deploy.yml must exist")

  const content = fs.readFileSync(workflowPath, "utf-8")

  // Build and deploy must live in a single job: .netlify/v1 (with its pnpm-symlinked
  // node_modules) must never be shipped between jobs via upload/download-artifact,
  // since that roundtrip breaks the symlinks and crashes the deployed function.
  assert.doesNotMatch(
    content,
    /actions\/(upload|download)-artifact/,
    "workflow must not transfer .netlify build output between jobs via artifacts"
  )

  assert.match(content, /pnpm run build/, "workflow must build the site")

  const buildIndex = content.indexOf("pnpm run build")
  const deployIndex = content.indexOf("netlify deploy")
  assert.ok(deployIndex > buildIndex, "deploy step must come after the build step in the same job")

  assert.match(
    content,
    /if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/,
    "deploy step must be gated to pushes on master"
  )
})
