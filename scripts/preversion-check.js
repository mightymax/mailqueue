import { execSync } from 'node:child_process';

function getOutput(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

try {
  const status = getOutput('git status --porcelain');
  if (status.length > 0) {
    console.error('Refusing npm version: git working tree contains uncommitted changes.');
    console.error('Commit or stash changes first.');
    process.exit(1);
  }
} catch (error) {
  console.error('Unable to verify git status before npm version.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
