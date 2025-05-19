// wishlist.js - Obs³uga wyœwietlania listy ¿yczeñ

// Funkcja do pobierania listy ¿yczeñ
async function loadUserWishlist(containerId = 'wishlist') {
    const wishlist = document.getElementById(containerId);
    
    if (!wishlist) return;
    
    // Wyœwietl komunikat o ³adowaniu
    wishlist.innerHTML = '<div class="loading-wishlist">£adowanie Twoich ksi¹¿ek...</div>';
    
    try {
        const response = await callApi('/api/user/wishlists', {
            method: 'GET'
        });
        
        if (response.ok) {
            const books = await response.json();
            
            // Wyczyœæ pó³kê
            wishlist.innerHTML = '';
            
            if (books.length === 0) {
                wishlist.innerHTML = '<div class="no-books">Nie masz jeszcze ¿adnych ksi¹¿ek na liœcie. Dodaj swoj¹ pierwsz¹ ksi¹¿kê!</div>';
                return;
            }
            
            // Dodaj ka¿d¹ ksi¹¿kê do pó³ki
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
            wishlist.innerHTML = `<div class="error-message">B³¹d: ${errorData.error || 'Nie mo¿na za³adowaæ ksi¹¿ek'}</div>`;
        }
    } catch (error) {
        console.error('B³¹d podczas pobierania ksi¹¿ek:', error);
        wishlist.innerHTML = '<div class="error-message">Problem z po³¹czeniem z serwerem</div>';
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