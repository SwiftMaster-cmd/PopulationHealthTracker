document.addEventListener('DOMContentLoaded', function () {
    const auth = firebase.auth();
    const db = firebase.database();

    let currentUser = null;
    let currentNoteId = null;

    const noteInput = document.getElementById('noteInput');
    const notesList = document.getElementById('notesList');
    const noteForm = document.getElementById('noteForm');

    // Authenticate the user
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadNotes(); // Load notes for authenticated user
        } else {
            console.error('No user is signed in!');
        }
    });

    // Load the notes for the current user
    function loadNotes() {
        if (!currentUser) return;

        const userNotesRef = db.ref('notes/' + currentUser.uid);

        userNotesRef.on('value', snapshot => {
            notesList.innerHTML = ''; // Clear the list
            const notes = snapshot.val();
            if (notes) {
                Object.keys(notes).forEach(noteId => {
                    const note = notes[noteId];
                    displayNoteInList(noteId, note.text);
                });
            }
        });
    }

    // Display the note in the left panel
    function displayNoteInList(noteId, text) {
        const li = document.createElement('li');
        li.textContent = text.slice(0, 30) + '...'; // Preview first 30 chars
        li.addEventListener('click', () => loadNoteForEditing(noteId));
        notesList.appendChild(li);
    }

    // Load note for editing
    function loadNoteForEditing(noteId) {
        currentNoteId = noteId;
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + noteId);

        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            if (note) {
                noteInput.value = note.text; // Load note into the input field
            } else {
                console.error('Note not found!');
            }
        });
    }

    // Form submission handler to save the note
    noteForm.addEventListener('submit', e => {
        e.preventDefault();
        const newText = noteInput.value;

        if (currentNoteId) {
            saveNoteWithVersion(currentNoteId, newText);
        } else {
            createNewNoteWithVersion(newText);
        }
    });

    // Create a new note
    function createNewNoteWithVersion(text) {
        const noteRef = db.ref('notes/' + currentUser.uid).push(); // Create a new note
        const noteId = noteRef.key;

        const newNote = {
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            versions: {}
        };

        noteRef.set(newNote)
            .then(() => {
                currentNoteId = noteId; // Set the current note ID
                console.log('New note created successfully');
            })
            .catch(error => {
                console.error('Error creating note:', error);
            });
    }

    // Save existing note with versioning
    function saveNoteWithVersion(noteId, newText) {
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + noteId);

        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            if (!note) return;

            const newVersionId = db.ref('notes/' + currentUser.uid + '/' + noteId + '/versions').push().key;
            const updates = {
                text: newText,
                [`versions/${newVersionId}`]: {
                    text: note.text,
                    timestamp: note.timestamp
                }
            };

            noteRef.update(updates)
                .then(() => {
                    console.log('Note updated with a new version');
                })
                .catch(error => {
                    console.error('Error updating note:', error);
                });
        });
    }
});