const https = require('https');

const options = {
  hostname: 'api.online.payments.bold.co',
  path: '/v2/payment-vouchers/test-12345',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer 7yYOobYR-iHyqMGT6_Se_i6Wak2dtiMTwW2R8BX6NXU'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', error => console.error(error));
req.end();
