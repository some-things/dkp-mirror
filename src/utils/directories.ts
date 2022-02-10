import path from "path";
import os from "os";

export const homeDir = os.homedir();
export const currentWorkingDir = process.cwd();
export const bundleRootDir = "./support-bundle-2022-01-28T13_08_07";
export const clusterResourcesDir = path.join(
  bundleRootDir,
  "cluster-resources"
);
export const configmapsDir = path.join(bundleRootDir, "configmaps");
export const customResourcesDir = path.join(bundleRootDir, "custom-resources");
export const defaultExtractBundleDirectory = path.join(
  homeDir,
  "Documents/logs/tickets"
);
