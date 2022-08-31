import axios from "axios";
import * as vscode from "vscode";
import { StatusBarItem } from "vscode";
import { xml2json } from "xml-js";

let myStatusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  const values = await getValueDollarBlueArg();
  displayInStatusBar(context, values);

  let disposable = vscode.commands.registerCommand(
    "blue-dollar.updatePrices",
    async () => {
      const values = await getValueDollarBlueArg();
      displayInStatusBar(context, values);
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

function uniqueNumber(maxVal: number, numbersArray: number[]) {
  const number = Math.floor(Math.random() * maxVal + 1);
  if (!numbersArray.includes(number)) {
    numbersArray.push(number);
    return number;
  } else if (numbersArray.length - 1 !== maxVal) {
    uniqueNumber(maxVal, numbersArray);
  }
}

function displayInStatusBar(context: vscode.ExtensionContext, valores: any) {
  var itemIndex = context.subscriptions.findIndex(
    (r) => (r as StatusBarItem).name === "sell-price"
  );

  if (itemIndex === -1) {
    myStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    myStatusBarItem.name = "sell-price";
    myStatusBarItem.text = `$ ${valores.venta}`;
    myStatusBarItem.show();
    context.subscriptions.push(myStatusBarItem);
  } else {
    (
      context.subscriptions[itemIndex] as vscode.StatusBarItem
    ).text = `$ ${valores.venta}`;
  }
}
