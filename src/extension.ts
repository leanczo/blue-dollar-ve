import axios from "axios";
import * as vscode from "vscode";
import { StatusBarItem } from "vscode";

let myStatusBarItem: vscode.StatusBarItem;

enum StatusDollar {
  increase,
  decrement,
  equal,
}

export async function activate(context: vscode.ExtensionContext) {
  const values = await getValueDollarBlueArg();
  const valuesYesterdasy = await getValueDollarYesterday();

  let status = getStatus(values, valuesYesterdasy);
  displayInStatusBar(context, values, status);

  let disposable = vscode.commands.registerCommand(
    "blue-dollar.updatePrices",
    async () => {
      const values = await getValueDollarBlueArg();
      const valuesYesterdasy = await getValueDollarYesterday();
      let status = getStatus(values, valuesYesterdasy);
      displayInStatusBar(context, values, status);
      vscode.window.showInformationMessage(
        "Venta: $" + values?.venta + " Compra: $" + values?.compra
      );
    }
  );

  context.subscriptions.push(disposable);
  const schedule = require("node-schedule");
  schedule.scheduleJob("*/15 * * * *", async function () {
    const values = await getValueDollarBlueArg();
    const valuesYesterdasy = await getValueDollarYesterday();
    let status = getStatus(values, valuesYesterdasy);
    displayInStatusBar(context, values, status);
  });

  function getStatus(values: any, valuesYesterdasy: any) {
    const result = values?.venta - valuesYesterdasy?.venta;
    if (result > 0) {
      return StatusDollar.increase;
    } else if (result < 0) {
      return StatusDollar.decrement;
    } else {
      return StatusDollar.equal;
    }
  }
}

export function deactivate() {}

async function getValueDollarBlueArg() {
  try {
    const dataDolar = await axios.get(
      "https://api.bluelytics.com.ar/v2/latest"
    );
    const json = dataDolar.data;

    return {
      compra: json.blue.value_buy,
      venta: json.blue.value_sell,
    };
  } catch (e) {
    console.log(e);
  }
}

async function getValueDollarYesterday() {
  try {
    const dataDolar = await axios.get(
      "https://api.bluelytics.com.ar/v2/evolution.json?days=4"
    );
    const json = dataDolar.data;
    const date = new Date(new Date().setDate(new Date().getDate() - 1));
    const yesterday = convertDate(date);
    const valueYesterday = json.find(
      (x: any) => x.date === yesterday && x.source === "Blue"
    );

    return {
      compra: valueYesterday.value_buy,
      venta: valueYesterday.value_sell,
    };
  } catch (e) {
    console.log(e);
  }
}

function convertDate(input: Date) {
  var yyyy = input.getFullYear().toString();
  var mm = (input.getMonth() + 1).toString();
  var dd = input.getDate().toString();

  var mmChars = mm.split("");
  var ddChars = dd.split("");

  return (
    yyyy +
    "-" +
    (mmChars[1] ? mm : "0" + mmChars[0]) +
    "-" +
    (ddChars[1] ? dd : "0" + ddChars[0])
  );
}

function displayInStatusBar(
  context: vscode.ExtensionContext,
  valores: any,
  status: StatusDollar
) {
  var itemIndex = context.subscriptions.findIndex(
    (r) => (r as StatusBarItem).name === "sell-price"
  );

  let symbol = "";
  switch (status) {
    case StatusDollar.increase:
      symbol = "↑";
      break;
    case StatusDollar.decrement:
      symbol = "↓";
      break;
    case StatusDollar.equal:
      symbol = "";
      break;
    default:
      symbol = "";
      break;
  }

  if (itemIndex === -1) {
    myStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    myStatusBarItem.name = "sell-price";
    myStatusBarItem.text = `${symbol} $ ${valores.venta}`;
    myStatusBarItem.show();
    context.subscriptions.push(myStatusBarItem);
  } else {
    (
      context.subscriptions[itemIndex] as vscode.StatusBarItem
    ).text = `${symbol} $ ${valores.venta}`;
  }
}
