
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = now.toLocaleDateString('pl-PL', options);
    const time = now.toLocaleTimeString('pl-PL');

    document.getElementById('currentDateTime').textContent = `${date}, ${time}`;
}

// Funkcja do pobierania i wyświetlania książek z opcjonalnym filtrowaniem
async function displayBooks(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`http://localhost:3000/api/books${queryParams ? `?${queryParams}` : ''}`);

        if (!response.ok) {
            alert('Nie można pobrać książek.');
            return;
        }

        const books = await response.json();

        const shelf = document.getElementById('shelf');
        shelf.innerHTML = ''; // Wyczyść półkę

        books.forEach(({ book_id: book, user_id: user }) => {
            const username = user?.username || 'Nieznany';

            const bookContainer = document.createElement('div');
            bookContainer.classList.add('book-container');

            const bookDiv = document.createElement('div');
            bookDiv.classList.add('book');

            const bookFront = document.createElement('div');
            bookFront.classList.add('book-face', 'book-front');
            bookFront.innerHTML = `<strong title="${book.title}">${book.title}</strong><br><small>Właściciel: ${username}</small>`;

            const bookBack = document.createElement('div');
            bookBack.classList.add('book-face', 'book-back');
            bookBack.innerHTML = `
                <p><strong>Autor:</strong> <br><span title="${book.author}">${book.author}</span></p>
                <p><strong>Stan:</strong> ${book.condition || 'Nieznany'}</p>
                <p><strong>Okładka:</strong> ${book.cover_type || 'Nieznana'}</p>
            `;

            bookDiv.appendChild(bookFront);
            bookDiv.appendChild(bookBack);
            bookContainer.appendChild(bookDiv);
            shelf.appendChild(bookContainer);
        });
    } catch (error) {
        console.error('Błąd podczas ładowania półki:', error);
        alert('Wystąpił błąd podczas ładowania półki.');
    }
}

// Funkcja wyszukiwania książek po tytule
function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    displayBooks({ title: searchTerm });
}

// Przycisk powrotu do logowania
function login() {
    window.location.href = 'index.html';
}

// Inicjalizacja po załadowaniu strony
window.onload = () => {
    displayBooks();               // Załaduj wszystkie książki
    updateDateTime();            // Pokaż datę/czas
    setInterval(updateDateTime, 1000); // Aktualizuj datę co sekundę

    // Obsługa przewracania książek
    const shelf = document.getElementById('shelf');
    shelf.addEventListener('click', (event) => {
        const book = event.target.closest('.book');
        if (book) {
            book.classList.toggle('flipped');
        }
    });

    // Obsługa wyszukiwania w czasie rzeczywistym
    document.getElementById('searchInput').addEventListener('input', searchBooks);
};

// scripts/index.js

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();

    if (user) {
        document.querySelector('.logged-in').style.display = 'block';
        document.querySelector('.logged-out').style.display = 'none';
        document.getElementById('username').textContent = user.username;
        displayBooks({ excludeOwn: true });
    } else {
        document.querySelector('.logged-in').style.display = 'none';
        document.querySelector('.logged-out').style.display = 'block';
        displayBooks();
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const title = e.target.value.trim();
            const filters = { title };
            if (user) filters.excludeOwn = true;
            displayBooks(filters);
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

