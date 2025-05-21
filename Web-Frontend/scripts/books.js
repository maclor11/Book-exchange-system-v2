// books.js - Główny skrypt obsługi książek dla strony głównej
document.addEventListener('DOMContentLoaded', () => {
    // Ładuj wszystkie książki dla każdego użytkownika (zalogowanego i niezalogowanego)
    loadAllBooks();
    
    // Sprawdzamy, czy użytkownik jest zalogowany
    const token = localStorage.getItem('token');
    if (token) {
        // Inicjalizacja modalu do dodawania książek
        initAddBookModal();

        // Inicjalizacja modelu do dodawania ksiazek do listy zyczen
        initAddWishlistModal();
        
        // Pobierz książki po załadowaniu strony
        loadUserBooks();

        // Pobierz listę życzeń po załadowaniu strony
        loadWishlist();
    }
});