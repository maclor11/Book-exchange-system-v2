// ratingFrontend.js - Frontend functionality for user ratings

// Global variable to store current user ID for ratings
let currentUserIdForRatings = null;

// Initialize ratings functionality
function initRatings() {
    // This will be called from profilePage.js after user data is loaded
}

// Load and display user ratings
async function loadUserRatings(p_userId) {
    try {
        
        const token = localStorage.getItem('token');

        let userId = p_userId;

        if (userId === null) {
            try {
                const response = await fetch('/api/user/login', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const loginRes = await response.json();
                userId = loginRes.login;


            } catch (error) {
                console.error('Błąd pobierania loginu:', error);
            }
        }

        const response = await fetch(`/api/user/rating/${encodeURIComponent(userId)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const ratings = await response.json();
            displayUserRatings(ratings);
        } else {
            console.error('Błąd podczas ładowania ocen');
            displayUserRatings([]); // Show empty state
        }
    } catch (error) {
        console.error('Błąd podczas ładowania ocen:', error);
        displayUserRatings([]); // Show empty state
    }
}

// Display user ratings in the profile
function displayUserRatings(ratings) {
    const ratingsContainer = document.getElementById('ratingsList');

    if (!ratingsContainer) {
        console.error('Kontener ocen nie został znaleziony');
        return;
    }

    if (ratings.length === 0) {
        ratingsContainer.innerHTML = `
            <div class="no-ratings">
                <p>Ten użytkownik nie ma jeszcze żadnych ocen.</p>
            </div>
        `;
        return;
    }

    const ratingsHTML = `
        <div class="ratings-list">
            ${ratings.map(rating => createRatingElement(rating)).join('')}
        </div>
    `;

    ratingsContainer.innerHTML = ratingsHTML;
}

// Create HTML element for a single rating
function createRatingElement(rating) {
    
    return `
        <div class="rating-item" data-rating-id="${rating._id}">
            <div class="rating-header">
                <div class="rating-author">
                    <!-- <strong>${escapeHtml(rating.user_id._id)}</strong>  -->
                </div>
                <div class="rating-stars">${generateStars(rating.stars)}</div>
            </div>
            ${rating.message ? `
                <div class="rating-message">
                    <p>${escapeHtml(rating.message)}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Generate star display for rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    let starsHTML = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="star full">★</span>';
    }

    // Empty stars
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="star empty">☆</span>';
    }

    return starsHTML;
}

// Check if current user can delete a rating
function canDeleteRating(rating) {
    // This would need to check if current user is the author or admin
    // For now, let's assume we have access to current user info
    return currentUserIdForRatings === rating.user_id._id || window.currentUser?.is_admin;
}

// Open rating modal for a specific trade
function openRatingModal(tradeId, ratedUserId, otherUsername) {

    const modalHTML = `
        <div id="ratingModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeRatingModal()">&times;</span>
                <h2>Oceń użytkownika ${escapeHtml(otherUsername)}</h2>
                
                <form id="ratingForm" onsubmit="submitRating(event)">
                    <input type="hidden" id="ratingTradeId" value="${tradeId}">
                    <input type="hidden" id="ratedUserId" value="${ratedUserId}">
                    
                    <div class="rating-input-section">
                        <label for="ratingStars">Ocena:</label>
                        <div class="stars-input" id="starsInput">
                            ${[1, 2, 3, 4, 5].map(num => `
                                <span class="star-input" data-rating="${num}" onclick="selectRating(${num})">☆</span>
                            `).join('')}
                        </div>
                        <input type="hidden" id="selectedRating" required>
                    </div>
                    
                    <div class="rating-message-section">
                        <label for="ratingMessage">Komentarz (opcjonalnie):</label>
                        <textarea id="ratingMessage" maxlength="500" placeholder="Napisz coś o tej wymianie..."></textarea>
                        <div class="character-counter">
                            <span id="messageLength">0</span>/500
                        </div>
                    </div>
                    
                    <div class="rating-actions">
                        <button type="submit" class="btn-submit-rating">Dodaj ocenę</button>
                        <button type="button" onclick="closeRatingModal()" class="btn-cancel">Anuluj</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Remove existing rating modal if present
    const existingModal = document.getElementById('ratingModal');
    if (existingModal) {
        existingModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add character counter functionality
    const messageTextarea = document.getElementById('ratingMessage');
    const lengthCounter = document.getElementById('messageLength');

    messageTextarea.addEventListener('input', function () {
        lengthCounter.textContent = this.value.length;
    });

    document.getElementById('ratingModal').style.display = 'block';
}

// Close rating modal
function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.remove();
    }
}

// Handle star selection in rating modal
function selectRating(rating) {
    const starsContainer = document.getElementById('starsInput');
    const stars = starsContainer.querySelectorAll('.star-input');
    const hiddenInput = document.getElementById('selectedRating');

    // Reset all stars
    stars.forEach(star => {
        star.classList.remove('selected');
        star.textContent = '☆';
    });

    // Fill selected stars
    for (let i = 0; i < rating; i++) {
        stars[i].classList.add('selected');
        stars[i].textContent = '★';
    }

    hiddenInput.value = rating;
}

// Submit rating
async function submitRating(event) {
    event.preventDefault();

    const tradeId = document.getElementById('ratingTradeId').value;
    const ratedUserId = document.getElementById('ratedUserId').value;
    const stars = document.getElementById('selectedRating').value;
    const message = document.getElementById('ratingMessage').value;

    if (!stars) {
        alert('Proszę wybrać ocenę (gwiazdki)');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/rating', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rated_user_id: ratedUserId,
                trade_id: tradeId,
                message: message,
                stars: parseInt(stars)
            })
        });

        if (response.ok) {
            alert('Ocena została dodana pomyślnie!');
            closeRatingModal();

            // Refresh trades and ratings
            if (typeof loadUserTrades === 'function') {
                loadUserTrades();
            }

            // If we're on the rated user's profile, refresh their ratings
            const ownerUserId = getUserIdFromUrl();
            if (ownerUserId === ratedUserId) {
                loadUserRatings(ratedUserId);
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas dodawania oceny');
        }
    } catch (error) {
        console.error('Błąd podczas dodawania oceny:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Delete rating
async function deleteRating(ratingId) {
    if (!confirm('Czy na pewno chcesz usunąć tę ocenę?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/ratings/${ratingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Ocena została usunięta');

            // Refresh ratings display
            const ownerUserId = getUserIdFromUrl();
            if (ownerUserId) {
                loadUserRatings(ownerUserId);
            } else {
                // If on own profile, reload own ratings
                if (currentUserIdForRatings) {
                    loadUserRatings(currentUserIdForRatings);
                }
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Wystąpił błąd podczas usuwania oceny');
        }
    } catch (error) {
        console.error('Błąd podczas usuwania oceny:', error);
        alert('Problem z połączeniem z serwerem');
    }
}

// Check if user can rate a specific trade
async function canRateTrade(tradeId, otherUserId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/ratings/can-rate/${tradeId}/${otherUserId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return response.ok;
    } catch (error) {
        console.error('Błąd sprawdzania możliwości oceny:', error);
        return false;
    }
}

// Set current user ID for ratings functionality
function setCurrentUserForRatings(userId) {
    currentUserIdForRatings = userId;
}

// Helper function to add rating button to completed trades
function addRatingButtonToTrade(tradeId, otherUserId, otherUsername) {
    return `<button onclick="openRatingModal('${tradeId}', '${otherUserId}', '${otherUsername}')" class="btn-rate" title="Oceń użytkownika">
        ⭐ Oceń użytkownika
    </button>`;
}