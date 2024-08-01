document.addEventListener('DOMContentLoaded', function() {
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
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    } else {
        firebase.app();
    }

    // Initialize Vertex AI
    const vertexAI = getVertexAI(firebase.app());
    const model = getGenerativeModel(vertexAI, { model: "gemini-1.5-flash" });

    async function runGeminiAPI() {
        try {
            const prompt = "Write a story about a magic backpack.";
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            console.log(text);
        } catch (error) {
            console.error("Error generating content: ", error);
        }
    }

    document.addEventListener('firebaseInitialized', runGeminiAPI);

    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            const userRef = firebase.database().ref('users/' + user.uid);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();

            if (userData && userData.googleLinked) {
                console.log('Google account is already linked.');
            } else {
                console.log('Google account is not linked.');
            }
        } else {
            console.error('No user is signed in.');
        }
    });

    document.dispatchEvent(new Event('firebaseInitialized'));
});