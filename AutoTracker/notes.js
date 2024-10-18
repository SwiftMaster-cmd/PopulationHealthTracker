// notes.js

// Firebase configuration (Replace with your Firebase config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    // ... other config
};
firebase.initializeApp(firebaseConfig);

// References
const auth = firebase.auth();
const database = firebase.database();

// Variables
let currentUserId = null;
let currentFolderId = null;
let currentNoteId = null;
let quill = null;

// Initialize Quill Editor
document.addEventListener('DOMContentLoaded', () => {
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
});

function initializeNotesApp() {
    // Load folders
    loadFolders();

    // Event Listeners
    document.getElementById('addFolderButton').addEventListener('click', addFolder);
    document.getElementById('addNoteButton').addEventListener('click', addNote);
    document.getElementById('saveNoteButton').addEventListener('click', saveNote);
    document.getElementById('deleteNoteButton').addEventListener('click', deleteNote);
    document.getElementById('shareNoteButton').addEventListener('click', shareNote);
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
            selectFolder(folderId);
        });
        foldersList.appendChild(folderItem);
    }
}

function selectFolder(folderId) {
    currentFolderId = folderId;
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
            selectNote(noteId);
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

function selectNote(noteId) {
    currentNoteId = noteId;
    const noteRef = database.ref(`notes/${currentUserId}/notes/${noteId}`);
    noteRef.once('value').then(snapshot => {
        const note = snapshot.val();
        document.getElementById('noteTitle').value = note.title;
        quill.setContents(quill.clipboard.convert(note.content));
        document.getElementById('mainContent').classList.remove('hidden');
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
        });
    }
}

function shareNote() {
    if (!currentNoteId) return;
    const email = prompt('Enter email to share with:');
    if (email) {
        // Implement sharing logic here
        alert('Note shared with ' + email);
    }
}

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
