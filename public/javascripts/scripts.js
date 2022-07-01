// ==== UserID Menu =====

let userIdLookUpButton = document.getElementById('userIdLookUpButton');
let userIdInput = document.getElementById('userIdInput');
let globalUserId;

userIdLookUpButton.addEventListener("click", () => {;
  processUserId(userIdInput.value)
});

function processUserId(userId) {
  if (validateUserId(userId)) {
    getUserProfile(userId)
  }
}

function validateUserId(userId) {

  let ret = true;
  let alertMessage = 
    `\nUserID must:\
    \n  * Have 22 characters\
    \n  * Contain only lowercase letters (a-z), uppercase letters (A-Z) OR digits (0-9)`;
  let invalidCharacters;

  if (userId.length == 22) {
    invalidCharacters =  userId.match(/[^A-Za-z0-9_-]{1}/g);
    if (invalidCharacters && invalidCharacters.length > 0) {
      alertMessage = 
        `Input userID has these invalid characters: ${invalidCharacters}\n${alertMessage}`;
      ret = false;
    }
  } else {
    alertMessage = `Input userID has ${userId.length} character(s)\n${alertMessage}`;
    ret = false;
  }

  if (!ret) {
    alert(alertMessage);
  }

  return ret;
}

async function getUserProfile(userId) {

  globalUserId = userId;
  let endpoint;
  endpoint = `/api/v1/yelpScraper/getUser/${userId}`

  let success = true;
  let reviews = await axios(endpoint)
    .then(
      response => response.data.data
    )
    .catch(error => {
      alert(`${error.message}\n${error.response.data.error}`);
      success = false;
    });

  if (success) {
    
    // Show User Info Box
    document.getElementById('userInfoContainer').style.display = 'flex';
    document.querySelector('#userInfo h1').textContent = reviews.Name;
    document.getElementById('userHometown').textContent = reviews.Hometown;
    document.getElementById('userReviewNumber').textContent = `${reviews.NumberOfReviews} Reviews`;
    document.querySelector('#userAvatar > img').src = reviews.AvatarImage;

    //Show Review Limit Menu
    document.getElementById('inputContainer').style.display = 'none'; // hide UserID menu
    document.getElementById('reviewInputContainer').style.display = 'flex';
    let reviewLimitInput = document.getElementById('reviewLimitInput');

    reviewLimitInput.options = [];

    for (let i = 1; i <= Math.ceil(reviews.NumberOfReviews / 10); i++) {
      let val = i*10;
      reviewLimitInput.options[i-1]= new Option(`${val}`, val, false, false);
    }

    reviewLimitInput.options[0].defaultSelected = true;
  }
}


// ==== Review Limit Menu =====

let reviewLimitCancelButton = document.getElementById('reviewLimitCancelButton');

reviewLimitCancelButton.addEventListener("click", () => {;
  cancelReviewLimitMenu();
});

function cancelReviewLimitMenu() {
  document.getElementById('userInfoContainer').style.display = 'none';
  document.getElementById('reviewInputContainer').style.display = 'none';
  document.getElementById('inputContainer').style.display = 'flex';
}

let reviewLimitButton = document.getElementById('reviewLimitButton');
let reviewLimitInput = document.getElementById('reviewLimitInput');

reviewLimitButton.addEventListener("click", () => {;
  let reviewNumberLimit = reviewLimitInput.selectedOptions[0].value;
  mapYelpReviews(globalUserId, reviewNumberLimit);  // in index.js
});


// ==== PopUp ====

// Get the loading modal
let modal = document.getElementById("myModal");
// Get the <span> element that closes the modal
let span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
function popUpReview(reviewId) {
  document.getElementsByClassName("modal-body")[0].innerHTML = 
    `<iframe data-review-id="${reviewId}" class="yelp-review ui-droppable" /
    src="https://www.yelp.com/embed/review/${reviewId}" /
    scrolling="yes" style="display: block; width: 100%; height: 280px; border: 0px;"></iframe>`
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}