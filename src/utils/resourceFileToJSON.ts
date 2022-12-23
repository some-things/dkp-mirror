export const resourceFileToJSON = (resourceFile: any): any => {
  try {
    const json = JSON.parse(resourceFile).items || JSON.parse(resourceFile);
    return json;
  } catch (e) {
    return [];
  }
};
