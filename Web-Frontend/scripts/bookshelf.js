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
        let isLoggedIn = false;

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
                    isLoggedIn = true;
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

                // Przygotuj przyciski akcji
                let actionsHtml = '';
                const actions = [];

                // Przycisk profilu właściciela
                if (book.owner_username && book.owner_username !== currentUsername) {
                    actions.push(`<button class="profile-button" onclick="navigateToProfile('${escapeHtml(book.owner_username)}')">Profil właściciela</button>`);
                }

                // Przycisk wymiany tylko dla zalogowanych użytkowników i tylko dla cudzych książek
                if (isLoggedIn && book.owner_username && book.owner_username !== currentUsername) {
                    actions.push(`<button class="trade-button" onclick="initiateTradeFromBook('${book.id}', '${escapeHtml(book.owner_username)}')">Wymiana</button>`);
                }

                if (actions.length > 0) {
                    actionsHtml = `<div class="book-actions">${actions.join('')}</div>`;
                }

                bookCard.innerHTML = `
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">${escapeHtml(book.author)}</div>
                    <div class="book-details">
                        <div>Stan: ${escapeHtml(book.condition || 'Nie podano')}</div>
                        <div>Okładka: ${escapeHtml(book.cover_type || 'Nie podano')}</div>
                        ${book.owner_username ? `<div>Właściciel: ${escapeHtml(book.owner_username)}</div>` : ''}
                    </div>
                    ${actionsHtml}
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
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Funkcja do nawigacji do profilu użytkownika
function navigateToProfile(username) {
    if (!username) {
        console.error('Brak nazwy użytkownika');
        return;
    }
    window.location.href = `/profilePage.html?userId=${encodeURIComponent(username)}`;
}

// Funkcja do initowania wymiany z konkretną książką
function initiateTradeFromBook(bookId, ownerUsername) {
    // Sprawdź czy użytkownik jest zalogowany
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Musisz być zalogowany, aby zainicjować wymianę');
        return;
    }
    
    // Sprawdź czy funkcja openTradeModal istnieje
    if (typeof openTradeModal === 'function') {
        // Otwórz modal wymiany z automatycznie wybraną książką
        openTradeModal(bookId, ownerUsername);
    } else {
        // Fallback - przekieruj do strony wymiany
        window.location.href = `/tradePage.html?bookId=${encodeURIComponent(bookId)}&owner=${encodeURIComponent(ownerUsername)}`;
    }
}

// Funkcja do odświeżania półki z książkami
function refreshBookshelf(containerId = 'bookshelf', userId = null) {
    if (containerId === 'allBookshelf') {
        loadAllBooks(containerId);
    } else {
        loadUserBooks(containerId, userId);
    }
}

// Funkcja inicjalizująca - wywołaj po załadowaniu DOM
function initializeBookshelf() {
    // Sprawdź czy istnieją elementy półek i załaduj odpowiednie dane
    const userBookshelf = document.getElementById('bookshelf');
    const allBookshelf = document.getElementById('allBookshelf');
    
    if (userBookshelf) {
        // Sprawdź czy to strona profilu innego użytkownika
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        loadUserBooks('bookshelf', userId);
    }
    
    if (allBookshelf) {
        loadAllBooks('allBookshelf');
    }
}

// Automatyczne inicjalizowanie gdy DOM jest gotowy
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBookshelf);
} else {
    initializeBookshelf();
}