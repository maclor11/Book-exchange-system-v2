// wishlist.js - Obsługa wyświetlania listy życzeń

// Funkcja do pobierania listy życzeń
async function loadUserWishlist(containerId = 'wishlist') {
    const wishlist = document.getElementById(containerId);
    
    if (!wishlist) return;
    
    // Wyświetl komunikat o ładowaniu
    wishlist.innerHTML = '<div class="loading-wishlist">Ładowanie Twoich książek...</div>';
    
    try {
        const response = await callApi('/api/user/wishlists', {
            method: 'GET'
        });
        
        if (response.ok) {
            const books = await response.json();
            
            // Wyczyść półkę
            wishlist.innerHTML = '';
            
            if (books.length === 0) {
                wishlist.innerHTML = '<div class="no-books">Nie masz jeszcze żadnych książek na liście. Dodaj swoją pierwszą książkę!</div>';
                return;
            }
            
            // Dodaj każdą książkę do półki
            books.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'book-card';
                bookCard.innerHTML = `
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-author">${escapeHtml(book.author)}</div>
                `;
                wishlist.appendChild(bookCard);
            });
        } else {
            const errorData = await response.json();
            wishlist.innerHTML = `<div class="error-message">Błąd: ${errorData.error || 'Nie można załadować książek'}</div>`;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania książek:', error);
        wishlist.innerHTML = '<div class="error-message">Problem z połączeniem z serwerem</div>';
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