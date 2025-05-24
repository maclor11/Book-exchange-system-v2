// bookshelf.js - Obsługa wyświetlania półek z książkami

// Funkcja do pobierania książek użytkownika
async function loadUserBooks(containerId = 'bookshelf', userId = null) {
    const bookshelf = document.getElementById(containerId);
    if (!bookshelf) return;

    bookshelf.innerHTML = '<div class="loading-books">Ładowanie książek...</div>';

    try {
        let url = '/api/user/books';  // domyślny endpoint dla własnych książek
        if (userId) {
            url = `/api/user/books/${encodeURIComponent(userId)}`; // książki innego użytkownika
        }

        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            const books = await response.json();
            bookshelf.innerHTML = '';

            if (books.length === 0) {
                bookshelf.innerHTML = '<div class="no-books">Brak książek do wyświetlenia.</div>';
                return;
            }

            books.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                bookCard.innerHTML = `
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">${escapeHtml(book.author)}</div>
                    <div class="book-details">
                        <div>Stan: ${escapeHtml(book.condition)}</div>
                        <div>Okładka: ${escapeHtml(book.cover_type)}</div>
                        <div>Data dodania: ${new Date(book.owned_date).toLocaleDateString('pl-PL')}</div>
                    </div>
                `;
                bookshelf.appendChild(bookCard);
            });
        } else {
            const errorData = await response.json();
            bookshelf.innerHTML = `<div class="error-message">Błąd: ${errorData.error || 'Nie można załadować książek'}</div>`;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania książek:', error);
        bookshelf.innerHTML = '<div class="error-message">Problem z połączeniem z serwerem</div>';
    }
}

async function loadAllBooks(containerId = 'allBookshelf') {
    const allBookshelf = document.getElementById(containerId);
    if (!allBookshelf) return;

    allBookshelf.innerHTML = '<div class="loading-books">Ładowanie wszystkich książek...</div>';

    try {
        let currentUsername = null;

        // Pobierz dane aktualnie zalogowanego użytkownika (jeśli istnieje)
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const userResponse = await fetch('/api/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    currentUsername = userData.username;
                }
            } catch (e) {
                console.warn('Nie udało się pobrać danych użytkownika:', e);
            }
        }

        // Teraz pobierz wszystkie książki
        const response = await fetch('/api/public/books', {
            method: 'GET'
        });

        if (response.ok) {
            const books = await response.json();
            allBookshelf.innerHTML = '';

            if (books.length === 0) {
                allBookshelf.innerHTML = '<div class="no-books">Brak dostępnych książek w systemie.</div>';
                return;
            }

            books.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';

                let profileButtonHtml = '';
                if (book.owner_username && book.owner_username !== currentUsername) {
                    profileButtonHtml = `<button class="profile-button" onclick="location.href='/profilePage.html?userId=${encodeURIComponent(book.owner_username)}'">Profil właściciela</button>`;
                }

                bookCard.innerHTML = `
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">${escapeHtml(book.author)}</div>
                    <div class="book-details">
                        <div>Stan: ${escapeHtml(book.condition || 'Nie podano')}</div>
                        <div>Okładka: ${escapeHtml(book.cover_type || 'Nie podano')}</div>
                    </div>
                    ${profileButtonHtml}
                `;
                allBookshelf.appendChild(bookCard);
            });
        } else {
            try {
                const errorData = await response.json();
                allBookshelf.innerHTML = `<div class="error-message">Błąd: ${errorData.error || 'Nie można załadować książek'}</div>`;
            } catch (e) {
                allBookshelf.innerHTML = '<div class="error-message">Nie można załadować książek</div>';
            }
        }
    } catch (error) {
        console.error('Błąd podczas pobierania wszystkich książek:', error);
        allBookshelf.innerHTML = '<div class="error-message">Problem z połączeniem z serwerem</div>';
    }
}

// Funkcja pomocnicza do escapowania HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}