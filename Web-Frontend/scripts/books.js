// books.js - Główny skrypt obsługi książek dla strony głównej
document.addEventListener('DOMContentLoaded', () => {
    loadAllBooks();  // jeśli masz, ładuje wszystkie książki na stronie głównej

    const token = localStorage.getItem('token');
    if (token) {
        initAddBookModal();
        initAddWishlistModal();
        loadUserWishlist();
        // Ładuj półkę zalogowanego użytkownika do domyślnego kontenera
        loadUserBooks('bookshelf');
    }

    // Sprawdź, czy jest kontener na półkę innego użytkownika (np. profil)
    const profileBookshelf = document.getElementById('userBookshelf');
    if (profileBookshelf) {
        // Pobierz userId (username) z URL
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        if (userId) {
            // Załaduj książki innego użytkownika do kontenera na profilu
            loadUserBooks('userBookshelf', userId);
        }
    }
});