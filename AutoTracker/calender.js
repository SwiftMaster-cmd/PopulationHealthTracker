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
document.addEventListener("DOMContentLoaded", function () {
    const weekRange = document.getElementById('week-range');
    const sundaySlot = document.getElementById('sunday');
    const mondaySlot = document.getElementById('monday');
    const tuesdaySlot = document.getElementById('tuesday');
    const wednesdaySlot = document.getElementById('wednesday');
    const thursdaySlot = document.getElementById('thursday');
    const fridaySlot = document.getElementById('friday');
    const saturdaySlot = document.getElementById('saturday');

    let currentDate = new Date();
    
    // Function to get the start of the current week (Sunday)
    function getStartOfWeek(date) {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek;
    }

    // Function to render the current week range
    function renderWeek() {
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // Format the week range display
        weekRange.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;

        // Clear any existing events in the slots
        [sundaySlot, mondaySlot, tuesdaySlot, wednesdaySlot, thursdaySlot, fridaySlot, saturdaySlot].forEach(slot => {
            slot.innerHTML = ''; // Clear existing events
        });

        // Example: Adding events for demonstration
        const event1 = document.createElement('div');
        event1.className = 'event-slot';
        event1.textContent = 'Meeting at 10am';
        mondaySlot.appendChild(event1);

        const event2 = document.createElement('div');
        event2.className = 'event-slot';
        event2.textContent = 'Lunch at 1pm';
        wednesdaySlot.appendChild(event2);
    }

    // Initialize the week display
    renderWeek();

    // Navigate to previous week
    document.getElementById('prev-week').addEventListener('click', function () {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeek();
    });

    // Navigate to next week
    document.getElementById('next-week').addEventListener('click', function () {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeek();
    });
});