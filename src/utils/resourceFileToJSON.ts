import { readFileSync } from 'fs';
import path from 'path';
import YAML from 'yaml';

export const resourceFileToJSON = (filePath: string): object[] => {
  const content = readFileSync(filePath, { encoding: "utf-8" });

  if (path.extname(filePath) === ".json") {
    try {
      const json = JSON.parse(content).items || JSON.parse(content);
      return json;
    } catch (e) {
      console.warn(
        `warning: could not parse ${filePath} contents as JSON: ${e}`
      );
      return [];
    }
  } else if (path.extname(filePath) === ".yaml") {
    try {
      const json = YAML.parse(content).items || YAML.parse(content);
      return json;
    } catch (e) {
      console.warn(
        `warning: could not parse ${filePath} contents as YAML: ${e}`
      );
      return [];
    }
  } else {
    console.warn(
      `warning: could not parse ${filePath} contents due to unsupported file extension`
    );
    return [];
  }
};
