document.addEventListener('DOMContentLoaded', function () {
    // Make sure Firebase is initialized elsewhere
    if (!firebase.apps.length) {
        console.error('Firebase has not been initialized!');
        return;
    }

    const auth = firebase.auth();
    const db = firebase.database();

    let currentUser = null;
    let currentNoteId = null;

    const noteInput = document.getElementById('noteInput');
    const notesList = document.getElementById('notesList');
    const historyList = document.getElementById('historyList');
    const noteForm = document.getElementById('noteForm');
    const noteHistory = document.getElementById('noteHistory');

    // Authenticate the user
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadNotes();
        } else {
            console.error('No user is signed in!');
        }
    });

    // Load the notes for the current user
    function loadNotes() {
        if (!currentUser) return;

        const userNotesRef = db.ref('notes/' + currentUser.uid);

        userNotesRef.on('value', snapshot => {
            notesList.innerHTML = ''; // Clear current list
            const notes = snapshot.val();
            if (notes) {
                Object.keys(notes).forEach(noteId => {
                    const note = notes[noteId];
                    displayNoteInList(noteId, note.text);
                });
            } else {
                console.log('No notes found for this user.');
            }
        });
    }

    // Display a note in the list on the left pane
    function displayNoteInList(noteId, text) {
        const li = document.createElement('li');
        li.textContent = text.slice(0, 30) + '...'; // Preview first 30 chars
        li.addEventListener('click', () => loadNoteForEditing(noteId));
        notesList.appendChild(li);
    }

    // Load a note for editing (right pane)
    function loadNoteForEditing(noteId) {
        currentNoteId = noteId;
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + noteId);

        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            if (note) {
                noteInput.value = note.text;
                loadNoteHistory(noteId);
            } else {
                console.error('Note not found!');
            }
        }).catch(error => {
            console.error('Error loading note:', error);
        });
    }

    // Load the note history
    function loadNoteHistory(noteId) {
        const historyRef = db.ref('notes/' + currentUser.uid + '/' + noteId + '/versions');

        historyRef.once('value').then(snapshot => {
            historyList.innerHTML = ''; // Clear current history list
            const versions = snapshot.val();
            if (versions) {
                Object.keys(versions).forEach(versionId => {
                    const version = versions[versionId];
                    const li = document.createElement('li');
                    li.textContent = `Version from ${new Date(version.timestamp).toLocaleString()}`;
                    li.addEventListener('click', () => restoreNoteVersion(noteId, version.text));
                    historyList.appendChild(li);
                });
                noteHistory.classList.remove('hidden');
            } else {
                console.log('No history available for this note.');
                noteHistory.classList.add('hidden');
            }
        }).catch(error => {
            console.error('Error loading note history:', error);
        });
    }

    // Restore a note version
    function restoreNoteVersion(noteId, text) {
        noteInput.value = text; // Restore the version into the input area
    }

    // Save note on form submission
    noteForm.addEventListener('submit', e => {
        e.preventDefault();
        const newText = noteInput.value;

        if (currentNoteId) {
            saveNoteWithVersion(currentNoteId, newText);
        } else {
            createNewNoteWithVersion(newText);
        }
    });

    // Create a new note with versioning
    function createNewNoteWithVersion(text) {
        if (!currentUser) return;

        const noteRef = db.ref('notes/' + currentUser.uid).push(); // Generate a new note ID
        const noteId = noteRef.key;

        const newNote = {
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            versions: {}
        };

        noteRef.set(newNote)
            .then(() => {
                currentNoteId = noteId;
                console.log('New note created successfully!');
            })
            .catch(error => {
                console.error('Error creating new note:', error);
            });
    }

    // Save an existing note with versioning
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
                    console.log('Note updated with a new version.');
                })
                .catch(error => {
                    console.error('Error saving note with versioning:', error);
                });
        });
    }
});