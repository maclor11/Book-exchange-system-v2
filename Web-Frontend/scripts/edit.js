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
            loginPlacement.textContent = loginRes.login;

            if(loginRes.login == null ) {
                loginPlacement.textContent = "Brak loginu";
            } else {
                loginPlacement.textContent = loginRes.login;
            }

        } catch (error) {
            console.error('Błąd pobierania loginu:', error);
        }
    };

    const loadEmail = async () => {
        try {
            const response = await fetch('/api/user/email', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const emailRes = await response.json();
            const emailPlacement = document.getElementById("email");

            if(emailRes.email == null ) {
                emailPlacement.textContent = "Brak email";
            } else {
            emailPlacement.textContent = emailRes.email;
            }

        } catch (error) {
            console.error('Błąd pobierania email:', error);
        }
    };

    await loadLogin();
    await loadEmail();
});

function showPanel(type) {
    const panel = document.getElementById("editPanel");
    const label = document.getElementById("inputLabel");
    const input = document.getElementById("mainInput");
    const inputP = document.getElementById("passwordInput");
    const save = document.getElementById("saveButton");
    const form = document.getElementById("formEditId");
    form.onsubmit = e => {
        e.preventDefault();
		e.stopImmediatePropagation();
        console.log("fddgdh")
    };
    panel.classList.add("active");
    if (type === "email") {
        label.textContent = "Nowy e-mail:";
        input.type = "email";
        input.placeholder = "np. janusz@domena.pl";
        inputP.textContent = "Hasło:";
        save.onclick = editEmail;
    } else if (type === "login") {
        label.textContent = "Nowy login:";
        input.type = "text";
        input.placeholder = "np. janusz123";
        inputP.textContent = "Hasło:";
        save.onclick = editLogin;
    }
    else if (type === "haslo") {
        label.textContent = "Nowe hasło:";
        input.type = "password";
        inputP.textContent = "Stare hasło:"
        input.placeholder = "";
        save.onclick = editPassword;
    }
}

async function editLogin (e) {
    const token = localStorage.getItem('token');

    console.log("1")
    const input = document.getElementById("mainInput");
    try {

        const response = await fetch('/api/user/login', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`,
                       'Content-Type': 'application/json'  },
            body: JSON.stringify({username:input.value})
        });

        if (response.ok) {
            console.log("1ok")
            const loginRes = await response.json();
            const loginPlacement = document.getElementById("login");

            if(loginRes.username == null ) {
                loginPlacement.textContent = "Brak loginu";
            } else {
                loginPlacement.textContent = loginRes.username;
            }
            closePanel();
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd');
        }

    } catch (error) {
        console.error('Błąd zmiany loginu:', error);
    }
}

async function editEmail (e) {
    console.log("2")
    const token = localStorage.getItem('token');
    const input = document.getElementById("mainInput");

    try {

        const response = await fetch('/api/user/email', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`,
                       'Content-Type': 'application/json'  },
            body: JSON.stringify({email:input.value})
        });

        if (response.ok) {
            console.log("2ok")
            const emailRes = await response.json();
            const emailPlacement = document.getElementById("email");

            if(emailRes.email == null ) {
                emailPlacement.textContent = "Brak email";
            } else {
                emailPlacement.textContent = emailRes.email;
            }
            closePanel();
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd');
        }

    } catch (error) {
        console.error('Błąd zmiany email:', error);
    }
}

async function editPassword (e) {
    console.log("3")
    const token = localStorage.getItem('token');

    const input = document.getElementById("mainInput");
    const input2 = document.getElementById("password");
    try {

        const response = await fetch('/api/user/password', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`,
                       'Content-Type': 'application/json'  },
            body: JSON.stringify({newPassword:input.value, oldPassword:input2.value})
        });

        if (response.ok) {
            console.log("1ok")
            const passwordRes = await response.json();
            alert(passwordRes);
            //const passwordPlacement = document.getElementById("password");

            closePanel();
        } else {
            const error = await response.json();
            alert(error.error || 'Nieznany błąd');
        }

    } catch (error) {
        console.error('Błąd zmiany hasła:', error);
    }
}

function closePanel() {
    document.getElementById("editPanel").classList.remove("active");
    const text1 = document.getElementById("mainInput");
    const text2 = document.getElementById("password");
    text1.value = "";
    text2.value = "";
}


function open_mainpage() {
    window.location.pathname = '/mainpage.html';
}

