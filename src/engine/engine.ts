import axios from "axios";
import * as vscode from "vscode";

const https = require("https");
var generateEngine;
var insertEngine;
var editEngine;

var engine = {
  generateConfig: generateEngine,
  editConfig: editEngine,
  insertConfig: insertEngine,
};

export type EngineOptions = {
  temperature: number;
  max_tokens?: number;
  stopSequence?: string[];
  top_p: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  model: string;
  transformInstructions?: string;
};

export interface EngineInterface {
  generate(prompt: string): Promise<string>;
  getModels();
  setEngineOptions(engineOptions: EngineOptions);
  getEngineOptions(): EngineOptions;
}

export class GenerateEngine implements EngineInterface {
  //Las opciones de la petición
  private models: Array<Object> = [];
  private engineOptions: EngineOptions = {
    temperature: 0.5,
    max_tokens: 100,
    stopSequence: [],
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    model: "code-davinci-002",
  };
  public modelPromise: Promise<any>;

  getModels() {
    return this.models;
  }

  setModels(models: Array<Object>) {
    this.models = models;
  }

  constructor(options?: EngineOptions, models?: Array<Object>) {
    if (options) {
      this.setEngineOptions(options);
    }
    if (models) {
      this.models = models;
    }
  }

  generate(prompt: string): Promise<string> {
    //Hace la petición de openai cortex usando el texto seleccionado como prompt.

    const options = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization:
          "Bearer " +
          vscode.workspace.getConfiguration("vscodex").get<string>("openaiKey"),
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };
    var body = {
      model: this.engineOptions.model,
      prompt: prompt,
      temperature: this.engineOptions.temperature,
      max_tokens: this.engineOptions.max_tokens,
      top_p: this.engineOptions.top_p,
      frequency_penalty: this.engineOptions.frequency_penalty,
      presence_penalty: this.engineOptions.presence_penalty,
    };

    if (this.engineOptions.stopSequence.length > 0 && this.engineOptions.stopSequence[0]!="") {
      //console.log("STOOOOOOP");
      body["stop"] = this.engineOptions.stopSequence;
    }

    return axios
      .post(`https://api.openai.com/v1/completions`, body, options)
      .then(
        (data) => {
          //console.log(data.data);
          return data?.data?.choices[0]?.text;
        },
        (err) => {
          vscode.window.showErrorMessage(err);
          return "";
        }
      );
  }

  setEngineOptions(engineOptions: EngineOptions) {
    this.engineOptions = engineOptions;
    return vscode.workspace
      .getConfiguration("vscodex")
      .update(
        "generateEngineConfig",
        JSON.stringify(this.engineOptions),
        vscode.ConfigurationTarget.Global
      );
  }

  getEngineOptions() {
    return this.engineOptions;
  }
}

export class InsertEngine implements EngineInterface {
  //Las opciones de la petición
  private models: Array<Object> = [];
  public modelPromise: Promise<any>;
  private engineOptions: EngineOptions = {
    temperature: 0,
    max_tokens: 100,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    model: "code-davinci-002",
  };

  getModels() {
    if (this.models) return this.models;
    //Await for models.
    else return [];
  }

  setModels(models: Array<Object>) {
    this.models = models;
  }

  constructor(options?: EngineOptions, models?: Array<Object>) {
    if (options) {
      this.engineOptions = options;
    }
    if (models) {
      this.models = models;
    }
  }

  generate(prompt: string): Promise<string> {
    //Hace la petición de openai cortex usando el texto seleccionado como prompt.
    /*   curl https://api.openai.com/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
  "model": "code-davinci-002",
  "prompt": "",
  "temperature": 0,
  "max_tokens": 256,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
}' */

    const options = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization:
          "Bearer " +
          vscode.workspace.getConfiguration("vscodex").get<string>("openaiKey"),
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };

    //We find [insert] or [INSERT], if it exists, we replace split the prompt and insert the generated text in the middle.
    //if there is no [insert] or [INSERT], or more than one, give an error.
    var insertIndex = prompt.search(/\[insert\]/i);
    if (insertIndex === -1) {
      vscode.window.showErrorMessage(
        "No [insert] or [INSERT] found in the prompt."
      );
      return Promise.resolve("");
    }
    //Check if is more than one [insert] tags using match regex
    var insertTags = prompt.match(/\[insert\]/gi);
    if (insertTags.length > 1) {
      vscode.window.showErrorMessage(
        "More than one [insert] or [INSERT] found in the prompt."
      );
      return Promise.resolve("");
    }

    //We prepare the prompt and the suffix.
    var prompt1 = prompt.substring(0, insertIndex) + "\n";
    var suffix =  "\n" + prompt.substring(insertIndex + 8);

    //console.log(prompt1);
    //console.log(suffix);

    var body = {
      model: this.engineOptions.model,
      prompt: prompt1,
      suffix: suffix,
      temperature: this.engineOptions.temperature,
      max_tokens: this.engineOptions.max_tokens,
      top_p: this.engineOptions.top_p,
      frequency_penalty: this.engineOptions.frequency_penalty,
      presence_penalty: this.engineOptions.presence_penalty,
    };

    if (this.engineOptions.stopSequence.length > 0 && this.engineOptions.stopSequence[0]!="") {
      body["stop"] = this.engineOptions.stopSequence;
    }

    return axios
      .post(`https://api.openai.com/v1/completions`, body, options)
      .then(
        (data) => {
          //console.log(data);
          return prompt1 + data?.data?.choices[0]?.text + suffix;
        },
        (err) => {
          vscode.window.showErrorMessage(err);
          return "";
        }
      ).catch((err) => {
        vscode.window.showErrorMessage(err);
        return "";
      });
  }

  setEngineOptions(engineOptions: EngineOptions) {
    this.engineOptions = engineOptions;
    return vscode.workspace
      .getConfiguration("vscodex")
      .update(
        "insertEngineConfig",
        JSON.stringify(this.engineOptions),
        vscode.ConfigurationTarget.Global
      );
  }

  getEngineOptions() {
    return this.engineOptions;
  }
}

export class EditEngine implements EngineInterface {
  //Las opciones de la petición
  private models: Array<Object> = [];
  public modelPromise: Promise<any>;
  private engineOptions: EngineOptions = {
    temperature: 0,
    top_p: 1,
    model: "code-davinci-edit-001",
    transformInstructions: "",
    stopSequence: [],
  };

  getModels() {
    return this.models;
  }

  setModels(models: Array<Object>) {
    this.models = models;
  }

  constructor(options?: EngineOptions, models?: Array<Object>) {
    if (options) {
      this.engineOptions = options;
    }
    if (models) {
      this.models = models;
    }
  }

  generate(prompt: string): Promise<string> {
    const options = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization:
          "Bearer " +
          vscode.workspace.getConfiguration("vscodex").get<string>("openaiKey"),
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    };
    var body = {
      model: this.engineOptions.model,
      input: prompt,
      instruction: this.engineOptions.transformInstructions,
      temperature: this.engineOptions.temperature,
      top_p: this.engineOptions.top_p,
    };
    //if stopsquence is not an empty array, then add it to the body.
    if (this.engineOptions.stopSequence.length > 0 && this.engineOptions.stopSequence[0] != "") {
      body["stop"] = this.engineOptions.stopSequence;
    }

    return axios.post(`https://api.openai.com/v1/edits`, body, options).then(
      (data) => {
        return "\n\n" + data?.data?.choices[0]?.text;
      },
      (err) => {
        vscode.window.showErrorMessage(err);
        return "";
      }
    );
  }


  setEngineOptions(engineOptions: EngineOptions) {
    this.engineOptions = engineOptions;
    return vscode.workspace
      .getConfiguration("vscodex")
      .update(
        "editEngineConfig",
        JSON.stringify(this.engineOptions),
        vscode.ConfigurationTarget.Global
      );
  }

  getEngineOptions() {
    return this.engineOptions;
  }
}


export function createEngine(
  generateEngineOptions?: EngineOptions,
  insertEngineOptions?: EngineOptions,
  editEngineOptions?: EngineOptions
) {
  const options = {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Content-Type": "application/json",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization:
        "Bearer " +
        vscode.workspace.getConfiguration("vscodex").get<string>("openaiKey"),
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  };
  generateEngine = generateEngine || new GenerateEngine(generateEngineOptions);
  editEngine = editEngine || new EditEngine(editEngineOptions);
  insertEngine = insertEngine || new InsertEngine(insertEngineOptions);

  if (!generateEngine.modelPRomise) {
    generateEngine.modelPromise = axios
      .get(`https://api.openai.com/v1/models`, options)
      .then(
        (response) => {
          const models = response.data.data.reduce((acc, item) => {
            if (item.id.includes("code")) {
              ////console.log("ITEM", item);
              acc.push({
                id: item.id,
                name: item.id.split("-").join(" ").toUpperCase(),
              });
            }
            return acc;
          }, []);
          if (generateEngine) {
            generateEngine.setModels(
              models.reduce((acc, item) => {
                if (
                  item.id.includes("code") &&
                  !item.id.includes("edit") &&
                  !item.id.includes("search")
                ) {
                  ////console.log("ITEM", item);
                  acc.push({
                    id: item.id,
                    name: item.id.split("-").join(" ").toUpperCase(),
                  });
                }
                return acc;
              }, [])
            );
          }

          if (editEngine) {
            editEngine.setModels(
              models.reduce((acc, item) => {
                if (
                  item.id.includes("code") &&
                  item.id.includes("edit") &&
                  !item.id.includes("search")
                ) {
                  //console.log("ITEM", item);
                  acc.push({
                    id: item.id,
                    name: item.id.split("-").join(" ").toUpperCase(),
                  });
                }
                return acc;
              }, [])
            );
          }
          if (insertEngine) {
            insertEngine.setModels(
              models.reduce((acc, item) => {
                if (
                  item.id.includes("code") &&
                  item.id.includes("002") &&
                  !item.id.includes("edit") &&
                  !item.id.includes("search")
                ) {
                  acc.push({
                    id: item.id,
                    name: item.id.split("-").join(" ").toUpperCase(),
                  });
                }
                return acc;
              }, [])
            );
          }
        },
        (err) => {
          vscode.window.showErrorMessage(err);
          return [];
        }
      );
    editEngine.modelPromise = generateEngine.modelPromise;
    insertEngine.modelPromise = generateEngine.modelPromise;
  }

  engine = {
    generateConfig: generateEngine,
    editConfig: editEngine,
    insertConfig: insertEngine,
  };
  return engine;
}
