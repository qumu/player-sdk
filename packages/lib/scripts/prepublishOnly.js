const { writeFile } = require('fs/promises');
const rootPackage = require('../../../package.json');
const libPackage = require('../package.json');

function preparePackageJsonFile(srcFile, destFile) {
  destFile.name = srcFile.name;
  destFile.description = srcFile.description;
  destFile.version = srcFile.version;
  destFile.repository = srcFile.repository;
  destFile.bugs = srcFile.bugs;
  destFile.homepage = srcFile.homepage;

  return destFile;
}

(async () => {
  const pkg = preparePackageJsonFile(rootPackage, libPackage);

  await writeFile('package.json', JSON.stringify(pkg, null, 2));
})();
