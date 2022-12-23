import { readdirSync, readFileSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join, parse } from 'path';

import { APISERVER_TOKEN_FILE_DATA, APISERVER_TOKEN_FILE_NAME, ARTIFACTS_DIR_NAME, KUBECONFIG_FILE_DATA, KUBECONFIG_FILE_NAME } from '../constants';
import { currentWorkingDir, getClusterResourcesDir, getCustomResourcesDir } from '../utils/directories';
import apiServerContainer from '../utils/docker/apiServer';
import etcdContainer from '../utils/docker/etcd';
import dockerNetwork from '../utils/docker/network';
import etcdClient from '../utils/etcd/client';
import { jsonResourceFileToJSON, yamlResourceFileToJSON } from '../utils/resourceFileToJSON';

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
  // NOTE: limitranges untested
  "limitranges",
  "pods",
  "pvcs",
  "services",
  "statefulsets",
];

// TODO: too much repeated code... refactor this so we can just pass around parsing this for any resource
const parseClusterResources = () => {
  const clusterResourcesDirFiles = readdirSync(getClusterResourcesDir(), {
    withFileTypes: true,
  }) // filter out custom-resources dir
    .filter((f) => f.name != "custom-resources");

  // for each file in the cluster-resources dir
  clusterResourcesDirFiles.forEach((f) => {
    const fileBasename = parse(f.name).name;
    const kind = getKind(fileBasename);
    const kindPath = getKindPath(fileBasename);

    // for each directory in the cluster-resources dir
    if (
      f.isDirectory() &&
      defaultNamespacedResourceDirsToParse.includes(f.name)
    ) {
      const clusterResourcesDirDirs = readdirSync(
        join(getClusterResourcesDir(), f.name),
        { withFileTypes: true }
      );
      // for each file in each dir in the cluster-resources dir (namespaced resources)
      clusterResourcesDirDirs.forEach((clusterResourcesDirDirsFile) => {
        if (
          extname(clusterResourcesDirDirsFile.name) === (".json" || ".yaml") &&
          !clusterResourcesDirDirsFile.name.includes("-errors")
        ) {
          const namespace = parse(clusterResourcesDirDirsFile.name).name;

          const resourceFile = readFileSync(
            join(
              getClusterResourcesDir(),
              f.name,
              clusterResourcesDirDirsFile.name
            ),
            "utf8"
          );

          const jsonObjects =
            extname(clusterResourcesDirDirsFile.name) === ".yaml"
              ? yamlResourceFileToJSON(resourceFile)
              : jsonResourceFileToJSON(resourceFile);

          jsonObjects.forEach((jsonObject: any) => {
            const name = jsonObject["metadata"]["name"];
            jsonObject["metadata"]["namespace"] = namespace;
            jsonObject["kind"] = kind;
            (async () => {
              await etcdClient
                .put(`/registry/${kindPath}${namespace}/${name}`)
                .value(JSON.stringify(jsonObject));
            })();
          });
        }
      });
      // for each file in the cluster-resources dir (cluster resources)
    } else if (
      f.isFile() &&
      defaultClusterResourceFilesToParse.includes(f.name) &&
      extname(f.name) === (".json" || ".yaml") &&
      !f.name.includes("-errors")
    ) {
      const resourceFile = readFileSync(
        join(join(getClusterResourcesDir(), f.name)),
        "utf8"
      );

      const jsonObjects =
        extname(f.name) === ".yaml"
          ? yamlResourceFileToJSON(resourceFile)
          : jsonResourceFileToJSON(resourceFile);

      jsonObjects.forEach((jsonObject: any) => {
        const name = jsonObject["metadata"]["name"];
        jsonObject["kind"] = kind;

        // TODO: Investigate better options
        // TODO: Might need to fix some escaping in the CRD text
        if (kind == "CustomResourceDefinition") {
          const apiVersion = getApiVersion(kind);
          jsonObject["apiVersion"] = apiVersion;
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
  // if there are no custom resources, return
  if (getCustomResourcesDir() === "") {
    return;
  }

  const customResourcesDirFiles = readdirSync(getCustomResourcesDir(), {
    withFileTypes: true,
  });

  customResourcesDirFiles.forEach((f) => {
    const apiResource = f.name.split(".")[0];

    // for each file in each dir in the custom-resources dir (namespaced resources)
    if (f.isDirectory()) {
      const apiGroup = f.name.split(".").slice(1).join(".");

      const customResourceDirFiles = readdirSync(
        join(getCustomResourcesDir(), f.name),
        { withFileTypes: true }
      );

      customResourceDirFiles.forEach((customResourceDirFile) => {
        if (
          extname(customResourceDirFile.name) === (".json" || ".yaml") ||
          (".yaml" && !customResourceDirFile.name.includes("-errors"))
        ) {
          const namespace = parse(customResourceDirFile.name).name;

          const resourceFile = readFileSync(
            join(getCustomResourcesDir(), f.name, customResourceDirFile.name),
            "utf8"
          );

          const jsonObjects =
            extname(customResourceDirFile.name) === ".yaml"
              ? yamlResourceFileToJSON(resourceFile)
              : jsonResourceFileToJSON(resourceFile);

          jsonObjects.forEach(async (yamlObject: any) => {
            const name = yamlObject["metadata"]["name"];
            yamlObject["metadata"]["namespace"] = namespace;

            await etcdClient
              .put(`/registry/${apiGroup}/${apiResource}/${namespace}/${name}`)
              .value(JSON.stringify(yamlObject));
          });
        }
      });
      // for each file in the custom-resources dir (cluster resources)
    } else if (
      f.isFile() &&
      extname(f.name) === (".json" || ".yaml") &&
      !f.name.includes("-errors")
    ) {
      const apiGroup = f.name.split(".").slice(1, -1).join(".");
      const resourceFile = readFileSync(
        join(getCustomResourcesDir(), f.name),
        "utf8"
      );

      const jsonObjects =
        extname(f.name) === ".yaml"
          ? yamlResourceFileToJSON(resourceFile)
          : jsonResourceFileToJSON(resourceFile);

      jsonObjects.forEach((yamlObject: any) => {
        const name = yamlObject["metadata"]["name"];

        (async () => {
          await etcdClient
            .put(`/registry/${apiGroup}/${apiResource}/${name}`)
            .value(JSON.stringify(yamlObject));
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
  const apiResourceFile = readFileSync(
    join(getClusterResourcesDir(), "resources.json"),
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

const createArtifactsDir = async () => {
  console.log("Creating artifacts directory");
  await mkdir(join(currentWorkingDir, ARTIFACTS_DIR_NAME));
};

const writeApiserverTokenFile = async () => {
  console.log("Writing kube-apiserver token file");
  await writeFile(
    join(currentWorkingDir, ARTIFACTS_DIR_NAME, APISERVER_TOKEN_FILE_NAME),
    APISERVER_TOKEN_FILE_DATA
  );
};

const writeKubeconfig = async () => {
  console.log("Writing kubeconfig");
  await writeFile(
    join(currentWorkingDir, ARTIFACTS_DIR_NAME, KUBECONFIG_FILE_NAME),
    KUBECONFIG_FILE_DATA
  );
};

const up = async () => {
  console.log("Starting DKP mirror!");
  await dockerNetwork();
  await etcdContainer();
  parseClusterResources();
  parseCustomResources();
  await createArtifactsDir();
  await writeApiserverTokenFile();
  await apiServerContainer();
  await writeKubeconfig();
  console.log("Successfully started DKP mirror!");
  console.log(`
    To access the DKP mirror, execute:
    export KUBECONFIG=${join(
      currentWorkingDir,
      ARTIFACTS_DIR_NAME,
      KUBECONFIG_FILE_NAME
    )}`);
};

export default up;
