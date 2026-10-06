"""Rebuild the repository's reference backend, without reading the live database.

CER_POCKETBASE_BINARY=/absolute/path/pocketbase python scripts/verify-backend-portability.py
Uses repository seed fixtures only. Not a production restore or a full app test.
"""
import json
import os
import pathlib
import re
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

binary = os.environ.get('CER_POCKETBASE_BINARY', '')
if not pathlib.Path(binary).is_absolute():
    raise RuntimeError('An absolute path to the official reference binary is required')
version = subprocess.run([binary, '--version'], capture_output=True, text=True, check=True)
if version.stdout.strip() != 'pocketbase version 0.26.1':
    raise RuntimeError('Reference bench requires 0.26.1; Skip runtime is not inferred')
root = pathlib.Path(tempfile.mkdtemp(prefix='cer-complete-reference-'))
proc = None
try:
    migrations = root / 'migrations'
    hooks = root / 'hooks'
    migrations.mkdir()
    hooks.mkdir()
    for source in sorted(pathlib.Path('pocketbase/migrations').glob('*.js')):
        shutil.copy(source, migrations / source.name)
    applied = subprocess.run(
        [binary, 'migrate', 'up', '--dir=' + str(root / 'data'),
         '--migrationsDir=' + str(migrations), '--hooksDir=' + str(hooks)],
        capture_output=True, text=True, timeout=30,
    )
    if applied.returncode:
        raise RuntimeError('Repository migration reconstruction failed; no live server was contacted')
    for source in pathlib.Path('pocketbase/hooks').glob('*.js'):
        shutil.copy(source, hooks / (source.stem + '.pb.js'))
    # Reserve a currently free loopback port before spawning; reject collisions at startup.
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    base = 'http://127.0.0.1:' + str(port)
    with open(root / 'server.log', 'w') as log:
        proc = subprocess.Popen(
            [binary, 'serve', '--dir=' + str(root / 'data'),
             '--migrationsDir=' + str(migrations), '--hooksDir=' + str(hooks),
             '--http=127.0.0.1:' + str(port)], stdout=log, stderr=log,
        )
        healthy = False
        for _ in range(100):
            if proc.poll() is not None:
                raise RuntimeError('Reference server exited during startup')
            try:
                with urllib.request.urlopen(base + '/api/health', timeout=1) as response:
                    healthy = response.status == 200
                    break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(.1)
        if not healthy:
            raise RuntimeError('Reference server health check timed out')
        request = urllib.request.Request(
            base + '/backend/v1/cer/session-map-proposal',
            data=b'{}', headers={'Content-Type': 'application/json'}, method='POST',
        )
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                denied = response.status
        except urllib.error.HTTPError as error:
            denied = error.code
        if denied not in (401, 403):
            raise RuntimeError('Anonymous proposal request was not denied by authentication')
        proc.terminate()
        proc.wait(timeout=5)
    errors = re.findall(r'^.*(?:ReferenceError|SyntaxError|TypeError).*$',
                        (root / 'server.log').read_text(), re.MULTILINE)
    if errors:
        raise RuntimeError('Hook runtime error detected during the bounded probe')
    print(json.dumps({
        'engine': 'PocketBase 0.26.1 reference, not the Skip runtime',
        'migrationsApplied': len(re.findall(r'^Applied ', applied.stdout, re.MULTILINE)),
        'hookFilesLoadedAtStartup': len(list(hooks.glob('*.pb.js'))),
        'healthy': healthy, 'anonymousAiProposalStatus': denied,
        'scope': 'Schema reconstruction, hook startup, one auth guard; NOT full business behavior or live-data export',
    }, ensure_ascii=False, indent=2))
finally:
    if proc is not None and proc.poll() is None:
        proc.terminate()
        proc.wait(timeout=5)
    shutil.rmtree(root)
