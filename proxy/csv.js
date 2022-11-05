const csv = require('csv-parser')

const fs = require('fs')
const results = [];
csv({ separator: '\t' });
var parseCsv = async function(name) {
  
  await fs.createReadStream(__dirname+'/' + name)
      .pipe(csv())
      .on('data', (data) => {
        if (Number(data['Total Profit']) > 500) {
          results.push(data["ASIN"])
        }
      })
      .on('end', () => {
        return (results);
      });
}
exports.parseCsv = parseCsv;