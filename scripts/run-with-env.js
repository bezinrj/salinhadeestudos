import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8')
  .split(/\r?\n/)
  .reduce((acc, line) => {
    const match = line.trim().match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, ''); // strip single/double quotes
      acc[key] = val;
    }
    return acc;
  }, {});

const script = process.argv[2];
if (!script) {
  console.error('Usage: node scripts/run-with-env.js <script-path> [args...]');
  process.exit(1);
}

const args = ['tsx', script, ...process.argv.slice(3)];
const child = spawn('npx', args, {
  env: { ...process.env, ...env },
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
