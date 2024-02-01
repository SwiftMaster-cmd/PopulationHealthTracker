document.getElementById('registerBtn').addEventListener('click', signUp);

function signUp() {
    const email = document.getElementById('signup_email').value.trim();
    const password = document.getElementById('signup_password').value.trim();
    const fullName = document.getElementById('full_name').value.trim();
    const favouriteSong = document.getElementById('favourite_song').value.trim();
    const milkBeforeCereal = document.getElementById('milk_before_cereal').value.trim();

    if (!validateEmail(email) || !validatePassword(password)) {
        alert('Invalid email or password. Make sure your email is correct and password is at least 6 characters long.');
        return;
    }

    createUserWithEmailAndPassword(window.auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                email: email,
                full_name: fullName,
                favourite_song: favouriteSong,
                milk_before_cereal: milkBeforeCereal,
                last_login: Date.now()
            };

            set(ref(window.database, `users/${user.uid}`), userData);

            alert('User Created!');
            // Redirect or other actions
        })
        .catch((error) => {
            alert(`Registration failed: ${error.message}`);
        });
}

function validateEmail(email) {
    const expression = /^[^@]+@\w+(\.\w+)+\w$/;
    return expression.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}
