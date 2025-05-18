// bookshelf.js - Obsługa wyświetlania półek z książkami

// Funkcja do pobierania książek użytkownika
async function loadUserBooks(containerId = 'bookshelf') {
    const bookshelf = document.getElementById(containerId);
    
    if (!bookshelf) return;
    
    // Wyświetl komunikat o ładowaniu
    bookshelf.innerHTML = '<div class="loading-books">Ładowanie Twoich książek...</div>';
    
    try {
        const response = await callApi('/api/user/books', {
            method: 'GET'
        });
        
        if (response.ok) {
            const books = await response.json();
            
            // Wyczyść półkę
            bookshelf.innerHTML = '';
            
            if (books.length === 0) {
                bookshelf.innerHTML = '<div class="no-books">Nie masz jeszcze żadnych książek. Dodaj swoją pierwszą książkę!</div>';
                return;
            }
            
            // Dodaj każdą książkę do półki
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

// Function to load all books for display to any user (logged in or not)
async function loadAllBooks(containerId = 'allBookshelf') {
    const allBookshelf = document.getElementById(containerId);
    
    if (!allBookshelf) return;
    
    // Display loading message
    allBookshelf.innerHTML = '<div class="loading-books">Ładowanie wszystkich książek...</div>';
    
    try {
        // Use direct fetch with public API endpoint that doesn't require authentication
        const response = await fetch('/api/public/books', {
            method: 'GET'
        });
        
        if (response.ok) {
            const books = await response.json();
            
            // Clear the bookshelf
            allBookshelf.innerHTML = '';
            
            if (books.length === 0) {
                allBookshelf.innerHTML = '<div class="no-books">Brak dostępnych książek w systemie.</div>';
                return;
            }
            
            // Add each book to the bookshelf
            books.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                bookCard.innerHTML = `
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">${escapeHtml(book.author)}</div>
                    <div class="book-details">
                        <div>Stan: ${escapeHtml(book.condition || 'Nie podano')}</div>
                        <div>Okładka: ${escapeHtml(book.cover_type || 'Nie podano')}</div>
                    </div>
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