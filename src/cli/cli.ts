#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { parseDocx } from "../docx/parser.js";
import { classifySections } from "../analysis/sections.js";
import { runChecks, defaultRegistry } from "../rules/index.js";
import { formatText, formatJson } from "./formatter.js";

const program = new Command();

program
  .name("mtc-essay-style")
  .description("CLI tool to check style conformance and count words in .docx documents")
  .version("1.0.0")
  .argument("<files...>", "One or more .docx files to check")
  .option("-f, --format <format>", "output format: text, json", "text")
  .option("-s, --severity <level>", "minimum severity level to report: info, warning, error", "info")
  .option("--no-color", "disable colored output")
  .action(async (files: string[], options) => {
    // Handle color disablement
    if (options.color === false) {
      process.env.FORCE_COLOR = "0";
      // chalk automatically updates its internal state when FORCE_COLOR is set to '0'
    }

    const format = options.format.toLowerCase();
    const severity = options.severity.toLowerCase();

    if (format !== "text" && format !== "json") {
      console.error(chalk.red(`Error: Invalid format "${options.format}". Supported formats are "text", "json".`));
      process.exit(1);
    }

    if (severity !== "info" && severity !== "warning" && severity !== "error") {
      console.error(chalk.red(`Error: Invalid severity level "${options.severity}". Supported levels are "info", "warning", "error".`));
      process.exit(1);
    }

    let hasErrors = false;

    for (const file of files) {
      const resolvedPath = path.resolve(file);
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red(`Error: File does not exist: ${file}`));
        hasErrors = true;
        continue;
      }

      if (path.extname(resolvedPath).toLowerCase() !== ".docx") {
        console.error(chalk.red(`Error: File must have .docx extension: ${file}`));
        hasErrors = true;
        continue;
      }

      try {
        const doc = await parseDocx(resolvedPath);
        const sections = classifySections(doc);
        const result = runChecks(doc, sections, defaultRegistry);

        if (format === "json") {
          console.log(formatJson(result, resolvedPath));
        } else {
          console.log(formatText(result, resolvedPath, severity));
          console.log(""); // Empty line separator
        }
      } catch (err: any) {
        console.error(chalk.red(`Error processing file ${file}: ${err.message || err}`));
        hasErrors = true;
      }
    }

    if (hasErrors) {
      process.exit(1);
    }
  });

program.parse(process.argv);
