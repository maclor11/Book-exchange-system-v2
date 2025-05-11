# 📚 BookExchangeSystem

**BookExchangeSystem** to aplikacja webowa umożliwiająca użytkownikom wymianę książek między sobą. Projekt składa się z dwóch głównych komponentów: frontend (Vue.js) oraz backend (Spring Boot), rozwijanych przez oddzielne zespoły.

---

## 🧭 Spis treści

- [📁 Struktura projektu](#-struktura-projektu)
- [🚀 Uruchamianie projektu](#-uruchamianie-projektu)
- [🛠 Technologie](#-technologie)
- [🌐 Komunikacja front-back](#-komunikacja-front-back)
- [👥 Zespoły](#-zespoły)

---

## 📁 Struktura projektu

BookExchangeSystem/

├── backend/ # Kod backendu – Spring Boot (Java)

├── frontend/ # Kod frontendowy – Vue.js

├── README.md # Ten plik

└── .gitignore # Ignorowane pliki globalne



---

## 🚀 Uruchamianie projektu

### 🔹 Frontend (Vue.js)

```bash
cd frontend
npm install
npm run dev
```

Domyślnie aplikacja frontendowa dostępna jest pod adresem:
http://localhost:8081

### 🔹 Backend (Spring)

Backend uruchamia się domyślnie na:
http://localhost:8080

## 🛠 Technologie

| Warstwa     | Technologie                       |
| ----------- | --------------------------------- |
| Frontend    | Vue.js 3, Vite, Axios             |
| Backend     | Java 17, Spring Boot, JPA         |
| Baza danych | MongoDB                           |

## 🌐 Komunikacja front-back

Frontend komunikuje się z backendem poprzez REST API.

Aby uniknąć problemów z CORS w środowisku deweloperskim, należy skonfigurować proxy w frontend/vue.config.js:

```js
module.exports = {
  devServer: {
    port: 8081, // Ustawiamy port frontendowy na 8081
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Proxy zapytań do backendu działającego na porcie 8080
        changeOrigin: true,              // Ustawienie dla zmiany nagłówka Origin w zapytaniach
        pathRewrite: {
          '^/api': '',                  // Usuwamy '/api' z zapytania (opcjonalne, zależnie od struktury backendu)
        },
      },
    },
  },
};

```
## 👥 Zespoły

Frontend team
Lokalizacja kodu: frontend/
Technologie: Vue.js 3, Vite, Axios
IDE: WebStorm

Backend team
Lokalizacja kodu: backend/
Technologie: Java 17, Spring Boot, JPA
IDE: IntelliJ IDEA














