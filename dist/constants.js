"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KUBECONFIG_DATA = exports.KUBECONFIG_FILE_NAME = exports.APISERVER_TOKEN_FILE_DATA = exports.APISERVER_TOKEN_FILE_NAME = exports.ARTIFACTS_DIR_NAME = exports.APISERVER_IMAGE = exports.ETCD_IMAGE = void 0;
exports.ETCD_IMAGE = "k8s.gcr.io/etcd:3.4.13-0";
exports.APISERVER_IMAGE = "k8s.gcr.io/kube-apiserver:v1.21.1";
exports.ARTIFACTS_DIR_NAME = ".dkp-mirror";
exports.APISERVER_TOKEN_FILE_NAME = "tokens.txt";
exports.APISERVER_TOKEN_FILE_DATA = `
mirror,mirror,mirror,system:masters
`;
exports.KUBECONFIG_FILE_NAME = "kubeconfig.mirror";
exports.KUBECONFIG_DATA = `
apiVersion: v1
kind: Config
current-context: mirror
clusters:
- cluster:
    server: https://localhost:6443
    insecure-skip-tls-verify: true
  name: mirror
users:
- name: mirror
  user:
    token: mirror 
contexts:
- context:
    cluster: mirror
    user: mirror
  name: mirror`;
//# sourceMappingURL=constants.js.map