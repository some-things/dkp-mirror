import { currentWorkingDir } from "../utils/directories";

const extract = (
  bundleFile: string,
  outputDir: string,
  ticketId: string | undefined
) => {
  console.log(currentWorkingDir);
  console.log("Bundle file: ", bundleFile);
  console.log("Output dir: ", outputDir);
  ticketId
    ? console.log("Ticket ID: ", ticketId)
    : console.log("No ticket ID specified");
};

export default extract;
