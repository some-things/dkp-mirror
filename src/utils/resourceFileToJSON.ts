import YAML from 'yaml';

export const jsonResourceFileToJSON = (resourceFile: any): any => {
  try {
    const json = JSON.parse(resourceFile).items || JSON.parse(resourceFile);
    return json;
  } catch (e) {
    return [];
  }
};

export const yamlResourceFileToJSON = (resourceFile: any): any => {
  try {
    const json = YAML.parse(resourceFile).items || YAML.parse(resourceFile);
    return json;
  } catch (e) {
    return [];
  }
};
