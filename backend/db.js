const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'aysu123',
    database: 'deneyap_sistemi'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL bağlantı hatası:', err);
        return;
    }

    console.log('MySQL veritabanına başarıyla bağlanıldı.');
});

module.exports = db;