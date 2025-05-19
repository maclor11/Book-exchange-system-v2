// wishlist.js - Obs�uga wy�wietlania listy �ycze�

// Funkcja do pobierania listy �ycze�
async function loadUserWishlist(containerId = 'wishlist') {
    const wishlist = document.getElementById(containerId);
    
    if (!wishlist) return;
    
    // Wy�wietl komunikat o �adowaniu
    wishlist.innerHTML = '<div class="loading-wishlist">�adowanie Twoich ksi��ek...</div>';
    
    try {
        const response = await callApi('/api/user/wishlists', {
            method: 'GET'
        });
        
        if (response.ok) {
            const books = await response.json();
            
            // Wyczy�� p�k�
            wishlist.innerHTML = '';
            
            if (books.length === 0) {
                wishlist.innerHTML = '<div class="no-books">Nie masz jeszcze �adnych ksi��ek na li�cie. Dodaj swoj� pierwsz� ksi��k�!</div>';
                return;
            }
            
            // Dodaj ka�d� ksi��k� do p�ki
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
            wishlist.innerHTML = `<div class="error-message">B��d: ${errorData.error || 'Nie mo�na za�adowa� ksi��ek'}</div>`;
        }
    } catch (error) {
        console.error('B��d podczas pobierania ksi��ek:', error);
        wishlist.innerHTML = '<div class="error-message">Problem z po��czeniem z serwerem</div>';
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