import { homedir } from 'os';
import { join } from 'path';

export const homeDir = homedir();
export const currentWorkingDir = process.cwd();
export const bundleRootDir = process.env.DKP_MIRROR_BUNDLE_ROOT_DIR
  ? process.env.DKP_MIRROR_BUNDLE_ROOT_DIR
  : currentWorkingDir;
export const clusterResourcesDir = join(bundleRootDir, "cluster-resources");
export const configmapsDir = join(bundleRootDir, "configmaps");
export const customResourcesDir = join(clusterResourcesDir, "custom-resources");
export const defaultExtractBundleDirectory = join(
  homeDir,
  "Documents/logs/tickets"
);
