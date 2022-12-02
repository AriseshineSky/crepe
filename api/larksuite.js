const Token = require('../proxy/token');
const axios = require('axios');
var moment = require('moment');
const logger = require('../common/logger');
const APP = {
  app_id: 'cli_a30fa365ccb8900d',
  app_secret: '1TNnz4zetlpYLUuwBVh1IctkeUhPvjBe'
}
async function getFeishuToken() {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
      },
      url: 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      data: APP
    };

    axios(options).then(
      function(res){
        resolve(res.data);
      }
    ).catch(
      function(error){
        reject(error)
      }
    );
  })
}

async function checkTokenExpired(tokenObj) {
  if (tokenObj.token) {
    var token = JSON.parse(tokenObj.token);
    if (token.expire > moment().diff(moment(tokenObj.create_at), "seconds")) {
      return token;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

async function refreshToken(tokenObj) {
  var token = await getFeishuToken();
  Token.update(tokenObj, token);
  return token;
}

async function getToken() {
  var tokenObj = await Token.get();
  if (tokenObj) {
    var token = await checkTokenExpired(tokenObj);
    if (!token) {
      token = await refreshToken(tokenObj);
    }
  } else {
    var token = await getFeishuToken();
    Token.create(token);
  }
  return token;
}

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

// async function files() {
//   const token = await getToken();
//   const options = {
//     method: 'GET',
//     headers: { 
//       'Authorization': `Bearer ${token.app_access_token}`,
//     },
//     url: 'https://open.feishu.cn/open-apis/drive/v1/files',
//     data: {
//       folder_token: 'fldcnpG1qn4hJYwWJDRFBgtU8te'
//     }
//   };

//   axios(options).then(
//     function(res){
//       console.log(res.data.data.files);
//     }
//   ).catch(
//     function(error){
//       console.log(error)
//     }
//   );
// }
// files();

async function getSheetsInfo(token) {
  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token.app_access_token}`,
    },
    url: 'https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/metainfo'
  };

  return new Promise((resolve, reject) => {
    axios(options).then(
      function(res){
        resolve(res.data.data);
      }
    ).catch(
      function(error){
        reject(error)
      }
    );
  });
}

async function getSheetContent(sheet, token) {
  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token.app_access_token}`,
    },
    url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/values/${sheet.sheetId}!A7:P${sheet.rowCount}`
  }
  return new Promise((resolve, reject) => {
    axios(options).then(
      function(res){
        resolve(res.data);
      }
    ).catch(
      function(error){
        reject(error)
      }
    );
  });
}

async function readfilesContent() {
  const token = await getToken();
  const sheetsInfo = await getSheetsInfo(token);
  var rows = [];
  for(var sheet of sheetsInfo.sheets) {
    var content = await getSheetContent(sheet, token);
    console.log(content.data.valueRange.values);
    rows = rows.concat(content.data.valueRange.values);
  }
  logger.debug('row', rows[10]);
  return rows;
}

exports.listFreights = readfilesContent;


  