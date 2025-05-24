// bookModal.js - Obsługa modalu do dodawania książek

// Funkcja do inicjalizacji modalu
function initAddBookModal() {
    const modal = document.getElementById('addBookModal');
    const btn = document.getElementById('addBookBtn');
    const closeBtn = document.querySelector('.close-books');
    const form = document.getElementById('addBookForm');

    // Inicjalizuj podpowiedzi książek od razu
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

    // Zamykanie modalu po kliknięciu poza jego obszarem
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Obsługa formularza dodawania książki
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const bookData = {
                title: document.getElementById('title').value,
                author: document.getElementById('author').value,
                condition: document.getElementById('condition').value,
                cover_type: document.getElementById('cover_type').value
            };

            try {
                const response = await callApi('/api/user/books', {
                    method: 'POST',
                    body: JSON.stringify(bookData)
                });

                if (response.ok) {
                    // Zamknij modal
                    modal.style.display = 'none';

                    // Wyczyść formularz
                    form.reset();

                    // Ukryj wszystkie podpowiedzi po resecie
                    const titleSuggestions = document.getElementById('titleSuggestions');
                    const authorSuggestions = document.getElementById('authorSuggestions');
                    if (titleSuggestions) titleSuggestions.classList.remove('show');
                    if (authorSuggestions) authorSuggestions.classList.remove('show');

                    // Odśwież główną półkę zalogowanego użytkownika
                    if (typeof loadUserBooks === 'function') {
                        loadUserBooks('bookshelf'); // domyślna półka
                    }

                    // Odśwież półkę innego użytkownika, jeśli istnieje
                    const profileBookshelf = document.getElementById('userBookshelf');
                    if (profileBookshelf && typeof loadBooksByUsername === 'function') {
                        const params = new URLSearchParams(window.location.search);
                        const userId = params.get('userId'); // to jest username
                        if (userId) {
                            loadBooksByUsername('userBookshelf', userId);
                        }
                    }

                    alert('Książka została dodana do Twojej półki!');
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Wystąpił błąd podczas dodawania książki.');
                }
            } catch (error) {
                console.error('Błąd podczas dodawania książki:', error);
                alert('Problem z połączeniem z serwerem.');
            }
        });
    }
}

// Funkcja do inicjalizacji modalu
function initAddWishlistModal() {
    const modal = document.getElementById('addWishlistModal');
    const btn = document.getElementById('addWishlistBtn');
    const closeBtn = document.querySelector('.close-wishlist');
    const form = document.getElementById('addWishlistForm');

    // Inicjalizuj podpowiedzi książek od razu
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

    // Zamykanie modalu po kliknięciu poza jego obszarem
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Obsługa formularza dodawania książki
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const wishlistData = {
                title: document.getElementById('titleW').value,
                author: document.getElementById('authorW').value,
            };

            try {
                const response = await callApi('/api/user/wishlists', {
                    method: 'POST',
                    body: JSON.stringify(wishlistData)
                });

                if (response.ok) {
                    // Zamknij modal
                    modal.style.display = 'none';

                    // Wyczyść formularz
                    form.reset();

                    // Ukryj wszystkie podpowiedzi po resecie
                    const titleSuggestions = document.getElementById('titleSuggestions');
                    const authorSuggestions = document.getElementById('authorSuggestions');
                    if (titleSuggestions) titleSuggestions.classList.remove('show');
                    if (authorSuggestions) authorSuggestions.classList.remove('show');

                    // Odśwież listę książek - sprawdź czy istnieje funkcja i wywołaj ją
                    if (typeof loadUserWishlist === 'function') {
                        loadUserWishlist();
                    }

                    // Sprawdź czy istnieje druga półka (na profilu) i też ją odśwież
                    if (document.getElementById('userWishlist') && typeof loadUserWishlist === 'function') {
                        loadUserWishlist('userWishlist');
                    }

                    alert('Książka została dodana do Twojej półki!');
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Wystąpił błąd podczas dodawania książki.');
                }
            } catch (error) {
                console.error('Błąd podczas dodawania książki:', error);
                alert('Problem z połączeniem z serwerem.');
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
        return; // Brak wszystkich elementów - prawdopodobnie nie jesteśmy na stronie z modalem
    }

    let allBooks = []; // Cache dla wszystkich książek

    // Pobierz wszystkie książki z bazy do cache'u
    loadBooksForSuggestions();

    async function loadBooksForSuggestions() {
        try {
            const response = await fetch('/api/public/books');
            if (response.ok) {
                allBooks = await response.json();
            }
        } catch (error) {
            console.error('Błąd podczas pobierania książek dla podpowiedzi:', error);
        }
    }

    // Obsługa podpowiedzi dla tytułu
    titleInput.addEventListener('input', () => {
        const query = titleInput.value.toLowerCase().trim();
        showSuggestions(query, 'title', titleSuggestions);
    });

    // Obsługa podpowiedzi dla autora
    authorInput.addEventListener('input', () => {
        const query = authorInput.value.toLowerCase().trim();
        showSuggestions(query, 'author', authorSuggestions);
    });

    // Funkcja do wyświetlania podpowiedzi
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

        // Usuń duplikaty na podstawie tytułu i autora
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

                // Obsługa kliknięcia na podpowiedź
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

    // Ukryj podpowiedzi po kliknięciu poza kontenerami
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