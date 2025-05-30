// Funkcja inicjalizująca modal wymiany
function initTradeModal() {
    // Sprawdź czy modal już istnieje
    if (document.getElementById('tradeModal')) return;
    
    // Utwórz HTML dla modalu wymiany
    const modalHTML = `
        <div id="tradeModal" class="modal">
            <div class="modal-content trade-modal-content">
                <span class="close-trade">&times;</span>
                <h2>Wymiana książek</h2>
                
                <div class="trade-users-info">
                    <div class="trade-user-info">
                        <h3>Twoje książki</h3>
                        <span id="currentUserName"></span>
                    </div>
                    <div class="trade-user-info">
                        <h3>Książki partnera</h3>
                        <span id="partnerUserName"></span>
                    </div>
                </div>
                
                <div class="trade-books-container">
                    <!-- Twoje książki -->
                    <div class="trade-section">
                        <h4>Wybierz swoje książki do wymiany:</h4>
                        <div id="myBooksForTrade" class="trade-books-list">
                            <!-- Lista twoich książek -->
                        </div>
                        <h4>Wybrane twoje książki:</h4>
                        <div id="selectedMyBooks" class="selected-books">
                            <!-- Wybrane twoje książki -->
                        </div>
                    </div>
                    
                    <!-- Książki partnera -->
                    <div class="trade-section">
                        <h4>Wybierz książki partnera:</h4>
                        <div id="partnerBooksForTrade" class="trade-books-list">
                            <!-- Lista książek partnera -->
                        </div>
                        <h4>Wybrane książki partnera:</h4>
                        <div id="selectedPartnerBooks" class="selected-books">
                            <!-- Wybrane książki partnera -->
                        </div>
                    </div>
                </div>
                
                <div class="trade-actions">
                    <button id="submitTradeBtn" class="primary">Złóż ofertę wymiany</button>
                    <button id="cancelTradeBtn" class="secondary">Anuluj</button>
                </div>
            </div>
        </div>
    `;
    
    // Dodaj modal do body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Przypisz event listenery
    setupTradeModalListeners();
}

// Funkcja ustawiająca listenery dla modalu wymiany
function setupTradeModalListeners() {
    const modal = document.getElementById('tradeModal');
    const closeBtn = document.querySelector('.close-trade');
    const submitBtn = document.getElementById('submitTradeBtn');
    const cancelBtn = document.getElementById('cancelTradeBtn');
    
    // Zamykanie modalu
    closeBtn.addEventListener('click', closeTradeModal);
    cancelBtn.addEventListener('click', closeTradeModal);
    
    // Zamykanie po kliknięciu poza modal
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeTradeModal();
        }
    });
}

// Funkcja otwierająca modal wymiany z konkretną książką
async function openTradeModal(bookId, partnerUsername) {
    initTradeModal();
    
    const modal = document.getElementById('tradeModal');
    const currentUserName = document.getElementById('currentUserName');
    const partnerUserName = document.getElementById('partnerUserName');
    const submitBtn = document.getElementById('submitTradeBtn');
    
    // Resetuj modal do stanu tworzenia nowej wymiany
    modal.querySelector('h2').textContent = 'Wymiana książek';
    submitBtn.textContent = 'Złóż ofertę wymiany';
    submitBtn.onclick = submitTrade; // Ustaw na tworzenie nowej wymiany
    
    // Ustaw dane użytkowników
    const userData = await getCurrentUser();
    currentUserName.textContent = userData.username;
    partnerUserName.textContent = partnerUsername;
    
    // Załaduj książki
    await loadBooksForTrade(userData.username, partnerUsername);
    
    // Automatycznie wybierz książkę partnera, która została kliknięta
    if (bookId) {
        selectPartnerBook(bookId);
    }
    
    modal.style.display = 'block';
}

// Funkcja ładująca książki dla wymiany
async function loadBooksForTrade(currentUsername, partnerUsername) {
    try {
        // Załaduj swoje książki
        const myBooksResponse = await callApi('/api/user/books');
        if (myBooksResponse.ok) {
            const myBooks = await myBooksResponse.json();
            displayMyBooksForTrade(myBooks);
        } else {
            console.error('Błąd podczas ładowania własnych książek');
        }
        
        // Załaduj książki partnera - UŻYWAJ callApi zamiast fetch
        const partnerBooksResponse = await callApi(`/api/user/books/${encodeURIComponent(partnerUsername)}`);
        if (partnerBooksResponse.ok) {
            const partnerBooks = await partnerBooksResponse.json();
            displayPartnerBooksForTrade(partnerBooks);
        } else {
            console.error('Błąd podczas ładowania książek partnera');
            // Wyświetl komunikat użytkownikowi
            const container = document.getElementById('partnerBooksForTrade');
            if (container) {
                container.innerHTML = '<div class="error-message">Nie udało się załadować książek partnera</div>';
            }
        }
        
    } catch (error) {
        console.error('Błąd podczas ładowania książek do wymiany:', error);
        alert('Nie udało się załadować książek do wymiany');
    }
}

// Funkcja wyświetlająca twoje książki
function displayMyBooksForTrade(books) {
    const container = document.getElementById('myBooksForTrade');
    container.innerHTML = '';
    
    books.forEach(book => {
        const bookElement = createTradeBookElement(book, 'my');
        container.appendChild(bookElement);
    });
}

// Funkcja wyświetlająca książki partnera
function displayPartnerBooksForTrade(books) {
    const container = document.getElementById('partnerBooksForTrade');
    container.innerHTML = '';
    
    books.forEach(book => {
        const bookElement = createTradeBookElement(book, 'partner');
        container.appendChild(bookElement);
    });
}

// Funkcja tworząca element książki do wymiany
function createTradeBookElement(book, type) {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'trade-book-item';
    bookDiv.dataset.bookId = book.id;
    bookDiv.dataset.type = type;
    
    // Sprawdź czy książka jest zablokowana
    const isLocked = book.is_locked || false;
    if (isLocked) {
        bookDiv.classList.add('book-locked');
    }
    
    const buttonText = isLocked ? 'Niedostępna' : 'Wybierz';
    const buttonDisabled = isLocked ? 'disabled' : '';
    const lockIcon = isLocked ? '<span class="lock-icon">🔒</span>' : '';
    
    bookDiv.innerHTML = `
        <div class="book-info">
            ${lockIcon}
            <h5>${escapeHtml(book.title)}</h5>
            <p>Autor: ${escapeHtml(book.author)}</p>
            <p>Stan: ${escapeHtml(book.condition)}</p>
            <p>Okładka: ${escapeHtml(book.cover_type)}</p>
            ${isLocked ? '<p class="lock-message">Książka jest zablokowana przez inną wymianę</p>' : ''}
        </div>
        <button class="select-book-btn" onclick="toggleBookSelection('${book.id}', '${type}')" ${buttonDisabled}>
            ${buttonText}
        </button>
    `;
    
    return bookDiv;
}

// Funkcja przełączająca wybór książki
function toggleBookSelection(bookId, type) {
    const bookElement = document.querySelector(`[data-book-id="${bookId}"][data-type="${type}"]`);
    const button = bookElement.querySelector('.select-book-btn');
    
    // Sprawdź czy książka jest zablokowana
    if (bookElement.classList.contains('book-locked')) {
        return; // Nie pozwól na wybór zablokowanej książki
    }
    
    if (bookElement.classList.contains('selected')) {
        // Usuń z wybranych
        bookElement.classList.remove('selected');
        button.textContent = 'Wybierz';
        removeSelectedBook(bookId, type);
    } else {
        // Dodaj do wybranych
        bookElement.classList.add('selected');
        button.textContent = 'Usuń';
        addSelectedBook(bookId, type, bookElement);
    }
}

// Funkcja dodająca książkę do wybranych
function addSelectedBook(bookId, type, bookElement) {
    const containerId = type === 'my' ? 'selectedMyBooks' : 'selectedPartnerBooks';
    const container = document.getElementById(containerId);
    
    const selectedBookDiv = document.createElement('div');
    selectedBookDiv.className = 'selected-book-item';
    selectedBookDiv.dataset.bookId = bookId;
    selectedBookDiv.dataset.type = type;
    
    const bookInfo = bookElement.querySelector('.book-info').cloneNode(true);
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-selected-btn';
    removeBtn.textContent = '✕';
    removeBtn.onclick = () => toggleBookSelection(bookId, type);
    
    selectedBookDiv.appendChild(bookInfo);
    selectedBookDiv.appendChild(removeBtn);
    container.appendChild(selectedBookDiv);
}

// Funkcja usuwająca książkę z wybranych
function removeSelectedBook(bookId, type) {
    const containerId = type === 'my' ? 'selectedMyBooks' : 'selectedPartnerBooks';
    const container = document.getElementById(containerId);
    const selectedBook = container.querySelector(`[data-book-id="${bookId}"]`);
    
    if (selectedBook) {
        selectedBook.remove();
    }
}

// Funkcja automatycznie wybierająca książkę partnera
function selectPartnerBook(bookId) {
    // Poczekaj chwilę na załadowanie książek
    setTimeout(() => {
        toggleBookSelection(bookId, 'partner');
    }, 500);
}

// Funkcja zamykająca modal wymiany
function closeTradeModal() {
    const modal = document.getElementById('tradeModal');
    modal.style.display = 'none';
    
    // Wyczyść wybrane książki
    document.getElementById('selectedMyBooks').innerHTML = '';
    document.getElementById('selectedPartnerBooks').innerHTML = '';
    
    // Usuń klasy selected z wszystkich książek
    document.querySelectorAll('.trade-book-item.selected').forEach(item => {
        item.classList.remove('selected');
        const btn = item.querySelector('.select-book-btn');
        if (btn) btn.textContent = 'Wybierz';
    });
}

// Funkcja wysyłająca ofertę wymiany
async function submitTrade() {
    const selectedMyBooks = Array.from(document.querySelectorAll('#selectedMyBooks .selected-book-item'))
        .map(book => book.dataset.bookId);
    
    const selectedPartnerBooks = Array.from(document.querySelectorAll('#selectedPartnerBooks .selected-book-item'))
        .map(book => book.dataset.bookId);
    
    const partnerUsername = document.getElementById('partnerUserName').textContent;
    
    if (selectedMyBooks.length === 0 || selectedPartnerBooks.length === 0) {
		alert('Musisz wybrać przynajmniej jedną książkę z każdej strony do wymiany');
		return;
	}
    
    try {
        const response = await callApi('/api/user/trades', {
            method: 'POST',
            body: JSON.stringify({
                user2_id: partnerUsername,
                user1_books: selectedMyBooks,
                user2_books: selectedPartnerBooks
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            alert('Oferta wymiany została wysłana!');
            closeTradeModal();
            
            // Odśwież listę wymian jeśli jesteśmy na profilu
            if (typeof loadUserTrades === 'function') {
                loadUserTrades();
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas tworzenia wymiany');
        }
        
    } catch (error) {
        console.error('Błąd podczas tworzenia wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Funkcja pomocnicza do pobierania danych aktualnego użytkownika
async function getCurrentUser() {
    try {
        const response = await callApi('/api/me');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
    }
    return { username: 'Nieznany' };
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