const { GoogleSpreadsheet } = require('google-spreadsheet');
const { OAuth2Client } = require('google-auth-library');
const doc = new GoogleSpreadsheet('1MB8djN1KHRywmw9_ZFjAD8BClowlucI-jz_x9MBfNvE');


const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */

async function find(asin, sheet) {
  const rows = await sheet.getRows(); // can pass in { limit, offset }

  for (var i = 0; i < 200; i++ ) {
    if (rows[i].ASIN && rows[i].ASIN.trim() === asin.trim()) {
      return i + 2;
    }
  }
}
async function create(title) {
  const {GoogleAuth} = require('google-auth-library');
  const {google} = require('googleapis');
  var auth = await authorize();
  
  const service = google.sheets({version: 'v4', auth});
  const resource = {
    properties: {
      title,
    },
  };
  try {
    const spreadsheet = await service.spreadsheets.create({
      resource,
      fields: '1MB8djN1KHRywmw9_ZFjAD8BClowlucI-jz_x9MBfNvE',
    });
    console.log(`Spreadsheet ID: ${spreadsheet.data.spreadsheetId}`);
    return spreadsheet.data.spreadsheetId;
  } catch (err) {
    // TODO (developer) - Handle exception
    throw err;
  }
}

async function findOrCreate(name) {
  var auth = await authorize();
  doc.useOAuth2Client(auth);
  await doc.loadInfo(); 
  console.log(doc.title);
  var sheet = doc.sheetsByTitle[name]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]
  if (!sheet) {
    sheet = await doc.addSheet({ title: name });
    // var headerValues = ["PM", "ASIN",	"country", "AVAILABLE",	"reservedFCTransfer", "inboundShipped", "Daily sales", "AVAILABLE DAYS LEFT", "TOTAL DAYS LEFT", "老铁初步检查结果", "PM复查结果及反馈原因", "DEV排查原因"];
    // await sheet.setHeaderRow(headerValues, 1);
    
  }
  return sheet;
}

async function setHeader(sheet, row) {
  if (sheet) {
    await sheet.setHeaderRow(row, 1);
  }
  return sheet;
}

async function append(sheet, row) {
  if (sheet) {
    await sheet.addRow(row);
  }
  return sheet;
}
exports.findOrCreate = findOrCreate;
exports.append = append;
exports.setHeader = setHeader;
