import { readFile } from "fs/promises";
import { join } from "path";
import { configmapsDir } from "../directories";
import YAML from "yaml";

const getClusterConfiguration = async () => {
  const kubeadmConfigConfigMap = await readFile(
    join(configmapsDir, "kube-system/kubeadm-config.json"),
    "utf-8"
  );
  const kubeadmConfigConfigMapJSON = JSON.parse(kubeadmConfigConfigMap);
  const clusterConfigurationYAML = YAML.parse(
    kubeadmConfigConfigMapJSON.data.ClusterConfiguration
  );

  return typeof clusterConfigurationYAML === "undefined"
    ? undefined
    : clusterConfigurationYAML;
};

export default getClusterConfiguration;
