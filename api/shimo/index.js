const request = require('node-fetch');

fetch('https://platform.shimodev.com/entry/oauth2/token', {
  method: 'POST',
  body: JSON.stringify({
    clientId: 'shimo',
    ClientSecret: 'shimo',
    grantType: 'client_credentials',
    clientUserId: '1',
    scope: 'write',
    info: JSON.stringify({
      fileGuid: 'JyRX1679PL86rbTk',
      filePermissions: {
        editable: true,
        writeable: true,
        readonly: true
      }
    })
  })
}).then(res => res.json())
  .then(body => console.log(body.data))