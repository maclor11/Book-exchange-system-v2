# 📚 BookExchangeSystem

**BookExchangeSystem** to aplikacja webowa umożliwiająca użytkownikom wymianę książek między sobą. Projekt składa się z dwóch głównych komponentów: frontend (Vue.js) oraz backend (Spring Boot), rozwijanych przez oddzielne zespoły.

---

## 🧭 Spis treści

- [📁 Struktura projektu](#-struktura-projektu)
- [🚀 Uruchamianie projektu](#-uruchamianie-projektu)
- [🛠 Technologie](#-technologie)
- [🌐 Komunikacja front-back](#-komunikacja-front-back)
- [📄 Pliki środowiskowe (.env)](#-pliki-środowiskowe-env)
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
http://localhost:5173

### 🔹 Backend (Spring)

```bash
cd backend
./gradlew bootRun
```
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

Aby uniknąć problemów z CORS w środowisku deweloperskim, należy skonfigurować proxy w frontend/vite.config.js:

```js
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
```
## 📄 Pliki środowiskowe (.env)

Pliki .env zawierają dane konfiguracyjne i nie powinny być commitowane do repozytorium.
Zamiast tego, każdy zespół powinien przygotować plik .env.example.

```bash
# frontend/.env.example
VITE_API_URL=http://localhost:8080/api
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














