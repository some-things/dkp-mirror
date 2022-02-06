import dockerClient from "./client";

// import { stdout } from "process";

const docker = dockerClient;

// const pullApiserverImage = () => {
//   docker.pull("k8s.gcr.io/kube-apiserver:v1.21.1", {}, (err, stream) => {
//     if (!err) {
//       console.log("Pulling kube-apiserver image...");
//       // stream.pipe(stdout);

//       docker.modem.followProgress(stream, (err) => {
//         if (err) {
//           console.error(err);
//           return;
//         }
//         console.log("Successfully pulled kube-apiserver image");
//         return;
//       });
//     } else {
//       console.error(err);
//       return;
//     }
//   });
// };

// const createApiserverContainer = () => {
//   docker.createContainer();
// };

// const startApiserverContainer = () => {
//   const container = docker.getContainer("dkp-mirror-kube-apiserver");
// };

// const apiServerContainer = () => {
//   pullApiserverImage();
//   createApiserverContainer();
//   console.log("Successfully created kube-apiserver container");
// };

const apiServerContainer = async () => {
  console.log("Pulling apiserver image");
  await docker.pull("k8s.gcr.io/kube-apiserver:v1.21.1", {});
  console.log("Successfully pulled apiserver image");
  await docker.createContainer({
    name: "dkp-mirror-kube-apiserver",
    Hostname: "dkp-mirror-kube-apiserver",
  });
};

apiServerContainer();
export default apiServerContainer;
