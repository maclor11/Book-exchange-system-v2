document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const loadLogin = async () => {
        try {
            const response = await fetch('/api/user/login', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const loginRes = await response.json();
            const loginPlacement = document.getElementById("login");
            
            if(loginRes.login == null ) {
                loginPlacement.textContent = "Brak loginu";
            } else {
                loginPlacement.textContent = loginRes.login;
            }

        } catch (error) {
            console.error('Błąd pobierania loginu:', error);
        }
    };

    const loadProfilePicture = async () => {
        try {
            const response = await fetch('/api/user/profile-picture', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pictureRes = await response.json();
            const profileImage = document.getElementById("profileImage");
            
            if(pictureRes.profilePicturePath) {
                // Ścieżka jest już relatywna od /uploads
                profileImage.src = `/uploads/${pictureRes.profilePicturePath}`;
            }

        } catch (error) {
            console.error('Błąd pobierania zdjęcia profilowego:', error);
        }
    };
	
	const checkAdminStatus = async () => {
        try {
            const response = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const userData = await response.json();
                if (userData.is_admin) {
                    document.getElementById('adminPanelBtn').style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Błąd sprawdzania statusu administratora:', error);
        }
    };

    await loadLogin();
    await loadProfilePicture();
	await checkAdminStatus();
	
    initAddBookModal();
	loadUserBooks('userBookshelf');
    loadUserWishlist('userWishlist');
});

function showPanel(type) {
    const panel = document.getElementById("editPanel");
    const form = document.getElementById("formEditId");
    
    // Usuń wszystkie poprzednie event listenery
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Pobierz nowy formularz po klonowaniu
    const updatedForm = document.getElementById("formEditId");
    
    // Usuń wszystkie dzieci formularza z wyjątkiem ostatniego div (przyciski)
    const buttonsContainer = updatedForm.querySelector('.editContainerData');
    updatedForm.innerHTML = '';
    updatedForm.appendChild(buttonsContainer);
    
    panel.classList.add("active");
    
    if (type === "login") {
        // Tworzenie pola nowego loginu
        const loginLabel = document.createElement("label");
        loginLabel.setAttribute("for", "mainInput");
        loginLabel.textContent = "Nowy login:";
        updatedForm.insertBefore(loginLabel, buttonsContainer);
        
        const loginInput = document.createElement("input");
        loginInput.type = "text";
        loginInput.id = "mainInput";
        loginInput.placeholder = "np. janusz123";
        loginInput.required = true;
        updatedForm.insertBefore(loginInput, buttonsContainer);
        updatedForm.insertBefore(document.createElement("br"), buttonsContainer);
        
        // Tworzenie pola hasła (na końcu)
        const passwordLabel = document.createElement("label");
        passwordLabel.setAttribute("for", "password");
        passwordLabel.textContent = "Obecne hasło:";
        updatedForm.insertBefore(passwordLabel, buttonsContainer);
        
        const passwordInput = document.createElement("input");
        passwordInput.type = "password";
        passwordInput.id = "password";
        passwordInput.required = true;
        updatedForm.insertBefore(passwordInput, buttonsContainer);
        updatedForm.insertBefore(document.createElement("br"), buttonsContainer);
        
        // Dodaj event listener dla loginu
        updatedForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            await editLogin();
        });
    }
    else if (type === "haslo") {
        // Tworzenie pola nowego hasła
        const newPassLabel = document.createElement("label");
        newPassLabel.setAttribute("for", "newPassword");
        newPassLabel.textContent = "Nowe hasło:";
        updatedForm.insertBefore(newPassLabel, buttonsContainer);
        
        const newPassInput = document.createElement("input");
        newPassInput.type = "password";
        newPassInput.id = "newPassword";
        newPassInput.required = true;
        updatedForm.insertBefore(newPassInput, buttonsContainer);
        updatedForm.insertBefore(document.createElement("br"), buttonsContainer);
        
        // Tworzenie pola potwierdzenia nowego hasła
        const confirmPassLabel = document.createElement("label");
        confirmPassLabel.setAttribute("for", "confirmPassword");
        confirmPassLabel.textContent = "Potwierdź nowe hasło:";
        updatedForm.insertBefore(confirmPassLabel, buttonsContainer);
        
        const confirmPassInput = document.createElement("input");
        confirmPassInput.type = "password";
        confirmPassInput.id = "confirmPassword";
        confirmPassInput.required = true;
        updatedForm.insertBefore(confirmPassInput, buttonsContainer);
        updatedForm.insertBefore(document.createElement("br"), buttonsContainer);
        
        // Tworzenie pola starego hasła (na końcu)
        const oldPassLabel = document.createElement("label");
        oldPassLabel.setAttribute("for", "currentPassword");
        oldPassLabel.textContent = "Obecne hasło:";
        updatedForm.insertBefore(oldPassLabel, buttonsContainer);
        
        const oldPassInput = document.createElement("input");
        oldPassInput.type = "password";
        oldPassInput.id = "currentPassword";
        oldPassInput.required = true;
        updatedForm.insertBefore(oldPassInput, buttonsContainer);
        updatedForm.insertBefore(document.createElement("br"), buttonsContainer);
        
        // Dodaj event listener dla hasła
        updatedForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Sprawdź czy nowe hasła są identyczne
            const newPassword = document.getElementById("newPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            
            if (newPassword !== confirmPassword) {
                alert("Hasła nie są identyczne. Proszę wprowadzić takie same hasła.");
                return;
            }
            
            await editPassword();
        });
    }
}

function showPhotoPanel() {
    const panel = document.getElementById("photoPanel");
    const form = document.getElementById("formPhotoId");
    
    // Usuń wszystkie poprzednie event listenery przez zastąpienie elementu
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Dodaj nowy event listener
    document.getElementById("formPhotoId").addEventListener('submit', editProfilePicture);
    panel.classList.add("active");
}

async function editLogin() {
    const token = localStorage.getItem('token');
    const input = document.getElementById("mainInput");
    const password = document.getElementById("password");
    
    try {
        const response = await fetch('/api/user/login', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'  
            },
            body: JSON.stringify({
                username: input.value,
                password: password.value  // Zakładam, że API wymaga hasła do weryfikacji
            })
        });

        if (response.ok) {
            const loginRes = await response.json();
            const loginPlacement = document.getElementById("login");

            if(loginRes.username == null ) {
                loginPlacement.textContent = "Brak loginu";
            } else {
                loginPlacement.textContent = loginRes.username;
            }
            closePanel();
            // Usuń alert - zmiana będzie widoczna na stronie
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd');
        }

    } catch (error) {
        console.error('Błąd zmiany loginu:', error);
        alert('Błąd podczas zmiany loginu');
    }
}

async function editPassword() {
    const token = localStorage.getItem('token');
    const newPassword = document.getElementById("newPassword");
    const currentPassword = document.getElementById("currentPassword");
    
    try {
        const response = await fetch('/api/user/password', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'  
            },
            body: JSON.stringify({
                newPassword: newPassword.value, 
                oldPassword: currentPassword.value
            })
        });

        if (response.ok) {
            const passwordRes = await response.json();
            closePanel();
            // Pokaż komunikat sukcesu tylko dla zmiany hasła, bo nie ma wizualnej informacji zwrotnej
            alert('Hasło zostało pomyślnie zmienione');
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd');
        }

    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        alert('Błąd podczas zmiany hasła');
    }
}

async function editProfilePicture(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    const fileInput = document.getElementById("photoInput");
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Proszę wybrać plik');
        return;
    }
    
    // Sprawdź rozmiar pliku (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        alert('Plik jest za duży. Maksymalny rozmiar to 5MB');
        return;
    }
    
    // Sprawdź typ pliku
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        alert('Dozwolone są tylko pliki obrazowe (JPEG, PNG, GIF)');
        return;
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
        const response = await fetch('/api/user/profile-picture', {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            const profileImage = document.getElementById("profileImage");
            
            // Dodaj timestamp do URL żeby wymusić odświeżenie obrazu
            profileImage.src = `/uploads/${result.profilePicturePath}?t=${Date.now()}`;
            
            closePhotoPanel();
            // Usuń alert - zmiana zdjęcia jest widoczna na stronie
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd');
        }

    } catch (error) {
        console.error('Błąd zmiany zdjęcia profilowego:', error);
        alert('Błąd podczas zmiany zdjęcia profilowego');
    }
}

function closePanel() {
    document.getElementById("editPanel").classList.remove("active");
    // Nie musimy ręcznie czyścić pól, ponieważ będą one tworzone na nowo przy każdym otwarciu panelu
}

function closePhotoPanel() {
    document.getElementById("photoPanel").classList.remove("active");
    document.getElementById("photoInput").value = "";
}

function open_mainpage() {
    window.location.pathname = '/mainpage.html';
}

function goToAdminPanel() {
    window.location.href = '/adminPanel.html';
}