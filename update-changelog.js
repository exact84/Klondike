const fs = require('fs');
const { execSync } = require('child_process');

// Функция для определения типа версии на основе коммитов
function determineVersionBump(commits) {
  if (commits.some((msg) => msg.includes('BREAKING CHANGE'))) return 'major';
  if (commits.some((msg) => msg.startsWith('feat'))) return 'minor';
  if (commits.some((msg) => msg.startsWith('fix'))) return 'patch';
  return null;
}

// Чтение package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = pkg.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Получение коммитов из PR
const commits = execSync('git log --pretty=%s origin/main..HEAD').toString().split('\n');
const bumpType = determineVersionBump(commits);

let newVersion;
if (bumpType === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bumpType === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else if (bumpType === 'patch') {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else {
  console.log('No version bump needed');
  process.exit(0);
}

// Обновление package.json
pkg.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

// Генерация CHANGELOG.md
const changelog = fs.existsSync('CHANGELOG.md') ? fs.readFileSync('CHANGELOG.md', 'utf8') : '';
const date = new Date().toISOString().split('T')[0];
const newEntry = `## ${newVersion} (${date})\n\n### Changes\n${commits.map((c) => `- ${c}`).join('\n')}\n\n`;
fs.writeFileSync('CHANGELOG.md', newEntry + changelog);

console.log(`Updated to version ${newVersion}`);
