const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const source = path.resolve(__dirname, 'build');
const destination = path.resolve(__dirname, '../backend/build');

// 一旦build削除（念のため）
if (fs.existsSync(destination)) {
  fs.rmSync(destination, { recursive: true, force: true });
}

// OS判定してmove
try {
  if (process.platform === 'win32') {
    execSync(`move "${source}" "${destination}"`, { stdio: 'inherit', shell: 'cmd.exe' });
  } else {
    execSync(`mv "${source}" "${destination}"`, { stdio: 'inherit', shell: '/bin/bash' });
  }
  console.log('✅ buildフォルダ移動完了');
} catch (err) {
  console.error('❌ フォルダ移動失敗:', err);
  process.exit(1);
}
