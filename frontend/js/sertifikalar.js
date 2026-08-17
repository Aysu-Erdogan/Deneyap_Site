// ========================================
// COVERFLOW
// ========================================

const cards = document.querySelectorAll(".certificate-card");

const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

const dots = document.querySelectorAll(".dot");

let current = 1;

// İlk görünümü oluştur
updateCoverflow();

function updateCoverflow() {

    cards.forEach(card => {

        card.classList.remove(
            "left",
            "center",
            "right",
            "hidden-card"
        );

    });

    // Sol kart
    let left = current - 1;

    if(left < 0)
        left = cards.length - 1;

    // Sağ kart
    let right = current + 1;

    if(right >= cards.length)
        right = 0;

    cards[left].classList.add("left");

    cards[current].classList.add("center");

    cards[right].classList.add("right");

    // Diğerlerini gizle
    cards.forEach((card,index)=>{

        if(
            index !== left &&
            index !== current &&
            index !== right
        ){
            card.classList.add("hidden-card");
        }

    });

    // Dotlar
    dots.forEach(dot=>dot.classList.remove("active"));

    if(dots[current])
        dots[current].classList.add("active");

}

// Sağ ok
nextBtn.addEventListener("click",()=>{

    current++;

    if(current >= cards.length)
        current = 0;

    updateCoverflow();

});

// Sol ok
prevBtn.addEventListener("click",()=>{

    current--;

    if(current < 0)
        current = cards.length-1;

    updateCoverflow();

});