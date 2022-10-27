var fs = require('fs');
module.exports = function(fileName, content) {
  fs.writeFile(`${fileName}`, `${content}`, {'flag': 'a'}, function(err) {
    if (err) {
      throw err;
    }
  })
}