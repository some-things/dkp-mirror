#!/usr/bin/env bash
# set -x

# (insert_path, data)
function insert() {
  printf "etcdctl put ${1} ${2}\n"
  etcdctl put ${1} "${2}"
}

function parse_and_insert_resources() {
  API_RESOURCES_FILE=$(find data/cluster-resources -maxdepth 1 -type f -name "resources.json")
  declare -A res_directories
  for dir in $(find data/cluster-resources/ -maxdepth 1 -type d -exec basename {} + | grep -v "auth-cani-list"); do
    res_directories[$dir]=$dir
  done

  # for res_dir in "${!res_directories[@]}"; do
  #   for file in $(find data/cluster-resources/${res_dir} -type f -name "*.json" 2>/dev/null); do
  #     for res in $(jq -c '.[] | del(.metadata.managedFields)' data/cluster-resources/${res_dir}/*.json 2>/dev/null); do
  #       NAME=$(jq -r '.metadata.name' <<<"${res}")
  #       NAMESPACE=$(sed 's/\.[^.]*$//' <<<"${file##*/}")

  #       if [[ "${NAME}" != "null" ]]; then
  #         echo "Using resource dir: ${res_dir}"
  #         echo "Using file: ${file}"
  #         echo "Inserting ${res_directories[$res_dir]} object ${NAME} in namespace ${NAMESPACE}"
  #       fi

  #       # insert "/registry/${res_directories[$res_dir]}/${NAMESPACE}/${NAME}" "$(jq -r '.' "${res}")"
  #     done
  #   done
  # done

  # cluster-scoped resources
  # TODO: figure out what to do with resources.json
  # TODO: figure out what to do with custom-resource-definitions.json
  # TODO: figure out what to do with groups.json
  for res_file in $(find data/cluster-resources -maxdepth 1 -type f -name "*.json" | grep -v "resources.json\|custom-resource-definitions.json\|groups.json"); do
    # for res_file in $(find data/cluster-resources -maxdepth 1 -type f -name "*.json" | grep "nodes.json\|namespaces.json\|storage-classes.json"); do
    # TODO: evaluate if required
    # API_RESOURCE_GROUP="$(basename -a $file | cut -d '.' -f2- | sed -E 's/(.yaml|yaml|apps|certificates.k8s.io|coordination.k8s.io|^extensions$|networking.k8s.io|rbac.authorization.k8s.io|scheduling.k8s.io|storage.k8s.io)//g')"
    # API_RESOURCE_NAMESPACED="$(yq '.items[].metadata | has("namespace")' "${API_RESOURCES_DIR}/${file}" | uniq)"
    ITEM_LIST="$(jq -c '.[]' "${res_file}" | sed s/\'/\'\'/g)"
    ITEM_NAME_LIST="$(jq -r '"\(.metadata.name)"' <<<"${ITEM_LIST}")"
    ITEM_COUNT=$(wc -l <<<"${ITEM_NAME_LIST}" | xargs)

    # get the kind of resources based on file
    KIND=$(get_kind "$(basename $res_file | sed 's/\.json$//')")

    # check for well-known non-standard etcd keys
    KIND_PATH=$(get_kind_path "${KIND}")
    if [[ ${KIND_PATH} == "" ]]; then
      KIND_PATH="${KIND}/"
    fi
    if [[ ${KIND} == "resources" ]]; then
      KIND_PATH="$(jq -r '.kind' <<<"${res}" | awk '{print tolower($0)}')/"
    fi

    IS_CRD=$([[ ${res_file} == *"custom-resource-definitions"* ]] && echo "true" || echo "false")

    # API_GROUP_VERSION="v1"
    # need to build this
    # API_GROUP_VERSION="$(jq '.[] | select((.resources[].kind|ascii_downcase) == ("'"${KIND}"'"|ascii_downcase)) | .groupVersion' "${res_file}")"
    API_GROUP_VERSION=$(get_apiGroup_version "${IS_CRD}" "${KIND}" "${API_RESOURCES_FILE}")

    while [ $ITEM_COUNT -gt 0 ]; do
      ITEM_NAME="$(awk 'FNR=='$ITEM_COUNT'' <<<"${ITEM_NAME_LIST}")"
      ITEM_STATE="$(awk 'FNR=='$ITEM_COUNT'' <<<"${ITEM_LIST}")"

      # NAME=$(jq -r '.metadata.name' <<<"${res}")
      INJECTED_STATE=$(inject_apiVersion "${API_GROUP_VERSION}" "${ITEM_STATE}")

      insert "/registry/${KIND_PATH}${ITEM_NAME}" "${INJECTED_STATE}"

      ((ITEM_COUNT--))
    done

    # # for res in $(jq --raw-output -jc '.[]' $res_file | sed "s/\'/\'\'/g"); do
    # for res in $(jq --raw-output -c '.[]' $res_file | sed s/\'/\'\'/g); do
    #   echo "FFS: ${res}"
    #   KIND=$(basename $res_file | sed 's/\.json$//')
    #   # KIND=$(basename ${res_file})
    #   KIND_PATH=$(get_kind_path "${KIND}")
    #   if [[ ${KIND_PATH} == "" ]]; then
    #     KIND_PATH=$KIND
    #   fi
    #   if [[ ${KIND} == "resources" ]]; then
    #     KIND_PATH="$(jq -r '.kind' <<<"${res}" | awk '{print tolower($0)}')/"
    #   fi

    #   if [[ -n $DEBUG ]]; then
    #     echo "Resource file: ${res_file}"
    #     echo "Kind from filename: ${KIND}"
    #     echo "Kind path: ${KIND_PATH}"
    #   fi
    #   if [[ -n $DEBUG ]]; then
    #     echo "Inserting ${KIND} object ${NAME}"
    #   fi

    #   echo $res

    #   NAME=$(jq -r '.metadata.name' <<<"${res}")

    #   insert "/registry/${KIND_PATH}${NAME}" "${res}"
    # done
  done
}

function get_kind_path() {
  # json = JSON.parse(line)
  # namespace_name = json.dig('resource','data','metadata','namespace') || "unknown"
  # resource_name = json.dig('resource','data','metadata','name') || "unknown"
  # resource = json.dig('resource','data').to_json

  case "${1}" in
  "node")
    kind_path="minions/"
    ;;
  "endpoints")
    kind_path="services/endpoints/"
    ;;
  "services")
    kind_path="services/specs/"
    ;;
  "leases")
    kind_path="leases/kube-node-lease/"
    ;;
  "ingresses")
    kind_path="ingress/"
    ;;
  "podsecuritypolicies")
    kind_path="podsecuritypolicy/"
    ;;
  "storageclass")
    kind_path="storageclasses/"
    ;;
  "namespace")
    kind_path="namespaces/"
    ;;
  esac

  echo $kind_path
}

function get_kind() {
  case "$(awk '{print tolower($0)}' <<<"${1}")" in
  "nodes")
    kind="node"
    ;;
  "storage-classes")
    kind="storageclass"
    ;;
  "namespaces")
    kind="namespace"
    ;;
  *)
    kind="${1}"
    ;;
  esac

  echo "${kind}"
}

function get_apiGroup_version() {
  # TODO: check case where it is possible to have multiple apiGroupVersions/apiVersions for a single kind
  [[ "${1}" == "true" ]] && echo "crd" || (jq -r '.[] | select((.resources[].kind|ascii_downcase) == ("'"${2}"'"|ascii_downcase)) | .groupVersion' "${3}" | head -n 1)
}

function inject_apiVersion() {
  jq -c '. += {"apiVersion": "'"${1}"'"}' <<<"${2}"
}

function main() {
  parse_and_insert_resources
}

main
