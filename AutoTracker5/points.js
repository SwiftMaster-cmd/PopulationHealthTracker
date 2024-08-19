function updateTotalPointsInHeader() {
    const database = firebase.database();
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
        const pointsRef = database.ref('points/' + currentUser.uid);
        pointsRef.on('value', snapshot => {
            const totalPoints = snapshot.val() || 0;
            const pointsElement = document.getElementById('totalPoints');
            if (pointsElement) {
                pointsElement.textContent = `Total Points: ${totalPoints}`;
            }
        });
    }
}