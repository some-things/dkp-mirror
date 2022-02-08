import path from "path";

export const etcdImage = "k8s.gcr.io/etcd:3.4.13-0";
export const apiServerImage = "k8s.gcr.io/kube-apiserver:v1.21.1";
export const bundleRootDir = "./support-bundle-2022-02-07T02_30_35";
export const clusterResourcesDir = path.join(
  bundleRootDir,
  "cluster-resources"
);
export const configmapsDir = path.join(bundleRootDir, "configmaps");
export const customResourcesDir = path.join(bundleRootDir, "custom-resources");
