document.addEventListener('DOMContentLoaded', function() {
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
        }
    });

    // Load the notes for the current user
    function loadNotes() {
        const userNotesRef = db.ref('notes/' + currentUser.uid);

        userNotesRef.on('value', snapshot => {
            notesList.innerHTML = '';
            const notes = snapshot.val();
            if (notes) {
                Object.keys(notes).forEach(noteId => {
                    const note = notes[noteId];
                    displayNoteInList(noteId, note.text);
                });
            }
        });
    }

    // Display the note in the list on the left pane
    function displayNoteInList(noteId, text) {
        const li = document.createElement('li');
        li.textContent = text.slice(0, 30) + '...'; // Show preview
        li.addEventListener('click', () => loadNoteForEditing(noteId));
        notesList.appendChild(li);
    }

    // Load a note for editing (right pane)
    function loadNoteForEditing(noteId) {
        currentNoteId = noteId;
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + noteId);
        
        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            noteInput.value = note.text;
            loadNoteHistory(noteId);
        });
    }

    // Load the note history
    function loadNoteHistory(noteId) {
        const historyRef = db.ref('notes/' + currentUser.uid + '/' + noteId + '/versions');
        
        historyRef.once('value').then(snapshot => {
            historyList.innerHTML = '';
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
                noteHistory.classList.add('hidden');
            }
        });
    }

    // Restore a note version
    function restoreNoteVersion(noteId, text) {
        noteInput.value = text;
    }

    // Save note on form submission
    noteForm.addEventListener('submit', e => {
        e.preventDefault();
        const newText =

 noteInput.value;

        if (currentNoteId) {
            saveNoteWithVersion(currentNoteId, newText);
        } else {
            createNewNoteWithVersion(newText);
        }
    });

    // Create a new note with versioning
    function createNewNoteWithVersion(text) {
        const noteRef = db.ref('notes/' + currentUser.uid).push();
        const noteId = noteRef.key;

        const newNote = {
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            versions: {}
        };

        noteRef.set(newNote);
        currentNoteId = noteId;
    }

    // Save an existing note with versioning
    function saveNoteWithVersion(noteId, newText) {
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + noteId);
        
        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            const newVersionId = db.ref('notes/' + currentUser.uid + '/' + noteId + '/versions').push().key;
            const updates = {};

            updates['text'] = newText;
            updates['versions/' + newVersionId] = {
                text: note.text,
                timestamp: note.timestamp
            };

            noteRef.update(updates);
        });
    }
});