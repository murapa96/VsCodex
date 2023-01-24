// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import {
  ExtensionContext,
  workspace,
  window,
  OutputChannel,
  ConfigurationChangeEvent,
  TreeView,
  commands,
} from "vscode";
import { generateKeyPair } from "crypto";
import { createEngine } from "./engine/engine";
import ConfigPanel from "./panel/configPanel";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const ENGINE = createEngine();
var provider;

//Write a function that adds two numbers

async function generate() {
  //Hace la petición de openai cortex usando el texto seleccionado como prompt.

  var prompt = "";
  var editor = vscode.window.activeTextEditor;
  //Get the language of the editor
  var language = editor.document.languageId;
  if (editor) {
    var sel = editor.selection;
    prompt = editor.document.getText(sel);
    //Add the language to the start of the prompt as a comment using the specific character.
    //Using vscode API to get the comment character for the language.

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating code...",
        cancellable: false,
      },
      () => {
        var start = new vscode.Position(sel.start.line, sel.start.character);
        var end = new vscode.Position(sel.end.line, sel.end.character);
        return ENGINE[provider._tab]
          .generate(prompt)
          .then((text) => {
            if (editor) {
              var prediction = text;
              //If is editConfig, then add the engine.getEngineOptions().instructions as a comment before the prediction
              return editor.edit((edit) => {
               if(prediction){ if(provider._tab == "insertConfig"){
                  //Replace selection with generate code.
                  console.log(prediction);
                  edit.replace(sel, prediction);
                }else{
                  //Insert code after selection.
                  edit.insert(end.isAfter(start) ? end : start, prediction);
                }}
              });
            } else {
              return true;
            }
          })
          .then(
            () => {
              return setTimeout(() => {
                if (editor) {
                  sel = editor.selection;
                  return (editor.selection = new vscode.Selection(
                    end.isAfter(start) ? end : start,
                    sel.end
                  ));
                }
              }, 1);
            },
            (err) => {
              //console.log("Error " + err.message);
            }
          );
      }
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  //console.log('Congratulations, your extension "vscodex" is now active!');

  provider = new ConfigPanel(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ConfigPanel.viewType, provider)
  );

  var generateEngineString = vscode.workspace
    .getConfiguration("vscodex")
    .get<string>("generateEngineConfig");
  if (generateEngineString) {
    ENGINE["generateConfig"].setEngineOptions(JSON.parse(generateEngineString));
  }

  var insertEngineString = vscode.workspace
    .getConfiguration("vscodex")
    .get<string>("insertEngineConfig");
  if (insertEngineString) {
    ENGINE["insertConfig"].setEngineOptions(JSON.parse(insertEngineString));
  }

  var editEngineString = vscode.workspace
    .getConfiguration("vscodex")
    .get<string>("editEngineConfig");
  if (editEngineString) {
    ENGINE["editConfig"].setEngineOptions(JSON.parse(editEngineString));
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodex.generateFromOpenAi", () => {
      generate();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodex.setOpenaiKey", async () => {
      // 1) Getting the openaiKey
      const openaiKey = await vscode.window.showInputBox({
        placeHolder: "Enter the openai key",
      });

      vscode.workspace
        .getConfiguration("vscodex")
        .update("openaiKey", openaiKey, vscode.ConfigurationTarget.Global);
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
