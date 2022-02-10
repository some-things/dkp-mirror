import { Container } from "dockerode";
declare const etcdContainer: () => Promise<Container>;
export default etcdContainer;
