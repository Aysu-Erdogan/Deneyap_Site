const ctx = document.getElementById("devamsizlikChart");

new Chart(ctx, {
    type: "doughnut",

    data: {
        labels: [
            "Katıldı",
            "Gelmedi",
            "Raporlu"
        ],

        datasets: [{
            data: [18, 2, 1],

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

                    font: {
                        size: 14
                    },

                    padding: 20
                }

            }

        }

    }

});