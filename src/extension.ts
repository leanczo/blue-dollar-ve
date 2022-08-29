// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import axios from "axios";
import * as vscode from "vscode";
import { StatusBarItem } from "vscode";
import { xml2json } from "xml-js";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let myStatusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  const values = await getValueDollarBlueArg();
  displayInStatusBar(context, values);

  let disposable = vscode.commands.registerCommand(
    "blue-dollar.updatePrices",
    () => {
      vscode.window.showInformationMessage(
        "Venta: $" + values?.venta + " Compra: $" + values?.compra
      );
    }
  );
  context.subscriptions.push(disposable);
  const schedule = require("node-schedule");
  schedule.scheduleJob("*/15 * * * *", async function () {
    const values = await getValueDollarBlueArg();
    displayInStatusBar(context, values);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function getValueDollarBlueArg() {
  try {
    const dataDolar = await axios.get(
      "https://www.dolarsi.com/api/dolarSiInfo.xml"
    );
    const json = xml2json(dataDolar.data, { compact: true, spaces: 4 });
    const jsonParsed = JSON.parse(json);

    return {
      compra: format(jsonParsed.cotiza.Dolar.casa380.compra._text, 2),
      venta: format(jsonParsed.cotiza.Dolar.casa380.venta._text, 2),
    };
  } catch (e) {
    console.log(e);
  }
}

function format(value: any, decimalPlaces: any) {
  let decimals = decimalPlaces || 2;
  let convertedValue = parseFloat(value.replace(".", "").replace(",", "."));
  return !isNaN(convertedValue)
    ? convertedValue.toFixed(decimals)
    : "No cotiza";
}

function displayInStatusBar(context: vscode.ExtensionContext, valores: any) {
  if (
    !context.subscriptions.find(
      (r) => (r as StatusBarItem).name === "sell-price"
    )
  ) {
    myStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    myStatusBarItem.name = "sell-price";
    myStatusBarItem.text = `$ ${valores.venta}`;
    myStatusBarItem.show();
    context.subscriptions.push(myStatusBarItem);
  }
}
