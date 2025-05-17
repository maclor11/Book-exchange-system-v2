

// Funkcja do pobierania i wyświetlania książek z opcjonalnym filtrowaniem
/*async function displayOtherBooks() {
    try {
        // Pobierz wszystkich użytkowników
        const usersResponse = await fetch(`/api/users`);
        if (!usersResponse.ok) {
            alert('Nie można pobrać listy użytkowników.');
            return;
        }

        // Pobierz książki wszystkich użytkowników z wyjątkiem zalogowanego
        const booksPromises = fetch(`/api/userbooks/others`);

        const booksResponses = await Promise.all(booksPromises);
        const allBooks = (await Promise.all(
            booksResponses.map(response => response.json())
        )).flat();

        // Pobierz kontener półki
        const shelf = document.getElementById('shelf');
        shelf.innerHTML = ''; // Wyczyść półkę

        // Wyświetl książki na półce
        allBooks.forEach(({ bookId, userId }) => {
            const user = usersResponse.find(u => u._id === userId); // Znajdź właściciela książki
            const username = user ? user.username : 'Nieznany';

            const bookContainer = document.createElement('div');
            bookContainer.classList.add('book-container');

            const bookDiv = document.createElement('div');
            bookDiv.classList.add('book');

            const bookFront = document.createElement('div');
            bookFront.classList.add('book-face', 'book-front');
            bookFront.innerHTML = `<strong title="${bookId.title}">${bookId.title}</strong><br><small>Właściciel: ${username}</small>`;

            const bookBack = document.createElement('div');
            bookBack.classList.add('book-face', 'book-back');
            bookBack.innerHTML = `
                <p><strong>Autor:</strong> <br><span title="${bookId.author}">${bookId.author}</span></p>
                <p><strong>Stan:</strong> ${bookId.condition || 'Nieznany'}</p>
                <p><strong>Okładka:</strong> ${bookId.coverType || 'Nieznana'}</p>
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
}*/
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = now.toLocaleDateString('pl-PL', options);
    const time = now.toLocaleTimeString('pl-PL');

    document.getElementById('currentDateTime').textContent = `${date}, ${time}`;
}

async function displayAllBooks() {
    try {
        const usersResponse = await fetch(`/api/main/users`);
        if (!usersResponse.ok) {
            alert('Nie można pobrać listy użytkowników.');
            return;
        }

        const usersData = await usersResponse.json();
        console.log("✅ Odebrani użytkownicy:", usersData);
        const users = usersData.users || [];

        console.log("📦 Pobieranie książek z /api/userbooks...");


        const booksResponse = await fetch(`/api/main/userbooks`);


        console.log("📥 booksResponse status:", booksResponse.status);
        const contentType = booksResponse.headers.get("content-type");
        console.log("📄 Content-Type:", contentType);

        const rawText = await booksResponse.text();
        console.log("📤 Surowa odpowiedź z /api/userbooks:", rawText);

        if (!booksResponse.ok) {
            alert('Nie można pobrać książek użytkowników.');
            return;
        }

        let booksByUser;
        try {
            booksByUser = JSON.parse(rawText);
            console.log("✅ Sparsowany JSON książek:", booksByUser);
        } catch (parseErr) {
            console.error("❌ Błąd parsowania JSON z /api/userbooks:", parseErr.message);
            alert('Odpowiedź z serwera nie jest poprawnym JSON-em. Sprawdź konsolę.');
            return;
        }

        const shelf = document.getElementById('shelf');
        console.log("🧹 Czyścimy półkę...");
        shelf.innerHTML = '';

        console.log("🧱 Renderowanie książek na półce...");

        for (const [userId, books] of Object.entries(booksByUser)) {
            const user = users.find(u => u._id === userId);
            const username = user ? user.username : 'Nieznany';

            books.forEach(book => {
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
                    <p><strong>Okładka:</strong> ${book.coverType || 'Nieznana'}</p>
                `;

                bookDiv.appendChild(bookFront);
                bookDiv.appendChild(bookBack);
                bookContainer.appendChild(bookDiv);
                shelf.appendChild(bookContainer);
            });
        }

        console.log("✅ Półka załadowana!");

    } catch (error) {
        console.error('❌ Błąd podczas ładowania półki:', error);
        alert('Wystąpił błąd podczas ładowania półki.');
    }
}




// Aktualizacja co sekundę
setInterval(updateDateTime, 1000);

// Funkcja wyszukiwania książek po tytule
function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const shelf = document.getElementById('shelf');
    const books = shelf.getElementsByClassName('book-container');

    Array.from(books).forEach(bookContainer => {
        const bookTitle = bookContainer.querySelector('.book-front strong').textContent.toLowerCase();
        if (bookTitle.includes(searchTerm)) {
            bookContainer.style.display = ''; // Pokaż, jeśli pasuje
        } else {
            bookContainer.style.display = 'none'; // Ukryj, jeśli nie pasuje
        }
    });
}

window.onload = () => {
    displayAllBooks();
    updateDateTime();
    searchBooks();
};

document.addEventListener('DOMContentLoaded', () => {
    const shelf = document.getElementById('shelf');
    shelf.addEventListener('click', (event) => {
        const book = event.target.closest('.book');
        if (book) {
            book.classList.toggle('flipped');
        }
    });
});


