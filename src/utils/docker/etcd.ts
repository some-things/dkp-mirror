import dockerClient from "./client";

// import { stdout } from "process";

const docker = dockerClient;

const createAndStartEtcdContainer = () => {
  console.log("Successfully pulled etcd image");
  console.log("Creating container dkp-mirror-etcd...");
  docker.createContainer(
    {
      name: "dkp-mirror-etcd",
      Hostname: "dkp-mirror-etcd",
      Cmd: [
        "etcd",
        "-advertise-client-urls",
        "http://dkp-mirror-etcd:2379",
        "-listen-client-urls",
        "http://0.0.0.0:2379",
      ],
      ExposedPorts: {
        "2379/tcp": {},
        "2380/tcp": {},
        "4001/tcp": {},
        "7001/tcp": {},
      },
      HostConfig: {
        AutoRemove: true,
        RestartPolicy: {
          Name: "no",
          MaximumRetryCount: 0,
        },
        NetworkMode: "default",
        PortBindings: {
          "2379/tcp": [
            {
              HostIp: "",
              HostPort: "2379",
            },
          ],
        },
      },
      Image: "k8s.gcr.io/etcd:3.4.13-0",
    },
    (err, container) => {
      if (!err) {
        console.log("Created dkp-mirror-etcd container ID: ", container?.id);
        container?.start({}, (err) => {
          if (!err) {
            console.log("Started dkp-mirror-etcd container");
          } else {
            console.log(err);
          }
        });
      } else {
        console.log(err);
      }
    }
  );
};

// const etcdContainer = async (
//   callback?: Function | undefined
// ): Promise<void> => {
//   docker.pull("k8s.gcr.io/etcd:3.4.13-0", {}, (err, stream) => {
//     if (!err) {
//       console.log("Pulling etcd image...");
//       // stream.pipe(stdout);

//       // follow pull progress, then create container on pull finished
//       docker.modem.followProgress(stream, createAndStartEtcdContainer);

//       if (typeof callback === "function") {
//         callback();
//       }
//     } else {
//       console.log(err);
//     }
//     return;
//   });
// };

const etcdContainer = (callback?: Function | undefined) => {
  docker.pull("k8s.gcr.io/etcd:3.4.13-0", {}, (err, stream) => {
    if (!err) {
      console.log("Pulling etcd image...");
      // stream.pipe(stdout);

      // follow pull progress, then create container on pull finished
      docker.modem.followProgress(stream, createAndStartEtcdContainer);

      if (typeof callback === "function") {
        callback();
        return;
      }
    } else {
      console.log(err);
      return;
    }
  });
  return;
};

// etcdContainer();

export default etcdContainer;
