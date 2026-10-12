import { describe, it, expect, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

describe('PocketBase Client Node Runtime Import & Fail-Closed URL Resolution', () => {
  const rootDir = process.cwd()
  const clientPath = path.resolve(rootDir, 'src/lib/pocketbase/client.ts')

  it('deve exportar getPocketBaseUrl e resolver URL loopback quando VITE_POCKETBASE_URL estiver definida no ambiente', async () => {
    // 1. Teste in-process isolando getPocketBaseUrl
    const { getPocketBaseUrl } = await import('@/lib/pocketbase/client')
    expect(typeof getPocketBaseUrl).toBe('function')

    const loopback = 'http://127.0.0.1:8090'
    const script = `
      import { pathToFileURL } from 'node:url';
      const clientUrl = pathToFileURL(${JSON.stringify(clientPath)}).href;
      const { default: pb, getPocketBaseUrl } = await import(clientUrl);
      if (typeof getPocketBaseUrl !== 'function') throw new Error('getPocketBaseUrl is not a function');
      if (getPocketBaseUrl() !== ${JSON.stringify(loopback)}) throw new Error('getPocketBaseUrl mismatch: ' + getPocketBaseUrl());
      if (!pb || pb.baseUrl !== ${JSON.stringify(loopback)}) throw new Error('pb.baseUrl mismatch: ' + pb?.baseUrl);
      console.log('SUCCESS_LOOPBACK_RESOLVED');
    `

    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: rootDir,
      env: {
        ...process.env,
        VITE_POCKETBASE_URL: loopback,
      },
      encoding: 'utf8',
    })

    expect(out).toContain('SUCCESS_LOOPBACK_RESOLVED')
  })

  it('deve resolver POCKETBASE_URL caso VITE_POCKETBASE_URL esteja vazia em ambiente Node', () => {
    const loopbackFallback = 'http://127.0.0.1:8099'
    const script = `
      import { pathToFileURL } from 'node:url';
      const clientUrl = pathToFileURL(${JSON.stringify(clientPath)}).href;
      const { default: pb, getPocketBaseUrl } = await import(clientUrl);
      if (getPocketBaseUrl() !== ${JSON.stringify(loopbackFallback)}) throw new Error('Fallback mismatch: ' + getPocketBaseUrl());
      if (pb.baseUrl !== ${JSON.stringify(loopbackFallback)}) throw new Error('pb.baseUrl fallback mismatch');
      console.log('SUCCESS_POCKETBASE_URL_FALLBACK_RESOLVED');
    `

    const envCustom = { ...process.env }
    delete envCustom.VITE_POCKETBASE_URL
    envCustom.POCKETBASE_URL = loopbackFallback

    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: rootDir,
      env: envCustom,
      encoding: 'utf8',
    })

    expect(out).toContain('SUCCESS_POCKETBASE_URL_FALLBACK_RESOLVED')
  })

  it('deve lançar erro fail-closed ("Backend não configurado…") e NUNCA resolver para URL de produção quando sem env', () => {
    const scriptNoEnv = `
      import { pathToFileURL } from 'node:url';
      const clientUrl = pathToFileURL(${JSON.stringify(clientPath)}).href;
      try {
        await import(clientUrl);
        console.error('FAIL: Client import succeeded unexpectedly without env');
        process.exit(1);
      } catch (err) {
        const msg = String(err && (err.message || err));
        if (msg.includes('Backend não configurado: defina VITE_POCKETBASE_URL no ambiente')) {
          console.log('SUCCESS_FAIL_CLOSED_ERROR_CAUGHT');
          process.exit(0);
        } else {
          console.error('UNEXPECTED_ERROR: ' + msg);
          process.exit(2);
        }
      }
    `

    const cleanEnv = { ...process.env }
    delete cleanEnv.VITE_POCKETBASE_URL
    delete cleanEnv.POCKETBASE_URL

    const out = execFileSync(process.execPath, ['--input-type=module', '-e', scriptNoEnv], {
      cwd: rootDir,
      env: cleanEnv,
      encoding: 'utf8',
    })

    expect(out).toContain('SUCCESS_FAIL_CLOSED_ERROR_CAUGHT')
    expect(out).not.toContain('skip-cloud')
    expect(out).not.toContain('pockethost')
    expect(out).not.toContain('cer-backend')
  })
})
