# Cirrus

An online judge, made by competitive programmers, for competitive programmers.

Built on top of the [isolate](https://github.com/ioi/isolate) sandbox for secure program execution, presented at the [IOI conference](http://mj.ucw.cz/papers/isolate.pdf). Server built with NodeJS and the Express framework.

## Benefits

- Lightweight. Problem data is cached to avoid any overhead.
- Simple. Convention over configuration. Sane defaults are chosen - usable out of the box.
- Customizable. Dynamic grading through an easy to use interface.

## Problem Data

Problem data in seperated into input and output files, with their corresponding extensions `config.inExt` and `config.outExt`. Input files represent the input data for a given problem, while output files represent the **expected** output.

Each input file should have a corresponding output file. For example, `name.in` would correspond to `name.out`. Similarly, `1.in` would correspond to `1.out`. Conventionally, test case names start from 0 and increment upwards.

## Graders

There are two provided graders.

### default

The default grader is nice and will ignore minor formatting errors defined as trailing whitespace and extra newlines.

### strict

The strict grader performs a byte by byte comparison of the contestant's output and the expected output, producing `WA` if there is any difference.

### Adding Your Own

The graders are located in folders corresponding to their name under `config.graderDir`. You will need to specify an additional `config.json` that describes how to setup your grader.

| Name | Meaning | Required |
| --- | --- | --- |
| prepare | This command is run to initialize the grader. For example, compilation. | No |
| cmd | The command to run the grader | Yes |
| args | Any arguments to pass to the grader | No |

All commands are run with the respective grader directory as the current working directory (e.g. `graders/default`).

Graders take in three environmental variables.

| Name | Meaning |
| --- | --- |
| INPUT_PATH | A path to the input data file |
| ANSWER_PATH | A path to the answer data file |
| RUN_CMD | A command used to run the contestant's program. e.g. `"/tmp/a.out"` |

All contestant programs will take in input from stdin, and output to stdout. The judge is responsible for writing a status code to it's stdout. Note: The entire stdout will be returned.

## API

### GET `/langs`

#### Returns

An JSON object with availble languages as keys. A language is a valid option if and only if it appears as a key.

```json
{
  "c": {
    "compile": {
      "cmd": "gcc",
      "opts": [
        "-std=c11",
        ...
      ]
    },
    "out": "a.o"
  },
  "java": {
    ...
  },
  ...
}
```

### GET `/graders`

#### Returns

An array of strings under the key `graders`, representing the valid graders.

```json
{
  graders: ["default","strict"]
}
```

### POST `/run`

#### Parameters

| Name | Meaning | Required |
| --- | --- | --- |
| lang | The language of the program | Yes |
| source | The source code of the program | Yes |
| filename | The filename of the program. The source will be saved to a file with this name before compilation | Yes |
| grader | A grader to evaluate the program. Valid choices are found at `/graders`. If no grader is specified, stdout will be returned instead | No |
| testsuite | The name of the testsuite to use. Defaults to "global" | No |
| tests | The tests under `testsuite` to run. If none specified, all the tests under `testsuite` will be run | No |
| compileOpts | Isolate options for compiling | No |
| executeOpts | Isolate options for running | No |

##### Isolate Options

| Name | Meaning | Required |
| --- | --- | --- |
| time | The maximum runtime of the program | No |
| wallTime | The maximum walltime. This clock does not stop when the program has lost the CPU or when it is waiting for an external event | No |
| mem | The maximum memory used by the program. Measured in KB. | No |

Compile and execute defaults are specified under `config.compileDefaults` and `config.executeDefaults` respectively.

```json
{
  "lang": "c",
  "filename": "a.c",
  "source": "...",
  "compileOpts": {
    "time": 1
  },
  "executeOpts": {
    "time": 1,
    "wallTime": 10
  },
  "grader": "default",
  "testsuite": "global"
}
```

#### Returns

An array of objects representing the results of grading. Each object contains the name of the testcase. If a grader is specified, only a status is returned. Otherwise, stdout and stderr are returned.

##### Graded Example

```json
[
  {
    "name": "0",
    "status": "AC",
    "err": null
  },
  {
    "name": "1",
    "status": "AC",
    "err": null
  },
  ...
]
```

##### Ungraded Example

```json
[
  {
    "name": "0",
    "stderr": "",
    "stdout": "12",
    "err": null
  },
  {
    "name": "1",
    "stderr": "",
    "stdout": "910",
    "err": null
  },
  ...
]
```
