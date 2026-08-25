const http = require('http');

const loginData = JSON.stringify({email:'isilay@gmail.com',sifre:'deneyap123',role:'yonetici'});
const loginOptions = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const req = http.request(loginOptions, (res) => {
  let cookies = res.headers['set-cookie'];
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Login:', res.statusCode, JSON.parse(body).redirect);
    if (cookies) {
      testEndpoints(cookies[0]);
    }
  });
});
req.on('error', e => console.error('Error:', e));
req.write(loginData);
req.end();

function testEndpoints(cookie) {
  const eps = ['/api/ogrenciler', '/api/egitmenler', '/api/veliler'];
  eps.forEach(ep => {
    const opts = {
      hostname: '127.0.0.1',
      port: 5000,
      path: ep,
      method: 'GET',
      headers: { 'Cookie': cookie }
    };
    http.request(opts, (r) => {
      let b = '';
      r.on('data', d => b += d);
      r.on('end', () => {
        try {
          const j = JSON.parse(b);
          console.log(r.statusCode, ep, j.length, 'records');
        } catch(e) {
          console.log('ERROR', ep, b.substring(0, 200));
        }
      });
    }).end();
  });
}