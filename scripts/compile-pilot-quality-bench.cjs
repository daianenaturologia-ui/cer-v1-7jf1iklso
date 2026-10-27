// Exercises helper-generating compilation before PocketBase isolates callbacks.
// This models the observed deployment failure; it is not the Skip compiler.
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const output = process.argv[2]
if (!output || !path.isAbsolute(output)) throw new Error('Use an absolute disposable output path')
const source = fs.readFileSync('pocketbase/hooks/on_pilot_quality.js', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.None, allowJs: true },
}).outputText
fs.writeFileSync(output, compiled)
