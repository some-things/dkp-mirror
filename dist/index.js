#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const down_1 = __importDefault(require("./down/down"));
const extract_1 = __importDefault(require("./extract/extract"));
const up_1 = __importDefault(require("./up/up"));
const directories_1 = require("./utils/directories");
const program = new commander_1.Command();
program
    .name("dkp-mirror")
    .description("Mirror your DKP cluster from diagnostic bundle data")
    .version("0.0.1");
program
    .command("extract")
    .description("Extract diagnostic bundle data from a DKP diagnostic bundle")
    .argument("<bundle-file>", "Diagnostic bundle to extract")
    .option("-o, --output-dir [output-dir]", "Output directory", `${directories_1.defaultExtractBundleDirectory}`)
    .option("-t, --ticket-id [ticket-id]", "Ticket ID")
    .action((bundle, { outputDir, ticketId }) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, extract_1.default)(bundle, outputDir, ticketId);
}));
program
    .command("up")
    .description("Start the DKP mirror")
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, up_1.default)();
}));
program
    .command("down")
    .description("Shutdown the DKP mirror")
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, down_1.default)();
}));
program.parse();
//# sourceMappingURL=index.js.map