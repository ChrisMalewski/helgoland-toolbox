const {
  execSync
} = require("child_process");
const {
  existsSync,
  writeFileSync,
  mkdirSync
} = require("fs");

const commitId = execSync('git rev-parse HEAD').toString().trim();
const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

console.log(`version: '${process.env.npm_package_version}', commitId: '${commitId}', branch: '${branch}'`);
const content = '// this file is automatically generated by git.version.ts script\n' +
  `export const versions = {
      version: '${process.env.npm_package_version}',
      commitId: '${commitId}',
      branch: '${branch}',
      buildDate: '${new Date().toISOString()}'
  };
  `;
const folder = 'apps/helgoland/src/environments';
if (!existsSync(folder)) {
  mkdirSync(folder, {
    recursive: true,
    mode: 0o755
  });
}

writeFileSync(
  `${folder}/versions.ts`,
  content, {
    encoding: 'utf8'
  }
);
