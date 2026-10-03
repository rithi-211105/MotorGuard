import http from 'http';

http.get('http://127.0.0.1:5173/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTML Status:', res.statusCode);
    console.log('HTML Body preview:\n', body.slice(0, 300));
  });
}).on('error', (e) => {
  console.error('Fetch error:', e);
});
