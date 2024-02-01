// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",
    authDomain: "track-dac15.firebaseapp.com",
    projectId: "track-dac15",
    storageBucket: "track-dac15.appspot.com",
    messagingSenderId: "495156821305",
    appId: "1:495156821305:web:7cbb86d257ddf9f0c3bce8",
    measurementId: "G-RVBYB0RR06"
  };

  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);
  
  // Login form
  const loginForm = document.getElementById('login-form');
  
  loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const email = loginForm['email'].value;
      const password = loginForm['password'].value;
  
      signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
              // Signed in 
              const user = userCredential.user;
              console.log('Logged in as:', user.email);
              // Redirect to another page or update UI
          })
          .catch((error) => {
              console.error('Error during login:', error.message);
          });
  });
  
  // Check for authentication state changes
  onAuthStateChanged(auth, (user) => {
      if (user) {
          console.log('User is logged in:', user);
      } else {
          console.log('User is logged out');
      }
  });
  