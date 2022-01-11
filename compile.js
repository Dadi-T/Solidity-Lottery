const path = require("path");
const fs = require("fs");
const solc = require("solc");

const name = "Lottery";

const getPath = (name) => {
  return path.resolve(__dirname, "contracts", `${name}.sol`);
};

const source = fs.readFileSync(getPath(name), "utf-8");

module.exports = solc.compile(source, 1).contracts[`:${name}`];
