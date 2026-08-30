import { spawn } from 'node:child_process';

const commands = [
  ['npm', ['run', 'typecheck']],
  ['npm', ['run', 'lint']],
  ['npm', ['test']],
  ['npm', ['run', 'build']],
] as const;

async function main() {
  const started = Date.now();
  for (const [command, args] of commands) {
    const exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit', shell: false });
      child.on('error', reject);
      child.on('close', (code) => resolve(code ?? 1));
    });
    if (exitCode !== 0) process.exit(exitCode);
  }
  console.log(`Quality gate passed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

void main();
