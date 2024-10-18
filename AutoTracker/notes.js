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
            currentUserId = user.uid;
            initializeNotesApp();
        } else {
            // Sign in anonymously
            auth.signInAnonymously().catch(error => {
                console.error('Authentication error:', error);
            });
        }
    });

    function initializeNotesApp() {
        // Load folders
        loadFolders();

        // Event Listeners
        document.getElementById('addFolderButton').addEventListener('click', addFolder);
        document.getElementById('addNoteButton').addEventListener('click', addNote);
        document.getElementById('saveNoteButton').addEventListener('click', saveNote);
        document.getElementById('deleteNoteButton').addEventListener('click', deleteNote);
        // Uncomment if implementing sharing
        // document.getElementById('shareNoteButton').addEventListener('click', shareNote);
        document.getElementById('searchNotesInput').addEventListener('input', searchNotes);
    }

    function loadFolders() {
        const foldersRef = database.ref(`notes/${currentUserId}/folders`);
        foldersRef.on('value', snapshot => {
            const folders = snapshot.val() || {};
            renderFolders(folders);
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
        // Highlight selected folder
        document.querySelectorAll('#foldersList li').forEach(li => li.classList.remove('selected'));
        folderItem.classList.add('selected');
        loadNotes(folderId);
    }

    function addFolder() {
        const folderName = prompt('Enter folder name:');
        if (folderName) {
            const folderRef = database.ref(`notes/${currentUserId}/folders`).push();
            folderRef.set({
                name: folderName
            });
        }
    }

    function loadNotes(folderId) {
        const notesRef = database.ref(`notes/${currentUserId}/notes`).orderByChild('folderId').equalTo(folderId);
        notesRef.on('value', snapshot => {
            const notes = snapshot.val() || {};
            renderNotes(notes);
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
            return;
        }
        const noteRef = database.ref(`notes/${currentUserId}/notes`).push();
        noteRef.set({
            title: 'New Note',
            content: '',
            folderId: currentFolderId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            selectNote(noteRef.key);
        });
    }

    function selectNote(noteId, noteItem = null) {
        currentNoteId = noteId;
        const noteRef = database.ref(`notes/${currentUserId}/notes/${noteId}`);
        noteRef.once('value').then(snapshot => {
            const note = snapshot.val();
            document.getElementById('noteTitle').value = note.title;
            quill.setContents(quill.clipboard.convert(note.content));
            document.getElementById('mainContent').classList.remove('hidden');
            // Highlight selected note
            if (noteItem) {
                document.querySelectorAll('#notesList li').forEach(li => li.classList.remove('selected'));
                noteItem.classList.add('selected');
            }
        });
    }

    function saveNote() {
        if (!currentNoteId) return;
        const title = document.getElementById('noteTitle').value.trim();
        const content = quill.root.innerHTML;
        const noteRef = database.ref(`notes/${currentUserId}/notes/${currentNoteId}`);
        noteRef.update({
            title: title || 'Untitled',
            content: content,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Update the note title in the list
            document.querySelector(`#notesList li.selected`).textContent = title || 'Untitled';
            alert('Note saved successfully.');
        }).catch(error => {
            console.error('Error saving note:', error);
            alert('Failed to save note: ' + error.message);
        });
    }

    function deleteNote() {
        if (!currentNoteId) return;
        if (confirm('Are you sure you want to delete this note?')) {
            const noteRef = database.ref(`notes/${currentUserId}/notes/${currentNoteId}`);
            noteRef.remove().then(() => {
                currentNoteId = null;
                document.getElementById('noteTitle').value = '';
                quill.setContents([]);
                document.getElementById('mainContent').classList.add('hidden');
                // Remove note from list
                document.querySelector(`#notesList li.selected`).remove();
                alert('Note deleted successfully.');
            }).catch(error => {
                console.error('Error deleting note:', error);
                alert('Failed to delete note: ' + error.message);
            });
        }
    }

    // Uncomment and implement if you wish to add sharing functionality
    // function shareNote() {
    //     if (!currentNoteId) return;
    //     const email = prompt('Enter email to share with:');
    //     if (email) {
    //         // Implement sharing logic here
    //         alert('Note shared with ' + email);
    //     }
    // }

    function searchNotes() {
        const query = document.getElementById('searchNotesInput').value.toLowerCase();
        const notesRef = database.ref(`notes/${currentUserId}/notes`);
        notesRef.once('value').then(snapshot => {
            const notes = snapshot.val() || {};
            const filteredNotes = {};
            for (const noteId in notes) {
                const note = notes[noteId];
                if (note.folderId === currentFolderId && note.title.toLowerCase().includes(query)) {
                    filteredNotes[noteId] = note;
                }
            }
            renderNotes(filteredNotes);
        });
    }
});
