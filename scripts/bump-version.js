import fs from 'fs';
import path from 'path';

const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

if (!fs.existsSync(buildGradlePath)) {
  console.error(`[version-bump] Error: File not found at ${buildGradlePath}`);
  process.exit(1);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

// Match versionCode <number>
const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
if (versionCodeMatch) {
  const currentCode = parseInt(versionCodeMatch[1], 10);
  const newCode = currentCode + 1;
  content = content.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
  console.log(`[version-bump] Updated versionCode: ${currentCode} -> ${newCode}`);
} else {
  console.warn('[version-bump] Could not locate versionCode in build.gradle');
}

// Match versionName "<version>"
const versionNameMatch = content.match(/versionName\s+"([^"]+)"/);
if (versionNameMatch) {
  const currentVersion = versionNameMatch[1];
  const parts = currentVersion.split('.');
  if (parts.length > 0) {
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      parts[parts.length - 1] = (lastNum + 1).toString();
    } else {
      parts.push('1');
    }
  }
  const newVersion = parts.join('.');
  content = content.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  console.log(`[version-bump] Updated versionName: ${currentVersion} -> ${newVersion}`);
} else {
  console.warn('[version-bump] Could not locate versionName in build.gradle');
}

fs.writeFileSync(buildGradlePath, content, 'utf8');
console.log('[version-bump] build.gradle updated successfully!');
