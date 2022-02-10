import { Network } from "dockerode";
declare const dockerNetwork: () => Promise<Network>;
export default dockerNetwork;
