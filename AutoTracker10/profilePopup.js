document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.querySelector('.profile-button');
    const colorPickerContainer = document.getElementById('colorPickerContainer');
    const changeNameButton = document.getElementById('changeName');
    const nameInput = document.getElementById('nameInput');

    profileButton.addEventListener('click', (event) => {
        event.stopPropagation();
        colorPickerContainer.style.display = colorPickerContainer.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (event) => {
        if (!colorPickerContainer.contains(event.target) && !profileButton.contains(event.target)) {
            colorPickerContainer.style.display = 'none';
        }
    });

    

    changeNameButton.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        if (newName) {
            const user = firebase.auth().currentUser;
            if (user) {
                const usersRef = firebase.database().ref('users/' + user.uid);
                usersRef.update({ name: newName }).then(() => {
                    alert('Name updated successfully');
                    nameInput.value = '';
                }).catch((error) => {
                    console.error('Error updating name:', error);
                });
            }
        } else {
            alert('Please enter a valid name');
        }
    });

    const signOutButton = document.getElementById('signOut');
    signOutButton.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = '/Users/micah/Documents/GitHub/PopulationHealthTracker';
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });
});





document.getElementById('copyBookmarkletButton').addEventListener('click', () => {
    const bookmarklet = `javascript:(function(){function loadScript(src,callback){const script=document.createElement('script');script.src=src;script.onload=callback;script.onerror=function(){console.error('Failed to load script:',src);};document.head.appendChild(script);}function showActiveIndicator(){const existingIndicator=document.getElementById('tracker-active-indicator');if(existingIndicator){existingIndicator.style.display='block';}else{const style=document.createElement('style');style.innerHTML=\`#tracker-active-indicator{padding:8px 20px;color:#000;font-size:18px;font-family:'Georgia',serif;border-radius:8px;margin:0 auto;display:block;width:90%;text-align:center;position:relative;transition:all 0.5s ease;font-weight:bold;}#tracker-active-indicator:hover{color:#28a745;}#tracker-active-indicator .icon{display:inline-block;margin-right:10px;transition:color 0.5s ease;color:#28a745;font-size:22px;}#tracker-active-indicator .version{font-size:14px;color:#666;margin-left:10px;}#sale-notification{position:fixed;top:20px;left:50%;transform:translateX(-50%);background-color:#28a745;color:#fff;padding:10px 20px;border-radius:8px;font-size:16px;display:none;z-index:1000;}\`;document.head.appendChild(style);const indicator=document.createElement('div');indicator.id='tracker-active-indicator';indicator.innerHTML='<span class="icon">✔</span> Tracker Active<span class="version">V-2.1</span>';const actionsHeader=document.evaluate("//h3[text()='Actions']",document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;if(actionsHeader){actionsHeader.parentElement.appendChild(indicator);}else{console.error('Actions header element not found');}const notification=document.createElement('div');notification.id='sale-notification';notification.textContent='Sale added successfully!';document.body.appendChild(notification);}}function showNotification(){const notification=document.getElementById('sale-notification');notification.style.display='block';setTimeout(()=>{notification.style.display='none';},3600);}function authenticateUser(){firebase.auth().onAuthStateChanged(user=>{if(user){console.log('Authenticated user:',user.displayName);captureOutcomeData(user);showActiveIndicator();}else{console.log("Prompting user to sign in");firebase.auth().signInWithPopup(provider).then((result)=>{const user=result.user;console.log('Authenticated user:',user.displayName);captureOutcomeData(user);showActiveIndicator();}).catch((error)=>{console.error('Authentication error:',error);});}});}function captureOutcomeData(user){const applyActionButton=Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()==='Apply Action');if(applyActionButton){applyActionButton.addEventListener('click',function handler(){console.log('Apply Action button clicked:',this);let outcomeTime=new Date().toISOString();console.log('Outcome Time:',outcomeTime);let assignActionElem=document.querySelector('[role="combobox"] input');let assignAction=assignActionElem?assignActionElem.value:"unknown";console.log('Assign Action:',assignAction);let notesValueElem=document.querySelector('[name="note"]');let notesValue=notesValueElem?notesValueElem.value:"unknown";console.log('Notes Value:',notesValue);let accountNumberElem=document.querySelectorAll('.MuiTypography-root.leadInfoCard__content--truncate.MuiTypography-body2')[1];let accountNumber=accountNumberElem?accountNumberElem.textContent:"unknown";console.log('Account Number:',accountNumber);let firstNameElem=document.querySelector('#indv-first-name');console.log('First Name Element:',firstNameElem);let firstName=firstNameElem?firstNameElem.value:"unknown";console.log('First Name:',firstName);let lastNameElem=document.querySelector('#indv-last-name');console.log('Last Name Element:',lastNameElem);let lastName=lastNameElem?lastNameElem.value:"unknown";console.log('Last Name:',lastName);let genderElem=document.querySelector('#indv-gender');console.log('Gender Element:',genderElem);let gender=genderElem?genderElem.value:"unknown";console.log('Gender:',gender);let birthdateElem=document.querySelector('#indv-birthday');console.log('Birthdate Element:',birthdateElem);let birthdate=birthdateElem?birthdateElem.value:"unknown";console.log('Birthdate:',birthdate);let emailElem=document.querySelector('#indv-email');console.log('Email Element:',emailElem);let email=emailElem?emailElem.value:"unknown";console.log('Email:',email);let phoneElem=document.querySelector('#indv-day-phone');console.log('Day Phone Element:',phoneElem);let phone=phoneElem?phoneElem.value:"unknown";console.log('Day Phone:',phone);let zipcodeElem=document.querySelector('#indv-zipcode');console.log('Zipcode Element:',zipcodeElem);let zipcode=zipcodeElem?zipcodeElem.value:"unknown";console.log('Zipcode:',zipcode);let stateIdElem=document.querySelector('#indv-state-id');console.log('State ID Element:',stateIdElem);let stateId=stateIdElem?stateIdElem.value:"unknown";console.log('State ID:',stateId);const data={userId:user.uid,outcomeTime:outcomeTime,assignAction:assignAction,notesValue:notesValue,accountNumber:accountNumber,customerInfo:{firstName:firstName,lastName:lastName,gender:gender,birthdate:birthdate,email:email,phone:phone,zipcode:zipcode,stateId:stateId}};console.log('Data to be recorded:',data);const outcomesRef=firebase.database().ref('salesOutcomes/'+user.uid).push();outcomesRef.set(data).then(()=>{console.log('Outcome recorded for user:',user.displayName);showNotification();}).catch((error)=>{console.error('Error recording outcome:',error);});});console.log("Event listener added to Apply Action button");}else{console.error("Apply Action button not found");}}let provider;loadScript('https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js',function(){console.log("firebase-app.js loaded");loadScript('https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js',function(){console.log("firebase-auth.js loaded");loadScript('https://www.gstatic.com/firebasejs/8.6.8/firebase-database.js',function(){console.log("firebase-database.js loaded");if(typeof firebase==='undefined'){console.error('Firebase SDK not loaded');return;}console.log("Firebase scripts loaded");const firebaseConfig={apiKey:"AIzaSyBhSqBwrg8GYyaqpYHOZS8HtFlcXZ09OJA",authDomain:"track-dac15.firebaseapp.com",databaseURL:"https://track-dac15-default-rtdb.firebaseio.com",projectId:"track-dac15",storageBucket:"track-dac15.appspot.com",messagingSenderId:"495156821305",appId:"1:495156821305:web:7cbb86d257ddf9f0c3bce8",measurementId:"G-RVBYB0RR06"};firebase.initializeApp(firebaseConfig);const auth=firebase.auth();const database=firebase.database();provider=new firebase.auth.GoogleAuthProvider();console.log("Firebase initialized");authenticateUser();});});});})();`;

    navigator.clipboard.writeText(bookmarklet).then(() => {
        alert('Bookmarklet script copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});



