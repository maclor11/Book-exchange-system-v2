// wishlistModal.js - Obs³uga modalu do dodawania ksi¹¿ek do listy

// Funkcja do inicjalizacji modalu
function initAddWishlistModal() {
    const modal = document.getElementById('addWishlistModal');
    const btn = document.getElementById('addWishlistBtn');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('addWishlistForm');

    // Inicjalizuj podpowiedzi ksi¹¿ek od razu
    initBookSuggestions();

    // Otwieranie modalu
    if (btn) {
        btn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    // Zamykanie modalu
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Zamykanie modalu po klikniêciu poza jego obszarem
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Obs³uga formularza dodawania ksi¹¿ki
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const wishlistData = {
                title: document.getElementById('title').value,
                author: document.getElementById('author').value,
                condition: document.getElementById('condition').value,
                cover_type: document.getElementById('cover_type').value
            };
            
            try {
                const response = await callApi('/api/user/wishlists', {
                    method: 'POST',
                    body: JSON.stringify(wishlistData)
                });
                
                if (response.ok) {
                    // Zamknij modal
                    modal.style.display = 'none';
                    
                    // Wyczyœæ formularz
                    form.reset();
                    
                    // Ukryj wszystkie podpowiedzi po resecie
                    const titleSuggestions = document.getElementById('titleSuggestions');
                    const authorSuggestions = document.getElementById('authorSuggestions');
                    if (titleSuggestions) titleSuggestions.classList.remove('show');
                    if (authorSuggestions) authorSuggestions.classList.remove('show');
                    
                    // Odœwie¿ listê ksi¹¿ek - sprawdŸ czy istnieje funkcja i wywo³aj j¹
                    if (typeof loadUserWishlist === 'function') {
                        loadUserWishlist();
                    }
                    
                    // SprawdŸ czy istnieje druga pó³ka (na profilu) i te¿ j¹ odœwie¿
                    if (document.getElementById('userWishlist') && typeof loadUserWishlist === 'function') {
                        loadUserWishlist('userWishlist');
                    }
                    
                    alert('Ksi¹¿ka zosta³a dodana do Twojej pó³ki!');
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Wyst¹pi³ b³¹d podczas dodawania ksi¹¿ki.');
                }
            } catch (error) {
                console.error('B³¹d podczas dodawania ksi¹¿ki:', error);
                alert('Problem z po³¹czeniem z serwerem.');
            }
        });
    }
}

function initBookSuggestions() {
    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');
    const titleSuggestions = document.getElementById('titleSuggestions');
    const authorSuggestions = document.getElementById('authorSuggestions');
    
    if (!titleInput || !authorInput || !titleSuggestions || !authorSuggestions) {
        return; // Brak wszystkich elementów - prawdopodobnie nie jesteœmy na stronie z modalem
    }
    
    let allBooks = []; // Cache dla wszystkich ksi¹¿ek
    
    // Pobierz wszystkie ksi¹¿ki z bazy do cache'u
    loadBooksForSuggestions();
    
    async function loadBooksForSuggestions() {
        try {
            const response = await fetch('/api/public/books');
            if (response.ok) {
                allBooks = await response.json();
            }
        } catch (error) {
            console.error('B³¹d podczas pobierania ksi¹¿ek dla podpowiedzi:', error);
        }
    }
    
    // Obs³uga podpowiedzi dla tytu³u
    titleInput.addEventListener('input', () => {
        const query = titleInput.value.toLowerCase().trim();
        showSuggestions(query, 'title', titleSuggestions);
    });
    
    // Obs³uga podpowiedzi dla autora
    authorInput.addEventListener('input', () => {
        const query = authorInput.value.toLowerCase().trim();
        showSuggestions(query, 'author', authorSuggestions);
    });
    
    // Funkcja do wyœwietlania podpowiedzi
    function showSuggestions(query, field, container) {
        container.innerHTML = '';
        
        if (query.length < 2) {
            container.classList.remove('show');
            return;
        }
        
        const matches = allBooks.filter(book => {
            if (field === 'title') {
                return book.title.toLowerCase().includes(query);
            } else {
                return book.author.toLowerCase().includes(query);
            }
        });
        
        // Usuñ duplikaty na podstawie tytu³u i autora
        const uniqueMatches = matches.filter((book, index, self) => 
            index === self.findIndex(b => b.title === book.title && b.author === book.author)
        );
        
        if (uniqueMatches.length === 0) {
            container.innerHTML = '<div class="no-suggestions">Brak podpowiedzi</div>';
        } else {
            uniqueMatches.slice(0, 5).forEach(book => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.innerHTML = `
                    <div class="suggestion-title">${escapeHtml(book.title)}</div>
                    <div class="suggestion-author">${escapeHtml(book.author)}</div>
                `;
                
                // Obs³uga klikniêcia na podpowiedŸ
                suggestionItem.addEventListener('click', () => {
                    titleInput.value = book.title;
                    authorInput.value = book.author;
                    titleSuggestions.classList.remove('show');
                    authorSuggestions.classList.remove('show');
                });
                
                container.appendChild(suggestionItem);
            });
        }
        
        container.classList.add('show');
    }
    
    // Ukryj podpowiedzi po klikniêciu poza kontenerami
    document.addEventListener('click', (event) => {
        if (!titleInput.contains(event.target) && !titleSuggestions.contains(event.target)) {
            titleSuggestions.classList.remove('show');
        }
        if (!authorInput.contains(event.target) && !authorSuggestions.contains(event.target)) {
            authorSuggestions.classList.remove('show');
        }
    });
    
    // Ukryj podpowiedzi przy focusie na innym polu
    titleInput.addEventListener('blur', () => {
        setTimeout(() => titleSuggestions.classList.remove('show'), 200);
    });
    
    authorInput.addEventListener('blur', () => {
        setTimeout(() => authorSuggestions.classList.remove('show'), 200);
    });
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