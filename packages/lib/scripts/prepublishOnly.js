import { writeFile } from 'node:fs/promises';
import rootPackage from '../../../package.json' with { type: 'json' };
import libPackage from '../package.json' with { type: 'json' };

function preparePackageJsonFile(srcFile, destFile) {
  destFile.name = srcFile.name;
  destFile.description = srcFile.description;
  destFile.version = srcFile.version;
  destFile.repository = srcFile.repository;
  destFile.bugs = srcFile.bugs;
  destFile.homepage = srcFile.homepage;

  return destFile;
}

const pkg = preparePackageJsonFile(rootPackage, libPackage);

await writeFile('package.json', JSON.stringify(pkg, null, 2));
