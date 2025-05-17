document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Sprawdzenie uprawnień użytkownika
        const response = await fetch('/api/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            
            // Pokaż odpowiednie elementy w zależności od uprawnień
            const adminElements = document.querySelectorAll('.admin-only');
            const nonAdminElements = document.querySelectorAll('.non-admin');
            
            if (userData.is_admin) {
                adminElements.forEach(el => el.style.display = 'block');
                nonAdminElements.forEach(el => el.style.display = 'none');
                
                // Załaduj listę użytkowników
                loadUsers();
            } else {
                adminElements.forEach(el => el.style.display = 'none');
                nonAdminElements.forEach(el => el.style.display = 'block');
            }
        } else {
            throw new Error('Sesja wygasła');
        }
    } catch (error) {
        console.error('Błąd autentykacji:', error);
        logout();
    }
});

// Globalne zmienne do paginacji
let currentPage = 1;
let totalPages = 1;
let usersPerPage = 10;
let currentSearchQuery = '';
let selectedUserId = null;

// Funkcja ładująca użytkowników
async function loadUsers(page = 1, searchQuery = '') {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users?page=${page}&limit=${usersPerPage}&search=${searchQuery}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // Aktualizuj zmienne paginacji
            currentPage = page;
            totalPages = Math.ceil(data.total / usersPerPage);
            currentSearchQuery = searchQuery;
            
            // Aktualizuj UI paginacji
            updatePaginationUI();
            
            // Wypełnij tabelę użytkowników
            populateUsersTable(data.users);
        } else if (response.status === 403) {
            alert('Brak uprawnień administratora');
            window.location.href = '/profilePage.html';
        } else {
            throw new Error('Błąd pobierania użytkowników');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas pobierania listy użytkowników');
    }
}

// Funkcja aktualizująca interfejs paginacji
function updatePaginationUI() {
    document.getElementById('pageInfo').textContent = `Strona ${currentPage} z ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Funkcja wypełniająca tabelę użytkowników
function populateUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // ID użytkownika
        const idCell = document.createElement('td');
        idCell.textContent = user._id;
        row.appendChild(idCell);
        
        // Login użytkownika
        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.username;
        row.appendChild(usernameCell);
        
        // Status administratora
        const isAdminCell = document.createElement('td');
        isAdminCell.textContent = user.is_admin ? 'Tak' : 'Nie';
        row.appendChild(isAdminCell);
        
        // Akcje
        const actionsCell = document.createElement('td');
        actionsCell.className = 'user-actions';
        
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.textContent = 'Edytuj';
        editButton.onclick = () => openEditUserModal(user);
        actionsCell.appendChild(editButton);
        
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
    });
}

// Funkcja wyszukiwania użytkowników
function searchUsers() {
    const searchQuery = document.getElementById('userSearchInput').value.trim();
    loadUsers(1, searchQuery);
}

// Obsługa klawisza Enter w polu wyszukiwania
document.getElementById('userSearchInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUsers();
    }
});

// Funkcje nawigacji po stronach
function loadPreviousPage() {
    if (currentPage > 1) {
        loadUsers(currentPage - 1, currentSearchQuery);
    }
}

function loadNextPage() {
    if (currentPage < totalPages) {
        loadUsers(currentPage + 1, currentSearchQuery);
    }
}

// Funkcje do obsługi modalnego okna edycji użytkownika
function openEditUserModal(user) {
    // Zapisz ID edytowanego użytkownika
    selectedUserId = user._id;
    
    // Wypełnij formularz danymi użytkownika
    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editIsAdmin').checked = user.is_admin;
    document.getElementById('editPassword').value = ''; // Zawsze puste dla bezpieczeństwa
    
    // Pokaż modalne okno
    document.getElementById('editUserModal').style.display = 'block';
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    selectedUserId = null;
}

// Obsługa formularza edycji użytkownika
document.getElementById('editUserForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUsername').value;
    const isAdmin = document.getElementById('editIsAdmin').checked;
    const password = document.getElementById('editPassword').value;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                is_admin: isAdmin,
                password: password || undefined // Wysyłaj hasło tylko gdy zostało wprowadzone
            })
        });
        
        if (response.ok) {
            alert('Użytkownik został zaktualizowany');
            closeEditUserModal();
            loadUsers(currentPage, currentSearchQuery); // Odśwież listę
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd podczas aktualizacji użytkownika');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas aktualizacji użytkownika');
    }
});

// Funkcje do obsługi usuwania użytkownika
function confirmDeleteUser() {
    closeEditUserModal();
    document.getElementById('confirmDeleteModal').style.display = 'block';
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none';
}

async function deleteUser() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${selectedUserId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Użytkownik został usunięty');
            closeConfirmDeleteModal();
            
            // Odświeżenie listy użytkowników
            // Jeśli usunięto ostatniego użytkownika na stronie, wróć do poprzedniej strony
            const expectedTotalUsers = (currentPage - 1) * usersPerPage;
            if (expectedTotalUsers === 0 && currentPage > 1) {
                loadUsers(currentPage - 1, currentSearchQuery);
            } else {
                loadUsers(currentPage, currentSearchQuery);
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd podczas usuwania użytkownika');
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas usuwania użytkownika');
    }
}

// Funkcja przekierowania do strony profilu
function goToProfilePage() {
    window.location.href = '/profilePage.html';
}