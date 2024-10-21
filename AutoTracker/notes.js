document.addEventListener('DOMContentLoaded', function () {
    const auth = firebase.auth();
    const db = firebase.database();

    let currentUser = null;
    let currentNoteId = null;
    let currentFolder = 'default';

    const folderInput = document.getElementById('newFolderInput');
    const foldersList = document.getElementById('foldersList');
    const newNoteButton = document.getElementById('newNoteButton');
    const noteInput = document.getElementById('noteInput');
    const notesList = document.getElementById('notesList');
    const noteForm = document.getElementById('noteForm');
    const createFolderButton = document.getElementById('createFolderButton');
    const deleteNoteButton = document.getElementById('deleteNoteButton');

    // Authenticate the user
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadFolders();
            loadNotes(); // Load notes for the authenticated user
        } else {
            console.error('No user is signed in!');
        }
    });

    // Load folders
    function loadFolders() {
        if (!currentUser) return;

        const userFoldersRef = db.ref('folders/' + currentUser.uid);
        userFoldersRef.on('value', snapshot => {
            foldersList.innerHTML = ''; // Clear the list
            const folders = snapshot.val();
            if (folders) {
                Object.keys(folders).forEach(folderName => {
                    displayFolderInList(folderName);
                });
            }
        });
    }

    // Load notes for the current folder
    function loadNotes() {
        if (!currentUser) return;

        const userNotesRef = db.ref('notes/' + currentUser.uid + '/' + currentFolder);
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

    // Display folder in the list
    function displayFolderInList(folderName) {
        const li = document.createElement('li');
        li.textContent = folderName;
        li.addEventListener('click', () => switchFolder(folderName));
        foldersList.appendChild(li);
    }

    // Switch folders
    function switchFolder(folderName) {
        currentFolder = folderName;
        loadNotes(); // Load notes from the selected folder
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
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + currentFolder + '/' + noteId);

        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            if (note) {
                noteInput.value = note.text; // Load note into the input field
            } else {
                console.error('Note not found!');
            }
        });
    }

    // Create a new folder
    createFolderButton.addEventListener('click', () => {
        const folderName = folderInput.value.trim();
        if (folderName) {
            const folderRef = db.ref('folders/' + currentUser.uid + '/' + folderName);
            folderRef.set(true).then(() => {
                folderInput.value = ''; // Clear the input
                console.log('Folder created successfully');
            }).catch(error => {
                console.error('Error creating folder:', error);
            });
        }
    });

    // Create a new note
    newNoteButton.addEventListener('click', () => {
        currentNoteId = null; // Clear current note for a new one
        noteInput.value = ''; // Clear the input field for a new note
    });

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
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + currentFolder).push(); // Create a new note
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
        const noteRef = db.ref('notes/' + currentUser.uid + '/' + currentFolder + '/' + noteId);

        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            if (!note) return;

            const newVersionId = db.ref('notes/' + currentUser.uid + '/' + currentFolder + '/' + noteId + '/versions').push().key;
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

    // Delete the current note
    deleteNoteButton.addEventListener('click', () => {
        if (!currentNoteId) return;

        const noteRef = db.ref('notes/' + currentUser.uid + '/' + currentFolder + '/' + currentNoteId);
        noteRef.remove()
            .then(() => {
                console.log('Note deleted successfully');
                currentNoteId = null;
                noteInput.value = ''; // Clear the note editor
            })
            .catch(error => {
                console.error('Error deleting note:', error);
            });
    });
});