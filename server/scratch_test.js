'use strict';

const mongoose = require('mongoose');
const Product = require('./src/models/Product');

async function test() {
  await mongoose.connect('mongodb+srv://khvinithds123278_db_user:OLodR1lyyB6pK5Ue@cluster0.rmkftyr.mongodb.net/chipzo');
  console.log('Connected to DB');

  const runSearch = async (search) => {
    const terms = search.split(/\s+/).filter(Boolean);
    const filter = {};
    if (terms.length > 0) {
      filter.$and = terms.map(term => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let pattern = escaped;
        if (/lipo/i.test(term)) {
          pattern = 'li-?po';
        } else if (/li-po/i.test(term)) {
          pattern = 'li-?po';
        }
        return {
          $or: [
            { name: { $regex: pattern, $options: 'i' } },
            { description: { $regex: pattern, $options: 'i' } },
            { category: { $regex: pattern, $options: 'i' } },
            { interfaces: { $regex: pattern, $options: 'i' } }
          ]
        };
      });
    }

    const results = await Product.find(filter).lean();
    console.log(`\nSearch for "${search}" returned ${results.length} products:`);
    results.slice(0, 5).forEach(p => console.log(` - ${p.name} [${p.category}]`));
    if (results.length > 5) console.log(`   ... and ${results.length - 5} more`);
  };

  await runSearch('9v battery');
  await runSearch('aa battery');
  await runSearch('lipo 300mah');
  await runSearch('batt');

  await mongoose.disconnect();
}

test().catch(console.error);



