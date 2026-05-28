'use strict';

const mongoose = require('mongoose');
const URI = 'mongodb+srv://khvinithds123278_db_user:OLodR1lyyB6pK5Ue@cluster0.rmkftyr.mongodb.net/chipzo';

const schema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', schema);

function getProductImageUrl(fileName) {
  if (!fileName) return '/placeholder.png';
  return fileName;
}

function mapProduct(p) {
  const specsObj = p.specifications || {}
  const specs = Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`)
  
  const voltageEntry = Object.entries(specsObj).find(([k]) =>
    k.toLowerCase().includes('voltage') || k.toLowerCase().includes('vcc')
  )
  const voltageMin = voltageEntry ? parseFloat(voltageEntry[1]) || 0 : 0
  const voltageMax = voltageMin

  const stockLabel = p.stock > 10 ? 'In Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock'
  const statusLabel = p.stock > 10 ? 'IN_STOCK' : p.stock > 0 ? 'HOT_ITEM' : 'PREORDER'
  const tones = ['primary', 'lime', 'ink']
  const idStr = p._id ? p._id.toString() : (p.id || '')
  const tone = tones[Math.abs(idStr.charCodeAt(0) || 0) % 3]

  return {
    id: `prod-${p._id || p.id}`,
    _id: p._id || p.id,
    code: p.id || p._id?.toString().slice(-8).toUpperCase() || 'CPZ-ITEM',
    title: p.name || 'Component',
    status: statusLabel,
    category: p.category || 'Other',
    description: p.description || '',
    specs: specs.length ? specs : ['See product page'],
    price: `₹${Number(p.price || 0).toFixed(2)}`,
    priceNum: Number(p.price || 0),
    note: p.minOrderQuantity > 1 ? `Min ${p.minOrderQuantity} Units` : 'Active Stock',
    tone,
    voltageMin,
    voltageMax,
    stock: stockLabel,
    image: p.images?.length ? getProductImageUrl(p.images[0]) : '',
  }
}

mongoose.connect(URI).then(async () => {
  console.log('Connected to DB');
  const products = await Product.find({}).lean();
  console.log('Fetched', products.length, 'products');
  try {
    const mapped = products.map(mapProduct);
    console.log('Mapped successfully!', mapped.length, 'products');
  } catch (err) {
    console.error('Error during mapping:', err);
  }
  mongoose.disconnect();
});
