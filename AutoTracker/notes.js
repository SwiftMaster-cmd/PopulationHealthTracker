// notes.js

document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
        console.error('Firebase is not initialized. Please check your firebase-init.js file.');
        return;
    }

    // References
    const auth = firebase.auth();
    const database = firebase.database();

    let currentUserId = null;
    let currentFolderId = null;
    let currentNoteId = null;
    let quill = null;

    // Initialize Quill Editor
    quill = new Quill('#editor', {
        theme: 'snow'
    });

    // Initialize the app after authentication
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user.uid);
            currentUserId = user.uid;
            initializeNotesApp();
        } else {
            // Sign in anonymously
            auth.signInAnonymously().then(() => {
                console.log('Signed in anonymously');
            }).catch(error => {
                console.error('Authentication error:', error);
            });
        }
    });

    function initializeNotesApp() {
        console.log('Initializing Notes App');
        // Load folders
        loadFolders();

        // Event Listeners
        document.getElementById('addFolderButton').addEventListener('click', addFolder);
        document.getElementById('addNoteButton').addEventListener('click', addNote);
        document.getElementById('saveNoteButton').addEventListener('click', saveNote);
        document.getElementById('deleteNoteButton').addEventListener('click', deleteNote);
        document.getElementById('searchNotesInput').addEventListener('input', searchNotes);
    }

    function loadFolders() {
        console.log('Loading folders...');
        const foldersRef = database.ref(`notes/${currentUserId}/folders`);
        foldersRef.on('value', snapshot => {
            const folders = snapshot.val() || {};
            console.log('Folders loaded:', folders);
            renderFolders(folders);
        }, error => {
            console.error('Error loading folders:', error);
        });
    }

    function renderFolders(folders) {
        const foldersList = document.getElementById('foldersList');
        foldersList.innerHTML = '';
        for (const folderId in folders) {
            const folderName = folders[folderId].name;
            const folderItem = document.createElement('li');
            folderItem.textContent = folderName;
            folderItem.addEventListener('click', () => {
                selectFolder(folderId, folderItem);
            });
            foldersList.appendChild(folderItem);
        }
    }

    function selectFolder(folderId, folderItem) {
        currentFolderId = folderId;
        console.log('Folder selected:', folderId);
        // Highlight selected folder
        document.querySelectorAll('#foldersList li').forEach(li => li.classList.remove('selected'));
        folderItem.classList.add('selected');
        loadNotes(folderId);
    }

    function addFolder() {
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            console.log('Adding folder:', folderName);
            const folderRef = database.ref(`notes/${currentUserId}/folders`).push();
            folderRef.set({
                name: folderName
            }).then(() => {
                console.log('Folder added successfully.');
            }).catch(error => {
                console.error('Error adding folder:', error);
                alert('Failed to add folder: ' + error.message);
            });
        } else {
            console.log('Folder creation canceled');
        }
    }

    function loadNotes(folderId) {
        console.log('Loading notes for folder:', folderId);
        const notesRef = database.ref(`notes/${currentUserId}/notes`).orderByChild('folderId').equalTo(folderId);
        notesRef.on('value', snapshot => {
            const notes = snapshot.val() || {};
            console.log('Notes loaded:', notes);
            renderNotes(notes);
        }, error => {
            console.error('Error loading notes:', error);
        });
    }

    function renderNotes(notes) {
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = '';
        for (const noteId in notes) {
            const noteTitle = notes[noteId].title || 'Untitled';
            const noteItem = document.createElement('li');
            noteItem.textContent = noteTitle;
            noteItem.addEventListener('click', () => {
                selectNote(noteId, noteItem);
            });
            notesList.appendChild(noteItem);
        }
    }

    function addNote() {
        if (!currentFolderId) {
            alert('Please select a folder first.');
            console.log('No folder selected when adding note');
            return;
        }
        console.log('Adding note to folder:', currentFolderId);
        const noteRef = database.ref(`notes/${currentUserId}/notes`).push();
        noteRef.set({
            title: 'New Note',
            content: '',
            folderId: currentFolderId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            console.log('Note added successfully.');
            selectNote(noteRef.key);
        }).catch(error => {
            console.error('Error adding note:', error);
            alert('Failed to add note: ' + error.message);
        });
    }

    function selectNote(noteId, noteItem = null) {
        currentNoteId = noteId;
        console.log('Note selected:', noteId);
        const noteRef = database.ref(`notes/${currentUserId}/notes/${noteId}`);
        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            if (note) {
                document.getElementById('noteTitle').value = note.title;
                quill.setContents(quill.clipboard.convert(note.content));
                document.getElementById('mainContent').classList.remove('hidden');
                // Highlight selected note
                if (noteItem) {
                    document.querySelectorAll('#notesList li').forEach(li => li.classList.remove('selected'));
                    noteItem.classList.add('selected');
                }
            } else {
                console.error('Note not found:', noteId);
                alert('Note not found.');
            }
        }).catch(error => {
            console.error('Error loading note:', error);
            alert('Failed to load note: ' + error.message);
        });
    }

    function saveNote() {
        if (!currentNoteId) return;
        const title = document.getElementById('noteTitle').value.trim();
        const content = quill.root.innerHTML;
        console.log('Saving note:', currentNoteId);
        const noteRef = database.ref(`notes/${currentUserId}/notes/${currentNoteId}`);
        noteRef.update({
            title: title || 'Untitled',
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Update the note title in the list
            const selectedNoteItem = document.querySelector(`#notesList li.selected`);
            if (selectedNoteItem) {
                selectedNoteItem.textContent = title || 'Untitled';
            }
            console.log('Note saved successfully.');
            alert('Note saved successfully.');
        }).catch(error => {
            console.error('Error saving note:', error);
            alert('Failed to save note: ' + error.message);
        });
    }

    function deleteNote() {
        if (!currentNoteId) return;
        if (confirm('Are you sure you want to delete this note?')) {
            console.log('Deleting note:', currentNoteId);
            const noteRef = database.ref(`notes/${currentUserId}/notes/${currentNoteId}`);
            noteRef.remove().then(() => {
                currentNoteId = null;
                document.getElementById('noteTitle').value = '';
                quill.setContents([]);
                document.getElementById('mainContent').classList.add('hidden');
                // Remove note from list
                const selectedNoteItem = document.querySelector(`#notesList li.selected`);
                i
