const fs = require('fs').promises;
const path = require('path');
const process = require('process');

async function listFreights() {
  var auth = await authorize();
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1MB8djN1KHRywmw9_ZFjAD8BClowlucI-jz_x9MBfNvE',
    range: 'freight!A1:P928',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  return rows;
}
async function listFreightTypes() {
  var auth = await authorize();
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1MB8djN1KHRywmw9_ZFjAD8BClowlucI-jz_x9MBfNvE',
    range: 'freightType!A2:C5',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  return rows;
}
async function listProducts() {
  var auth = await authorize();
  const sheets = google.sheets({version: 'v4', auth});
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1MB8djN1KHRywmw9_ZFjAD8BClowlucI-jz_x9MBfNvE',
    range: 'crepe!A1:X220',
  });
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  return rows;
}

exports.listProducts = listProducts;
exports.listFreights = listFreights;
exports.listFreightTypes = listFreightTypes;