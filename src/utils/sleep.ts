const sleep = (ms: number) => {
  return new Promise<void>((resolve) => {
    console.log(`Sleeping for ${ms} milliseconds...`);
    setTimeout(resolve, ms);
  });
};

export default sleep;
