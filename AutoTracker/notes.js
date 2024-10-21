document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    const db = firebase.database();
    const notesList = document.getElementById('notesList');
    const noteForm = document.getElementById('noteForm');
    const noteInput = document.getElementById('noteInput');

    let currentUser = null;

    // Authenticate user
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadNotes(); // Load existing notes from Firebase
        }
    });

    // Function to load notes
    function loadNotes() {
        const userNotesRef = db.ref('notes/' + currentUser.uid);

        userNotesRef.on('value', snapshot => {
            notesList.innerHTML = ''; // Clear the list

            const notes = snapshot.val();
            if (notes) {
                Object.keys(notes).forEach(noteId => {
                    const note = notes[noteId];
                    displayNote(noteId, note.text);
                });
            }
        });
    }

    // Function to display a note
    function displayNote(noteId, noteText) {
        const noteElement = document.createElement('li');
        noteElement.textContent = noteText;

        // Delete button for each note
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', () => {
            deleteNote(noteId);
        });

        noteElement.appendChild(deleteButton);
        notesList.appendChild(noteElement);
    }

    // Add note form submission
    noteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const noteText = noteInput.value.trim();

        if (noteText) {
            addNote(noteText);
            noteInput.value = ''; // Clear the input field
        }
    });

    // Function to add a note to Firebase
    function addNote(text) {
        const userNotesRef = db.ref('notes/' + currentUser.uid);
        const newNoteRef = userNotesRef.push();

        newNoteRef.set({
            text: text,
            timestamp: Date.now()
        });
    }

    // Function to delete a note from Firebase
    function deleteNote(noteId) {
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + noteId);
        noteRef.remove();
    }
});