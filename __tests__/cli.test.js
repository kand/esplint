const cli = require("../lib/cli");
const { run } = require("../lib/engine");
const log = require("../lib/log");
const stripAnsi = require("strip-ansi");

jest.mock("../lib/engine");
jest.mock("../lib/log");
process.exit = jest.fn();

beforeEach(() => {
  run.mockReset();
  run.mockImplementation(() => ({
    results: [],
    hasError: false
  }));

  process.exit.mockReset();
  log.error.mockReset();
  log.log.mockReset();
  log.warn.mockReset();
});

it("should pass files to engine", () => {
  cli(["foo.js", "bar/baz.js"]);

  expect(run).toHaveBeenCalledWith(expect.anything(), ["foo.js", "bar/baz.js"]);
});

it("should pass default options to engine", () => {
  cli([]);

  expect(run).toHaveBeenCalledWith(
    { write: true, overwrite: false },
    expect.anything()
  );
});

it("should pass --no-write option to engine", () => {
  cli(["--no-write"]);

  expect(run.mock.calls[0][0].write).toEqual(false);
});

it("should pass --overwrite option to engine", () => {
  cli(["--overwrite"]);

  expect(run.mock.calls[0][0].overwrite).toEqual(true);
});

it("should print exception and exit with error code", () => {
  const error = new Error("this is an error");
  run.mockImplementation(() => {
    throw error;
  });
  cli([]);

  expect(log.error).toHaveBeenCalledWith(error);
  expect(process.exit).toHaveBeenCalledWith(1);
});

it("should print tip and exit with error code if there was an error", () => {
  run.mockReturnValue({
    results: [],
    hasError: true
  });
  cli([]);

  expect(stripAnsi(log.log.mock.calls[0][0]).trim()).toEqual(
    "Use the --overwrite flag to ignore these errors and force the record to be rewritten."
  );
  expect(process.exit).toHaveBeenCalledWith(1);
});

it("should show success message if no errors", () => {
  run.mockReturnValue({
    results: [],
    hasError: false
  });
  cli([]);

  expect(log.log).toHaveBeenCalledWith(log.createSuccess("Looking good!"));
});

it("should properly log the results", () => {
  run.mockReturnValue({
    results: [
      {
        type: "error",
        message: "this is an error"
      },
      {
        type: "warning",
        message: "this is an warning"
      },
      {
        type: "info",
        message: "this is info"
      }
    ],
    hasError: true
  });

  cli([]);

  expect(log.error).toHaveBeenCalledWith(log.createError("this is an error"));
  expect(log.warn).toHaveBeenCalledWith(
    log.createWarning("this is an warning")
  );
  expect(log.log).toHaveBeenCalledWith("this is info");
});