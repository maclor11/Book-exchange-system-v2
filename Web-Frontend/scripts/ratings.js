async function loadUserRatings(ownerUserId = null) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        console.log("Enter load user ratings");

        let url = '/api/rating';
        if (ownerUserId) {
            url += `/${ownerUserId}`;
        }

        console.log("Owner user id");
        console.log(ownerUserId);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Błąd pobierania ocen użytkownika');
        }

        const ratings = await response.json();
        const ratingsList = document.getElementById('ratingsList');
        ratingsList.innerHTML = '';

        if (ratings.length === 0) {
            ratingsList.innerHTML = '<p>Brak ocen.</p>';
            return;
        }

        ratings.forEach(rating => {
            const ratingDiv = document.createElement('div');
            ratingDiv.classList.add('rating-entry');
            ratingDiv.innerHTML = `
                <p><strong>Ocena:</strong> ${rating.stars} ★</p>
                <p><strong>Wiadomość:</strong> ${rating.message}</p>
                <hr>
            `;
            ratingsList.appendChild(ratingDiv);
        });

        document.getElementById('ratingsSection').style.display = 'block';

    } catch (error) {
        console.error(error);
        document.getElementById('ratingsList').innerHTML = '<p>Błąd ładowania ocen.</p>';
    }
}
