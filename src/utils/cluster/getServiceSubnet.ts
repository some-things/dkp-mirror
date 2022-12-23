import getClusterConfiguration from './getClusterConfiguration'

const getServiceSubnet = async () => {
  const clusterConfiguration = await getClusterConfiguration();

  const serviceSubnet = clusterConfiguration.networking.serviceSubnet;

  return typeof serviceSubnet === "undefined" ? undefined : serviceSubnet;
};

export default getServiceSubnet;
