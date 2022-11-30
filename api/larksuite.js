const lark = require('@larksuiteoapi/node-sdk');
const client = new lark.Client({
  appId: 'cli_a30fa365ccb8900d',
  appSecret: '1TNnz4zetlpYLUuwBVh1IctkeUhPvjBe'
});
var token = {
  app_access_token: 't-g104bube2DE5LVTAIUREHOPFP6SZOAOZKASMWR5X',
  code: 0,
  expire: 4085,
  msg: 'ok',
  tenant_access_token: 't-g104bube2DE5LVTAIUREHOPFP6SZOAOZKASMWR5X'
}
const axios = require('axios');
async function getToken() {

    var data = {
      "app_id": "cli_a30fa365ccb8900d",
      "app_secret": "1TNnz4zetlpYLUuwBVh1IctkeUhPvjBe"
    }
  
    const options = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
      },
      url: 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
      data: data
    };

    axios(options).then(
      function(res){
        console.log(res.data);
      }
    ).catch(
      function(error){
        console.log(error)
      }
    );


}
// getToken()
async function files() {

  var data = {
    "app_id": "cli_a30fa365ccb8900d",
    "app_secret": "1TNnz4zetlpYLUuwBVh1IctkeUhPvjBe"
  }

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token.app_access_token}`,
    },
    url: 'https://open.feishu.cn/open-apis/drive/v1/files',
    data: {
      folder_token: 'fldcnpG1qn4hJYwWJDRFBgtU8te'
    }
  };

  axios(options).then(
    function(res){
      console.log(res.data.data.files);
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );


}
// files();

async function readfiles() {

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token.app_access_token}`,
    },
    // url: 'https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/sheets/Sheet1'
    url: 'https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/metainfo'


  };

  axios(options).then(
    function(res){
      console.log(res.data.data);
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );


}
// readfiles();

async function readfilesContent() {

  const options = {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token.app_access_token}`,
    },
    url: 'https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/values/58f474!A1:P9'
    // url: 'https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/sheets/58f474'
    // url: 'https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/shtcnAZpRPK0wzV0TQQGsN86UGb/metainfo'


  };

  axios(options).then(
    function(res){
      console.log(res.data.data.valueRange.values);
    }
  ).catch(
    function(error){
      console.log(error)
    }
  );


}
readfilesContent();


var fileToken =  {
    id: '7171201256826912769',
    token: 'nodcnDvr9BBNTxCHc1xsH7Q6mbc',
    user_id: '7171172584065597442'
  }

  