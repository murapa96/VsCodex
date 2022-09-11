import * as path from "path";
import * as vscode from "vscode";
import { tools } from "../helper";
import {
  ExtensionContext,
  workspace,
  window,
  OutputChannel,
  ConfigurationChangeEvent,
  TreeView,
  commands,
} from "vscode";
import { createEngine } from "../engine/engine";
import { throws } from "assert";
import { systemDefaultPlatform } from "vscode-test/out/util";
import * as fs from "fs";

const engine = createEngine();

export default class ConfigPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscodex.configView";
  public _tab: string = "generateConfig";
  private _view?: vscode.WebviewView;

  private scriptUri;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    this.updatePanel();
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.updatePanel();
      }
    });

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.command) {
        case "submit": {
          engine[this._tab].setEngineOptions(data.value);     
          break;
        }
        case "change_mode": {
          this._tab = data.value;
          this.updatePanel();
          break;
        }
      }
    });
  }

  updatePanel() {
    this._getHtmlForWebview(this._view.webview).then((html) => {
      this._view.webview.html = html;
    });
  }

  getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }



private async _getHtmlForWebview(webview: vscode.Webview) {
  // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
  this.scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
  );
  // Get the local path to the stylesheet for the webview.
  const stylesheetUri = webview.asWebviewUri(
    vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
  );

  if (!engine[this._tab].getModels().length) {
    await engine[this._tab].modelPromise;
  }

  var modelOptions = engine[this._tab].getModels().reduce((acc, model) => {
    //Check if the option should be selected.
    var selected = engine[this._tab].getEngineOptions().model === model.id;
    acc += `<option class="item-select-option" value="${model.id}" ${selected ? "selected" : ""}>${
      model.name
    }</option>`;
    return acc;
  }, "");

  return eval(
    "`" +
      fs.readFileSync(
        vscode.Uri.joinPath(this._extensionUri, "media", this._tab + ".html")
          .fsPath,
        "utf8"
      ) +
      "`"
  );
}

}
