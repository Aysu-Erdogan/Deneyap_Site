function oturumKontrol(req, res, next) {
    if (!req.session || !req.session.kullanici_id) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
            return res.status(401).json({ error: 'Oturum süreniz dolmuş veya yetkiniz yok.' });
        }
        return res.redirect('/');
    }
    next();
}

function rolKontrol(izinVerilenRoller = []) {
    return (req, res, next) => {
        if (!req.session || !req.session.kullanici_id) {
            return res.status(401).json({ error: 'Lütfen giriş yapın.' });
        }
        
        const kullaniciRol = req.session.rol_id;
        
        if (izinVerilenRoller.length && !izinVerilenRoller.includes(kullaniciRol)) {
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('json'))) {
                return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
            }
            return res.status(403).send('Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.');
        }
        
        next();
    };
}

module.exports = {
    oturumKontrol,
    rolKontrol
};
