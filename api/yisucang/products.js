var base = require('./base')
var FormData = require('form-data');

const YISUCANG_ID_KEYS = [
  {
    PartnerID: '96648968',
    PartnerKey: '7fd301de-7d58-388f-044a-74ef521b18c5'
  },
  {
    PartnerID: '58176925',
    PartnerKey: '4cd81d9e-5f2c-dcd9-ed5e-d70039cdafd7'
  },
  {
    PartnerID: '18464347',
    PartnerKey: '9f57b273-e3f0-4802-79c3-19f062640086'
  },
  {
    PartnerID: '62593998',
    PartnerKey: '9bfea8ad-a4a9-e714-887d-e6a8116acaf6'
  },
  {
    PartnerID: '21169534',
    PartnerKey: '6d368a38-6fff-63c2-4ed7-5ed10206791a'
  },
  {
    PartnerID: '84163649',
    PartnerKey: 'b2426b75-282c-d77d-1992-14c52ddf4f6d'
  },
  {
    PartnerID: '94734457',
    PartnerKey: 'a8d83a18-1dad-21ee-dfbb-2f20475c8c6c'
  },
  {
    PartnerID: '39274878',
    PartnerKey: '9876a6da-77fe-0993-c061-b8c89b733440'
  },
  {
    PartnerID: '19464974',
    PartnerKey: 'd29d413b-b129-5d9b-aea9-f1402d01a04c'
  },
  {
    PartnerID: '36295842',
    PartnerKey: '69768d50-57d0-4653-861e-936251d62489'
  },
  {
    PartnerID: '91497841',
    PartnerKey: '049244d5-3bb7-48c8-0b53-fc1c2724c8f9'
  },
  {
    PartnerID: '57112154',
    PartnerKey: '8fe8b6cf-fc41-00ac-6062-9c327b81b503'
  },
  {
    PartnerID: '27168747',
    PartnerKey: '8cec89ce-5125-1de0-1879-0cbed41213dc'
  }
]
yisucangApis = {
  inventory: '/OrderAPI/GetInventory',
  product: '/OrderAPI/GetProductList'
}
async function products() {
  var products = [];
  for(var id_key of YISUCANG_ID_KEYS) {
    const data = new FormData();
    data.append('PartnerID', id_key.PartnerID);
    data.append('PartnerKey', id_key.PartnerKey);
    var res = await base(yisucangApis.product, data);
    if (res.Data) {
      products = products.concat(res.Data);
    }
  }
  return (products);
}

exports.yisucangProducts = products;