// books.js - Główny skrypt obsługi książek dla strony głównej
document.addEventListener('DOMContentLoaded', () => {
    // Ładuj wszystkie książki dla każdego użytkownika (zalogowanego i niezalogowanego)
    loadAllBooks();
    
    // Sprawdzamy, czy użytkownik jest zalogowany
    const token = localStorage.getItem('token');
    if (token) {
        // Inicjalizacja modalu do dodawania książek
        initAddBookModal();
        
        // Pobierz książki po załadowaniu strony
        loadUserBooks();

        // Pobierz listę życzeń po załadowaniu strony
        loadWishlist();
    }
});