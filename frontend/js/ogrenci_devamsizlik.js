document.addEventListener('DOMContentLoaded', function () {
    const ctx = document.getElementById("devamsizlikChart");
    if (!ctx) return;

    // devamsizlikVerisi EJS tarafından sayfaya gömülüyor
    if (typeof devamsizlikVerisi === 'undefined' || devamsizlikVerisi.length === 0) return;

    let geldi = 0;
    let gelmedi = 0;
    let izinli = 0;

    devamsizlikVerisi.forEach(kayit => {
        const durum = kayit.durum;
        if (durum === 'Geldi') {
            geldi++;
        } else if (durum === 'Gelmedi') {
            gelmedi++;
        } else if (durum === 'İzinli') {
            izinli++;
        }
    });

    new Chart(ctx, {
        type: "doughnut",

        data: {
            labels: ["Geldi", "Gelmedi", "İzinli"],
            datasets: [{
                data: [geldi, gelmedi, izinli],
                backgroundColor: [
                    "#198754",
                    "#dc3545",
                    "#f39c12"
                ],
                borderColor: "#ffffff",
                borderWidth: 3,
                hoverOffset: 10
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { size: 14 },
                        padding: 20
                    }
                }
            }
        }
    });
});