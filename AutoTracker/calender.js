document.addEventListener('DOMContentLoaded', () => {
    const eventForm = document.getElementById('eventForm');
    const eventsList = document.getElementById('eventsList');

    const database = firebase.database();
    const eventsRef = database.ref('events'); // Firebase reference for events

    // Add Event to Firebase
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const eventName = document.getElementById('eventName').value;
        const eventDate = document.getElementById('eventDate').value;
        const eventTime = document.getElementById('eventTime').value;

        if (eventName && eventDate && eventTime) {
            const eventId = eventsRef.push().key; // Generate a unique key for the event

            const eventData = {
                id: eventId,
                name: eventName,
                date: eventDate,
                time: eventTime
            };

            // Save to Firebase
            eventsRef.child(eventId).set(eventData).then(() => {
                console.log('Event added successfully');
                eventForm.reset(); // Clear form
            }).catch(error => {
                console.error('Error adding event: ', error);
            });
        }
    });

    // Load and display events from Firebase
    eventsRef.on('value', (snapshot) => {
        eventsList.innerHTML = ''; // Clear the list
        const events = snapshot.val();
        if (events) {
            Object.values(events).forEach(event => {
                const li = document.createElement('li');
                li.textContent = `${event.name} - ${event.date} @ ${event.time}`;
                eventsList.appendChild(li);
            });
        }
    });
});