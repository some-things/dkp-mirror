import { readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { basename, join } from 'path';

const getDirectories = (srcPath: string) => {
  return readdirSync(srcPath)
    .map((file) => join(srcPath, file))
    .filter((path) => statSync(path).isDirectory());
};

const getDirectoriesRecursive = (srcPath: string): string[] => {
  return [
    srcPath,
    ...getDirectories(srcPath)
      .map(getDirectoriesRecursive)
      .reduce((a: any, b: any) => a.concat(b), []),
  ];
};

const findDirectoryRecursive = (dir: string): string => {
  const dirs = getDirectoriesRecursive(bundleRootDir);
  const result = dirs.find((d) => basename(d) === dir);

  if (typeof result === undefined) {
    console.error(`error: directory ${dir} not found`);
  }

  return result || "";
};

export const getClusterResourcesDir = (): string => {
  return findDirectoryRecursive("cluster-resources");
};

export const getConfigmapsDir = (): string => {
  return findDirectoryRecursive("configmaps");
};

export const getCustomResourcesDir = (): string => {
  return findDirectoryRecursive("custom-resources");
};

export const homeDir = homedir();
export const currentWorkingDir = process.cwd();
export const bundleRootDir = process.env.DKP_MIRROR_BUNDLE_ROOT_DIR
  ? process.env.DKP_MIRROR_BUNDLE_ROOT_DIR
  : currentWorkingDir;
export const defaultExtractBundleDirectory = join(
  homeDir,
  "Documents/logs/tickets"
);
