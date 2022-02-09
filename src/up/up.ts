import fs from "fs";
import path from "path";
import dockerNetwork from "../utils/docker/network";
import etcdContainer from "../utils/docker/etcd";
import etcdClient from "../utils/etcd/client";
import apiServerContainer from "../utils/docker/apiServer";
import { clusterResourcesDir, customResourcesDir } from "../constants";

// TODO: make dynamic
const defaultClusterResourceFilesToParse: string[] = [
  "nodes.json",
  "namespaces.json",
  "custom-resource-definitions.json",
  "storage-classes.json",
  "pvs.json",
];
const defaultNamespacedResourceDirsToParse: string[] = [
  "cronjobs",
  "deployments",
  "events",
  "ingress",
  "jobs",
  // NOTE: untested
  "limitranges",
  "pods",
  "pvcs",
  "services",
  "statefulsets",
];

const parseClusterResources = () => {
  const clusterResourcesDirFiles = fs.readdirSync(clusterResourcesDir, {
    withFileTypes: true,
  });

  // for each file in the cluster-resources dir
  clusterResourcesDirFiles.forEach((f) => {
    const fileBasename = path.parse(f.name).name;
    const kind = getKind(fileBasename);
    const apiVersion = getApiVersion(kind);
    const kindPath = getKindPath(fileBasename);

    // for each directory in the cluster-resources dir
    if (
      f.isDirectory() &&
      defaultNamespacedResourceDirsToParse.includes(f.name)
    ) {
      const clusterResourcesDirDirs = fs.readdirSync(
        path.join(clusterResourcesDir, f.name),
        { withFileTypes: true }
      );
      // for each file in each dir in the cluster-resources dir (namespaced resources)
      clusterResourcesDirDirs.forEach((clusterResourcesDirDirsFile) => {
        if (path.extname(clusterResourcesDirDirsFile.name) === ".json") {
          const namespace = path.parse(clusterResourcesDirDirsFile.name).name;

          const resourceFile = fs.readFileSync(
            path.join(
              clusterResourcesDir,
              f.name,
              clusterResourcesDirDirsFile.name
            ),
            "utf8"
          );

          const jsonObjects = JSON.parse(resourceFile);

          jsonObjects.forEach((jsonObject: any) => {
            const name = jsonObject["metadata"]["name"];
            jsonObject["metadata"]["namespace"] = namespace;
            jsonObject["kind"] = kind;
            jsonObject["apiVersion"] = apiVersion;

            (async () => {
              await etcdClient
                .put(`/registry/${kindPath}/${namespace}/${name}`)
                .value(JSON.stringify(jsonObject));
            })();
          });
        }
      });
      // for each file in the cluster-resources dir (cluster resources)
    } else if (
      !f.isDirectory() &&
      defaultClusterResourceFilesToParse.includes(f.name) &&
      path.extname(f.name) === ".json"
    ) {
      const resourceFile = fs.readFileSync(
        path.join(path.join(clusterResourcesDir, f.name)),
        "utf8"
      );

      const jsonObjects = JSON.parse(resourceFile);

      jsonObjects.forEach((jsonObject: any) => {
        const name = jsonObject["metadata"]["name"];
        jsonObject["kind"] = kind;
        jsonObject["apiVersion"] = apiVersion;
        // we do this to remove webhook configuration from crds, which appeared to cause apiserver panics
        // TODO: investigate better options
        if (kind == "CustomResourceDefinition") {
          jsonObject["spec"]["conversion"] = {};
          jsonObject["spec"]["conversion"]["strategy"] = "None";
        }

        (async () => {
          await etcdClient
            .put(`/registry/${kindPath}${name}`)
            .value(JSON.stringify(jsonObject));
        })();
      });
    }
  });
};

const parseCustomResources = () => {
  const customResourcesDirFiles = fs.readdirSync(customResourcesDir, {
    withFileTypes: true,
  });

  customResourcesDirFiles.forEach((f) => {
    const apiResource = f.name.split(".")[0];

    // for each file in each dir in the custom-resources dir (namespaced resources)
    if (f.isDirectory()) {
      const apiGroup = f.name.split(".").slice(1).join(".");

      const customResourceDirFiles = fs.readdirSync(
        path.join(customResourcesDir, f.name),
        { withFileTypes: true }
      );

      customResourceDirFiles.forEach((customResourceDirFile) => {
        if (path.extname(customResourceDirFile.name) === ".json") {
          const namespace = path.parse(customResourceDirFile.name).name;

          // TODO: refactor this so we can just pass around parsing this function for any resource file
          const resourceFile = fs.readFileSync(
            path.join(customResourcesDir, f.name, customResourceDirFile.name),
            "utf8"
          );

          const jsonObjects = JSON.parse(resourceFile);

          jsonObjects.forEach((jsonObject: any) => {
            const name = jsonObject["metadata"]["name"];
            jsonObject["metadata"]["namespace"] = namespace;

            (async () => {
              await etcdClient
                .put(
                  `/registry/${apiGroup}/${apiResource}/${namespace}/${name}`
                )
                .value(JSON.stringify(jsonObject));
            })();
          });
        }
      });
      // for each file in the custom-resources dir (cluster resources)
    } else if (!f.isDirectory() && path.extname(f.name) === ".json") {
      const apiGroup = f.name.split(".").slice(1, -1).join(".");
      const resourceFile = fs.readFileSync(
        path.join(customResourcesDir, f.name),
        "utf8"
      );

      const jsonObjects = JSON.parse(resourceFile);

      jsonObjects.forEach((jsonObject: any) => {
        const name = jsonObject["metadata"]["name"];

        (async () => {
          await etcdClient
            .put(`/registry/${apiGroup}/${apiResource}/${name}`)
            .value(JSON.stringify(jsonObject));
        })();
      });
    }
  });
};

// TODO: use Kind instead of filename?
const getKindPath = (filename: string): string => {
  let kindPath: string;

  switch (filename) {
    case "nodes":
      kindPath = "minions/";
      break;
    case "endpoints":
      kindPath = "services/endpoints/";
      break;
    case "services":
      kindPath = "services/specs/";
      break;
    case "leases":
      kindPath = "leases/kube-node-lease/";
      break;
    case "ingress":
      kindPath = "ingress/";
      break;
    case "podsecuritypolicies":
      kindPath = "podsecuritypolicy/";
      break;
    case "storage-classes":
      kindPath = "storageclasses/";
      break;
    case "namespace":
      kindPath = "namespaces/";
      break;
    case "pvs":
      kindPath = "persistentvolumes/";
      break;
    case "custom-resource-definitions":
      kindPath = "apiextensions.k8s.io/customresourcedefinitions/";
      break;
    case "pvcs":
      kindPath = "persistentvolumeclaims/";
      break;
    default:
      kindPath = `${filename}/`;
      break;
  }

  return kindPath;
};

const getKind = (filename: string): string => {
  let kind: string;

  switch (filename) {
    case "nodes":
      kind = "Node";
      break;
    case "storage-classes":
      kind = "StorageClass";
      break;
    case "namespaces":
      kind = "Namespace";
      break;
    case "pvs":
      kind = "PersistentVolume";
      break;
    case "custom-resource-definitions":
      kind = "CustomResourceDefinition";
      break;
    case "cronjobs":
      kind = "CronJob";
      break;
    case "deployments":
      kind = "Deployment";
      break;
    case "events":
      kind = "Event";
      break;
    case "ingress":
      kind = "Ingress";
      break;
    case "jobs":
      kind = "Job";
      break;
    case "limitranges":
      kind = "LimitRange";
      break;
    case "pods":
      kind = "Pod";
      break;
    case "pvcs":
      kind = "PersistentVolumeClaim";
      break;
    case "services":
      kind = "Service";
      break;
    case "statefulsets":
      kind = "StatefulSet";
      break;
    default:
      kind = filename;
      break;
  }

  return kind;
};

const getApiVersion = (kind: string): string => {
  // TODO: check case where it is possible to have multiple apiGroupVersions/apiVersions for a single kind name
  // totally possible that there will be CRs that use the same "kind name" (e.g.,  "node")
  // for CRs, we can just get the apiVersion from the object
  // however, we may have to hardcode some apiVersions for "default" resources (e.g., non-CRs)
  const apiResourceFile = fs.readFileSync(
    path.join(clusterResourcesDir, "resources.json"),
    "utf8"
  );
  const apiResourcesJson = JSON.parse(apiResourceFile);

  // TODO: maybe clean this up a bit?
  const apiVersion = (() => {
    for (let i = 0; i < apiResourcesJson.length; i++) {
      const resources = apiResourcesJson[i]["resources"];
      for (let j = 0; j < resources.length; j++) {
        if (resources[j]["kind"] === kind) {
          return apiResourcesJson[i]["groupVersion"];
        }
      }
    }
  })() as string;

  return apiVersion;
};

const up = async () => {
  await dockerNetwork();
  await etcdContainer();
  parseClusterResources();
  parseCustomResources();
  await apiServerContainer();
};

export default up;
