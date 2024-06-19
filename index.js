import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
    authDomain: "track-dac15.firebaseapp.com",
    databaseURL: "https://track-dac15-default-rtdb.firebaseio.com",
    projectId: "track-dac15",
    storageBucket: "track-dac15.appspot.com",
    messagingSenderId: "495156821305",
    appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
    measurementId: "G-RVBYB0RR06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

async function googleSignIn() {
    const token = grecaptcha.getResponse();
    if (!token) {
        alert('Please complete the reCAPTCHA.');
        return;
    }

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Fetch user role from Firebase Realtime Database correctly
        const roleRef = ref(database, `users/${user.uid}/role`);
        const snapshot = await get(roleRef);
        
        if (snapshot.exists()) {
            const role = snapshot.val();
            // Redirect based on role
            if (role === 'manager') {
                window.location.href = 'owner-portal.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        } else {
            console.log('No specific role found, redirecting to user dashboard.');
            window.location.href = 'user-dashboard.html';
        }
    } catch (error) {
        console.error('Error during Google sign-in:', error);
    } finally {
        grecaptcha.reset(); // Reset reCAPTCHA
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleSignInButton').addEventListener('click', googleSignIn);
});









// User Registration Function
async function registerUser(email, password, additionalData) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);

        // Save additional user data in Realtime Database
        const userDataRef = ref(database, 'users/' + userCredential.user.uid);
        await set(userDataRef, additionalData);
    } catch (error) {
        console.error('Registration error:', error);
    }
}

// User Login Function
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
    } catch (error) {
        console.error('Login error:', error);
    }
}



const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.processSalesOutcomes = functions.database.ref('/salesOutcomes/{userId}')
    .onWrite((change, context) => {
        const userId = context.params.userId;
        const outcomes = change.after.val();
        if (!outcomes) return null;

        const now = new Date();
        const salesCounts = {
            day: { billableHRA: 0, selectRX: 0, selectPatientManagement: 0, transfer: 0 },
            week: { billableHRA: 0, selectRX: 0, selectPatientManagement: 0, transfer: 0 },
            month: { billableHRA: 0, selectRX: 0, selectPatientManagement: 0, transfer: 0 }
        };
        const salesTimeFrames = {};

        for (const key in outcomes) {
            const outcome = outcomes[key];
            const action = outcome.assignAction;
            const notes = outcome.notesValue;
            const outcomeTime = new Date(outcome.outcomeTime);
            const saleType = getSaleType(action, notes);

            if (!salesTimeFrames[outcome.accountNumber]) {
                salesTimeFrames[outcome.accountNumber] = {};
            }
            if (!salesTimeFrames[outcome.accountNumber][saleType]) {
                salesTimeFrames[outcome.accountNumber][saleType] = [];
            }
            salesTimeFrames[outcome.accountNumber][saleType].push(outcomeTime.toISOString());

            if (isSameDay(outcomeTime, now)) {
                incrementCount(salesCounts.day, saleType);
            }
            if (isSameWeek(outcomeTime, now)) {
                incrementCount(salesCounts.week, saleType);
            }
            if (isSameMonth(outcomeTime, now)) {
                incrementCount(salesCounts.month, saleType);
            }
        }

        const salesCountsRef = admin.database().ref(`salesCounts/${userId}`);
        const salesTimeFramesRef = admin.database().ref(`salesTimeFrames/${userId}`);

        return Promise.all([
            salesCountsRef.set(salesCounts),
            salesTimeFramesRef.set(salesTimeFrames)
        ]);
    });

function getSaleType(action, notes) {
    const normalizedAction = action.toLowerCase();
    if (normalizedAction.includes('srx: enrolled - rx history received') || normalizedAction.includes('srx: enrolled - rx history not available')) {
        return 'Select RX';
    } else if (normalizedAction.includes('hra') && /bill|billable/i.test(notes)) {
        return 'Billable HRA';
    } else if (normalizedAction.includes('notes') && /(vbc|transfer|ndr|fe|final expense|national|national debt|national debt relief|value based care|oak street|osh)/i.test(notes)) {
        return 'Transfer';
    } else if (normalizedAction.includes('select patient management')) {
        return 'Select Patient Management';
    }
    return action;
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isSameWeek(date1, date2) {
    const week1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate() - date1.getDay() + (date1.getDay() === 0 ? -6 : 1));
    const week2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate() - date2.getDay() + (date2.getDay() === 0 ? -6 : 1));
    return week1.getTime() === week2.getTime();
}

function isSameMonth(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
}

function incrementCount(counts, saleType) {
    if (saleType === 'Billable HRA') {
        counts.billableHRA++;
    } else if (saleType === 'Select RX') {
        counts.selectRX++;
    } else if (saleType === 'Select Patient Management') {
        counts.selectPatientManagement++;
    } else if (saleType === 'Transfer') {
        counts.transfer++;
    }
}