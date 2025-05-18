document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const loggedInElements = document.querySelectorAll('.logged-in');
    const loggedOutElements = document.querySelectorAll('.logged-out');

    // Przekieruj zalogowanych użytkowników ze stron logowania/rejestracji
    if (token && (window.location.pathname === '/login.html' || window.location.pathname === '/register.html')) {
        window.location.href = '/';
        return;  // Zatrzymaj dalsze wykonywanie
    }

    if (token) {
        try {
            const response = await fetch('/api/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();

                const usernameElement = document.getElementById('username');
                const usernameElement2 = document.getElementById('username2');
                if (usernameElement) {
                    usernameElement.textContent = userData.username;
                }
                if (usernameElement2) {
                    usernameElement2.textContent = "Witaj, " + userData.username + "!";
                }

                loggedInElements.forEach(el => el.style.display = 'block');
                loggedOutElements.forEach(el => el.style.display = 'none');
            } else {
                throw new Error('Sesja wygasła');
            }
        } catch (error) {
            console.error('Błąd autentykacji:', error);
            logout();
        }
    } else {
        loggedInElements.forEach(el => el.style.display = 'none');
        loggedOutElements.forEach(el => el.style.display = 'block');
    }
});

// Dodaj obsługę błędów dla wszystkich API
async function callApi(endpoint, options = {}) {
    try {
        console.log(`Wywołanie API: ${endpoint}`, options);
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined
            }
        });

        console.log(`Status odpowiedzi: ${response.status}`);
        
        if (response.status === 401) {
            console.log('Autoryzacja wygasła lub jest nieprawidłowa');
            logout();
        }
        
        return response;
    } catch (error) {
        console.error('Błąd API:', error);
        throw error;
    }
}

// Aktualizacja funkcji formularza
document.addEventListener('submit', async (e) => {
    const form = e.target;
    
    // Sprawdź czy to formularz logowania lub rejestracji
    if (form.matches('#loginForm, #registerForm')) {
        e.preventDefault();
        
        // Pokaż stan ładowania
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = form.id === 'loginForm' ? 'Logowanie...' : 'Rejestracja...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            let endpoint = '';
            if (form.id === 'loginForm') {
                endpoint = '/api/login';
            } else if (form.id === 'registerForm') {
                endpoint = '/api/register';
            }
            
            console.log(`Wysyłanie formularza do ${endpoint}`, data);
            
            const response = await callApi(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                if (form.id === 'loginForm') {
                    const { token } = await response.json();
                    localStorage.setItem('token', token);
                    window.location.href = '/';
                } else if (form.id === 'registerForm') {
                    alert('Rejestracja przebiegła pomyślnie. Możesz się teraz zalogować.');
                    window.location.href = '/login.html';
                }
            } else {
                try {
                    const errorText = await response.text();
                    try {
                        const errorData = JSON.parse(errorText);
                        alert(errorData.error || 'Nieznany błąd');
                    } catch (jsonError) {
                        console.error('Odpowiedź nie jest poprawnym JSON:', errorText);
                        alert('Wystąpił błąd podczas przetwarzania odpowiedzi.');
                    }
                } catch (textError) {
                    console.error('Nie można odczytać treści odpowiedzi:', textError);
                    alert('Nieznany błąd podczas przetwarzania odpowiedzi.');
                }
            }
        } catch (error) {
            console.error('Błąd podczas wysyłania formularza:', error);
            alert('Problem z połączeniem z serwerem.');
        } finally {
            // Przywróć stan przycisku
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}