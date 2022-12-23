import Docker from 'dockerode'

const dockerClient = new Docker({ socketPath: "/var/run/docker.sock" });

export default dockerClient;
