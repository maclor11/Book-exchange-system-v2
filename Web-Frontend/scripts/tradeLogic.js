// tradeLogic.js - Logika zarządzania wymianami

function getCurrentUserId() {
    // Implementacja zależna od sposobu przechowywania danych użytkownika
    // Może być pobrane z localStorage, sessionStorage, lub globalnej zmiennej
    return window.currentUser?.id || localStorage.getItem('currentUserId');
}

// Funkcja ładująca wymiany użytkownika
async function loadUserTrades() {
    try {
        const response = await callApi('/api/user/trades');
        if (response.ok) {
            const trades = await response.json();
            displayUserTrades(trades);
        } else {
            console.error('Błąd podczas ładowania wymian');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania wymian:', error);
    }
}

// Funkcja wyświetlająca wymiany użytkownika
function displayUserTrades(trades) {
    const container = document.getElementById('userTrades');
    
    if (!container) return;
    
    if (trades.length === 0) {
        container.innerHTML = '<div class="no-trades">Brak aktywnych wymian</div>';
        return;
    }
    
    container.innerHTML = trades.map(trade => createTradeElement(trade)).join('');
}

// Funkcja tworząca element wymiany
function createTradeElement(trade) {
    const isInitiator = trade.isInitiator;
    const otherUser = isInitiator ? trade.user2 : trade.user1;
    const myBooks = isInitiator ? trade.user1.books : trade.user2.books;
    const otherBooks = isInitiator ? trade.user2.books : trade.user1.books;
    
    const statusText = getStatusText(trade);
    const statusClass = getStatusClass(trade.status);
    const areAllBooksAvailable = checkTradeBookAvailability(trade);
    
    return `
        <div class="trade-item ${!areAllBooksAvailable ? 'books-unavailable' : ''}" data-trade-id="${trade.id}">
            <div class="trade-header">
                <h4>Wymiana z ${escapeHtml(otherUser.username)}</h4>
                <span class="trade-status ${statusClass}">${statusText}</span>
                ${!areAllBooksAvailable ? '<span class="availability-warning">⚠ Niektóre książki niedostępne</span>' : ''}
            </div>
            
            <div class="trade-books">
                <div class="trade-books-section">
                    <h5>Twoje książki:</h5>
                    <div class="books-list">
                        ${myBooks.map(book => `
                            <div class="book-item-small ${book.is_locked && book.locked_by_trade_id?.toString() !== trade.id ? 'book-unavailable' : ''}">
                                ${book.is_locked && book.locked_by_trade_id?.toString() !== trade.id ? '<span class="lock-icon">🔒</span>' : ''}
                                <span class="book-title">${escapeHtml(book.title)}</span>
                                <span class="book-author">${escapeHtml(book.author)}</span>
                            </div>
                        `).join('')}
                        ${myBooks.length === 0 ? '<div class="no-books">Brak książek</div>' : ''}
                    </div>
                </div>
                
                <div class="trade-books-section">
                    <h5>Książki ${escapeHtml(otherUser.username)}:</h5>
                    <div class="books-list">
                        ${otherBooks.map(book => `
                            <div class="book-item-small ${book.is_locked && book.locked_by_trade_id?.toString() !== trade.id ? 'book-unavailable' : ''}">
                                ${book.is_locked && book.locked_by_trade_id?.toString() !== trade.id ? '<span class="lock-icon">🔒</span>' : ''}
                                <span class="book-title">${escapeHtml(book.title)}</span>
                                <span class="book-author">${escapeHtml(book.author)}</span>
                            </div>
                        `).join('')}
                        ${otherBooks.length === 0 ? '<div class="no-books">Brak książek</div>' : ''}
                    </div>
                </div>
            </div>
            
            <div class="trade-actions">
                ${getTradeActions(trade)}
            </div>
        </div>
    `;
}

// Funkcja zwracająca tekst statusu
function getStatusText(trade) {
    switch (trade.status) {
        case 'pending':
            if (trade.awaitingMyResponse) {
                return 'Oczekuje na Twoją decyzję';
            } else {
                return 'Oczekuje na odpowiedź';
            }
        case 'accepted':
            if (trade.myConfirmationStatus && trade.partnerConfirmationStatus) {
                return 'Ukończona przez obie strony';
            } else if (trade.myConfirmationStatus) {
                return 'Oczekuje na potwierdzenie partnera';
            } else if (trade.partnerConfirmationStatus) {
                return 'Partner potwierdził - oczekuje na Ciebie';
            } else {
                return 'Zaakceptowana - oczekuje na potwierdzenie ukończenia';
            }
        case 'rejected':
            return 'Odrzucona';
        case 'completed':
            return 'Ukończona';
        case 'cancelled':
            return 'Anulowana';
        default:
            return 'Nieznany status';
    }
}

// Funkcja zwracająca klasę CSS dla statusu
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'status-pending';
        case 'accepted':
            return 'status-accepted';
        case 'rejected':
            return 'status-rejected';
        case 'completed':
            return 'status-completed';
		case 'cancelled':
            return 'status-cancelled';
        default:
            return 'status-unknown';
    }
}

// Funkcja zwracająca dostępne akcje dla wymiany
function getTradeActions(trade) {
    const actions = [];
    
    // Sprawdź czy wszystkie książki w wymianie są dostępne
    const areAllBooksAvailable = checkTradeBookAvailability(trade);
    
    if (trade.status === 'pending') {
        if (trade.awaitingMyResponse) {
            // Osoba, która ma odpowiedzieć na ofertę
            if (areAllBooksAvailable) {
                actions.push(`<button onclick="acceptTrade('${trade.id}')" class="btn-accept">Akceptuj</button>`);
            } else {
                actions.push(`<button class="btn-accept disabled" disabled title="Niektóre książki są już niedostępne">Akceptuj (niedostępne książki)</button>`);
            }
            actions.push(`<button onclick="modifyTrade('${trade.id}')" class="btn-modify">Kontroferta</button>`);
            actions.push(`<button onclick="rejectTrade('${trade.id}')" class="btn-reject">Odrzuć</button>`);
        } else {
            // Osoba, która czeka na odpowiedź
            actions.push(`<button onclick="modifyTrade('${trade.id}')" class="btn-modify">Modyfikuj</button>`);
            if (trade.isInitiator) {
                // Tylko pierwotny inicjator może usunąć
                actions.push(`<button onclick="deleteTrade('${trade.id}')" class="btn-delete">Usuń</button>`);
            }
        }
        
        // Dodaj ostrzeżenie jeśli książki są niedostępne
        if (!areAllBooksAvailable) {
            actions.push(`<div class="warning-message">⚠ Niektóre książki w tej wymianie są już niedostępne</div>`);
        }
    } else if (trade.status === 'accepted') {
        // Pozostała logika bez zmian...
        actions.push(`<button onclick="cancelTrade('${trade.id}')" class="btn-cancel">Anuluj wymianę</button>`);
        
        if (trade.myConfirmationStatus && trade.partnerConfirmationStatus) {
            actions.push(`<span class="completion-status">✓ Wymiana ukończona przez obie strony</span>`);
        } else if (trade.myConfirmationStatus) {
            actions.push(`<span class="completion-status">✓ Potwierdziłeś ukończenie. Oczekiwanie na partnera.</span>`);
        } else if (trade.partnerConfirmationStatus) {
            actions.push(`<span class="completion-status">Partner potwierdził ukończenie.</span>`);
            actions.push(`<button onclick="completeTrade('${trade.id}')" class="btn-complete">Potwierdź ukończenie</button>`);
        } else {
            actions.push(`<button onclick="completeTrade('${trade.id}')" class="btn-complete">Potwierdź ukończenie</button>`);
        }
    }
    
    // Zawsze można zobaczyć szczegóły
    actions.push(`<button onclick="viewTradeDetails('${trade.id}')" class="btn-details">Szczegóły</button>`);
    
    return actions.join('');
}

// Funkcje obsługi akcji wymian

// Akceptacja wymiany
async function acceptTrade(tradeId) {
    if (!confirm('Czy na pewno chcesz zaakceptować tę wymianę?')) return;
    
    try {
        const response = await callApi(`/api/user/trades/${tradeId}/accept`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Wymiana została zaakceptowana!');
            loadUserTrades();
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas akceptacji wymiany');
        }
    } catch (error) {
        console.error('Błąd podczas akceptacji wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Odrzucenie wymiany
async function rejectTrade(tradeId) {
    if (!confirm('Czy na pewno chcesz odrzucić tę wymianę?')) return;
    
    try {
        const response = await callApi(`/api/user/trades/${tradeId}/reject`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Wymiana została odrzucona');
            loadUserTrades();
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas odrzucania wymiany');
        }
    } catch (error) {
        console.error('Błąd podczas odrzucania wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Oznaczenie wymiany jako ukończonej
async function completeTrade(tradeId) {
    if (!confirm('Czy na pewno wymiana została ukończona? Ta akcja jest nieodwracalna.')) return;
    
    try {
        const response = await callApi(`/api/user/trades/${tradeId}/complete`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Wymiana została oznaczona jako ukończona! Książki zostały przeniesione.');
            loadUserTrades();
            
            // Odśwież także półkę z książkami jeśli jesteśmy na profilu
            if (typeof loadUserBooks === 'function') {
                loadUserBooks('userBookshelf');
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas kończenia wymiany');
        }
    } catch (error) {
        console.error('Błąd podczas kończenia wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Usunięcie wymiany
async function deleteTrade(tradeId) {
    if (!confirm('Czy na pewno chcesz usunąć tę wymianę?')) return;
    
    try {
        const response = await callApi(`/api/user/trades/${tradeId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Wymiana została usunięta');
            loadUserTrades();
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas usuwania wymiany');
        }
    } catch (error) {
        console.error('Błąd podczas usuwania wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Modyfikacja wymiany (kontroferta)
async function modifyTrade(tradeId) {
    try {
        // Pobierz szczegóły aktualnej wymiany
        const response = await callApi(`/api/user/trades/${tradeId}`);
        if (!response.ok) {
            throw new Error('Nie udało się pobrać szczegółów wymiany');
        }
        
        const trade = await response.json();
        await openModifyTradeModal(trade);
        
    } catch (error) {
        console.error('Błąd podczas modyfikacji wymiany:', error);
        alert('Nie udało się otworzyć edycji wymiany');
    }
}

async function cancelTrade(tradeId) {
    if (!confirm('Czy na pewno chcesz anulować tę wymianę? Książki będą ponownie dostępne do wymiany.')) return;
    
    try {
        const response = await callApi(`/api/user/trades/${tradeId}/cancel`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            alert('Wymiana została anulowana. Książki są ponownie dostępne.');
            loadUserTrades();
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas anulowania wymiany');
        }
    } catch (error) {
        console.error('Błąd podczas anulowania wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Funkcja otwierająca modal modyfikacji wymiany
async function openModifyTradeModal(trade) {
    // Utwórz modal modyfikacji (podobny do tworzenia nowej wymiany)
    initTradeModal();
    
    const modal = document.getElementById('tradeModal');
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('submitTradeBtn');
    
    modalTitle.textContent = 'Modyfikuj wymianę';
    submitBtn.textContent = 'Zapisz zmiany';
    
    // Ustaw dane użytkowników
    const currentUserName = document.getElementById('currentUserName');
    const partnerUserName = document.getElementById('partnerUserName');
    
    const isInitiator = trade.isInitiator;
    const otherUser = isInitiator ? trade.user2 : trade.user1;
    
    // Użyj właściwych nazw użytkowników
    currentUserName.textContent = isInitiator ? trade.user1.username : trade.user2.username;
    partnerUserName.textContent = otherUser.username;
    
    // Załaduj książki
    await loadBooksForTrade(currentUserName.textContent, partnerUserName.textContent);
    
    // Określ właściwe książki na podstawie tego, czy użytkownik jest inicjatorem
    const myBooks = isInitiator ? trade.user1.books : trade.user2.books;
    const otherBooks = isInitiator ? trade.user2.books : trade.user1.books;
    
    // Automatycznie wybierz aktualnie wybrane książki
    myBooks.forEach(book => {
        setTimeout(() => toggleBookSelection(book.id, 'my'), 500);
    });
    
    otherBooks.forEach(book => {
        setTimeout(() => toggleBookSelection(book.id, 'partner'), 500);
    });
    
    // Ustaw funkcję submit na modyfikację z odpowiednimi parametrami
    submitBtn.onclick = () => submitTradeModification(trade.id, isInitiator);
    
    modal.style.display = 'block';
}

// Funkcja wysyłająca modyfikację wymiany
async function submitTradeModification(tradeId, isInitiator) {
    const selectedMyBooks = Array.from(document.querySelectorAll('#selectedMyBooks .selected-book-item'))
        .map(book => book.dataset.bookId);
    
    const selectedPartnerBooks = Array.from(document.querySelectorAll('#selectedPartnerBooks .selected-book-item'))
        .map(book => book.dataset.bookId);
    
    // Sprawdź czy wybrano przynajmniej jedną książkę
    if (selectedMyBooks.length === 0 && selectedPartnerBooks.length === 0) {
        alert('Musisz wybrać przynajmniej jedną książkę do wymiany');
        return;
    }
    
    // Określ które książki należą do user1 a które do user2 na podstawie tego, czy jesteśmy inicjatorem
    let user1_books, user2_books;
    
    if (isInitiator) {
        // Jeśli jestem inicjatorem (user1), moje książki to user1_books
        user1_books = selectedMyBooks;
        user2_books = selectedPartnerBooks;
    } else {
        // Jeśli nie jestem inicjatorem (jestem user2), moje książki to user2_books
        user1_books = selectedPartnerBooks;
        user2_books = selectedMyBooks;
    }
    
    try {
        const response = await callApi(`/api/user/trades/${tradeId}`, {
            method: 'PUT',
            body: JSON.stringify({
                user1_books: user1_books,
                user2_books: user2_books
            })
        });
        
        if (response.ok) {
            alert('Wymiana została zmodyfikowana!');
            closeTradeModal();
            loadUserTrades();
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas modyfikacji wymiany');
        }
        
    } catch (error) {
        console.error('Błąd podczas modyfikacji wymiany:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Funkcja wyświetlająca szczegóły wymiany
async function viewTradeDetails(tradeId) {
    try {
        const response = await callApi(`/api/user/trades/${tradeId}`);
        if (!response.ok) {
            throw new Error('Nie udało się pobrać szczegółów wymiany');
        }
        
        const trade = await response.json();
        showTradeDetailsModal(trade);
        
    } catch (error) {
        console.error('Błąd podczas pobierania szczegółów wymiany:', error);
        alert('Nie udało się pobrać szczegółów wymiany');
    }
}

// Funkcja pokazująca modal ze szczegółami wymiany
function showTradeDetailsModal(trade) {
    const modalHTML = `
        <div id="tradeDetailsModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeTradeDetailsModal()">&times;</span>
                <h2>Szczegóły wymiany</h2>
                
                <div class="trade-details-content">
                    <div class="trade-info">
                        <p><strong>Status:</strong> ${getStatusText(trade.status, trade.isInitiator)}</p>
                        <p><strong>Inicjator:</strong> ${escapeHtml(trade.user1.username)}</p>
                        <p><strong>Partner:</strong> ${escapeHtml(trade.user2.username)}</p>
                    </div>
                    
                    <div class="trade-books-details">
                        <div class="books-section">
                            <h4>Książki ${escapeHtml(trade.user1.username)}:</h4>
                            ${trade.user1.books.map(book => `
                                <div class="book-detail">
                                    <strong>${escapeHtml(book.title)}</strong><br>
                                    Autor: ${escapeHtml(book.author)}<br>
                                    Stan: ${escapeHtml(book.condition)}<br>
                                    Okładka: ${escapeHtml(book.cover_type)}
                                </div>
                            `).join('')}
                            ${trade.user1.books.length === 0 ? '<p>Brak książek</p>' : ''}
                        </div>
                        
                        <div class="books-section">
                            <h4>Książki ${escapeHtml(trade.user2.username)}:</h4>
                            ${trade.user2.books.map(book => `
                                <div class="book-detail">
                                    <strong>${escapeHtml(book.title)}</strong><br>
                                    Autor: ${escapeHtml(book.author)}<br>
                                    Stan: ${escapeHtml(book.condition)}<br>
                                    Okładka: ${escapeHtml(book.cover_type)}
                                </div>
                            `).join('')}
                            ${trade.user2.books.length === 0 ? '<p>Brak książek</p>' : ''}
                        </div>
                    </div>
                </div>
                
                <button onclick="closeTradeDetailsModal()" class="btn-close">Zamknij</button>
            </div>
        </div>
    `;
    
    // Usuń poprzedni modal jeśli istnieje
    const existingModal = document.getElementById('tradeDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('tradeDetailsModal').style.display = 'block';
}

// Funkcja zamykająca modal szczegółów
function closeTradeDetailsModal() {
    const modal = document.getElementById('tradeDetailsModal');
    if (modal) {
        modal.remove();
    }
}

function resetTradeModal() {
    const modal = document.getElementById('tradeModal');
    if (!modal) return;
    
    // Resetuj tytuł i przycisk
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('submitTradeBtn');
    
    modalTitle.textContent = 'Wymiana książek';
    submitBtn.textContent = 'Złóż ofertę wymiany';
    submitBtn.onclick = submitTrade;
    
    // Wyczyść wszystkie wybrane książki
    document.getElementById('selectedMyBooks').innerHTML = '';
    document.getElementById('selectedPartnerBooks').innerHTML = '';
    
    // Usuń klasy selected z wszystkich książek
    document.querySelectorAll('.trade-book-item.selected').forEach(item => {
        item.classList.remove('selected');
        const btn = item.querySelector('.select-book-btn');
        if (btn) btn.textContent = 'Wybierz';
    });
}

// Funkcja sprawdzająca dostępność książek
function checkTradeBookAvailability(trade) {
    // Sprawdź czy wszystkie książki użytkownika 1 są dostępne
    const user1BooksAvailable = trade.user1.books.every(book => !book.is_locked || book.locked_by_trade_id?.toString() === trade.id);
    
    // Sprawdź czy wszystkie książki użytkownika 2 są dostępne
    const user2BooksAvailable = trade.user2.books.every(book => !book.is_locked || book.locked_by_trade_id?.toString() === trade.id);
    
    return user1BooksAvailable && user2BooksAvailable;
}
