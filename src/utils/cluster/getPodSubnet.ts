import getClusterConfiguration from "./getClusterConfiguration";

const getPodSubnet = async () => {
  const clusterConfiguration = await getClusterConfiguration();

  const podSubnet = clusterConfiguration.networking.podSubnet;

  return typeof podSubnet === "undefined" ? undefined : podSubnet;
};

export default getPodSubnet;
