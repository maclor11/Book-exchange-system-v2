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
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                ...options.headers
            }
        });

        if (response.status === 401) logout();
        return response;
    } catch (error) {
        console.error('Błąd API:', error);
        throw error;
    }
}

// Aktualizacja funkcji formularza
document.addEventListener('submit', async (e) => {
    if (e.target.matches('form')) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await callApi(`/api${e.target.getAttribute('action')}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (response.ok) {
                if (e.target.id === 'loginForm') {
                    const { token } = await response.json();
                    localStorage.setItem('token', token);
                    window.location.href = '/mainpage.html';
                } else if (e.target.id === 'registerForm') {
                    window.location.href = '/login.html'
                } else {
                    window.location.reload();
                }
            } else {
                const error = await response.json();
                alert(error.error || 'Nieznany błąd');
            }
        } catch (error) {
            alert('Problem z połączeniem');
        }
    }
});

// Funkcja obsługująca odpowiedź z Google Sign-In
function handleGoogleSignIn(response) {
    try {
        console.log("Google Sign-In zakończony pomyślnie", response);
        
        if (!response || !response.credential) {
            console.error("Brak poświadczenia w odpowiedzi Google:", response);
            alert("Nieprawidłowa odpowiedź z Google. Brak poświadczenia.");
            return;
        }
        
        const credential = response.credential;
        console.log("Poświadczenie Google otrzymane:", credential.substring(0, 20) + "...");
        
        // Wysyłamy token ID do naszego API
        fetch('/api/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: credential })
        })
        .then(response => {
            console.log("Status odpowiedzi API:", response.status);
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Problem z autoryzacją Google');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Logowanie Google zakończone sukcesem:", data);
            localStorage.setItem('token', data.token);
            window.location.href = '/mainpage.html';
        })
        .catch(error => {
            console.error('Google Sign-In error:', error);
            alert('Problem z logowaniem przez Google: ' + error.message);
        });
    } catch (error) {
        console.error('Google Sign-In error:', error);
        alert('Problem z logowaniem przez Google: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}