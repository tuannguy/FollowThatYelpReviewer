/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contains code from: https://acleach.me.uk/gmaps/v3/plotaddresses.htm
 */

// ==== Global variables ====

let geocoder;
let bounds;
let map;
let reviews;
let nextReview;
let markers = [];
let delay = 100;  // delay between geocode requests


// ==== Initialize and add the map ====

function initMap() {
  geocoder = new google.maps.Geocoder(); 
  const USAcenter = { lat: 39.8097343, lng: -98.5556199 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: USAcenter,
    zoom: 4,
  });
}

window.initMap = initMap; 


// ==== Proccess Yelp Review Data =====

// Geocoding 
function getAddress(review, next) {

  let search = review.Address;
  geocoder.geocode({address:search}, function (results,status) { 
    // If that was successful
    if (status == google.maps.GeocoderStatus.OK) {
      // Lets assume that the first marker is the one we want
      let p = results[0].geometry.location;
      let lat=p.lat();
      let lng=p.lng();
      // Create a marker
      createMarker(review.ReviewId,lat,lng);
    }
    else {
      // === if we were sending the requests to fast, try this one again and increase the delay
      if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
        nextReview--;
        delay++;
      }
    }
    theNext();
  });
}

// Create a marker
function createMarker(reviewId,lat,lng) {
  let marker = new google.maps.Marker({
    position: new google.maps.LatLng(lat,lng),
    map: map
  });

  marker.addListener("click", () => {
    popUpReview(reviewId); //in scripts.js
  });

  markers.push(marker);

  bounds.extend(marker.position);
};


// Call the next Geocode operation when the reply comes back
function theNext() {

  let loader = document.getElementById("loaderScreen");
  let loaderProgress = loader.getElementsByTagName("p");

  if (nextReview < reviews.length) {

    setTimeout(getAddress(reviews[nextReview],theNext), delay);
        
    loaderProgress.textContent = `Loading: ${nextReview} / ${reviews.length} reviews`

    nextReview++;
  } else {    // We're done!

    loaderProgress.textContent = `Loading: ${reviews.length} / ${reviews.length} reviews`

    map.fitBounds(bounds, { // paddings
      left: document.getElementById('userInfoContainer').offsetWidth,
      top: document.getElementById('headerContainer').offsetHeight
    });

    loader.style.display = "none";
  }
}

function resetMap() {

  for (let curMarker of markers) {
    curMarker.setMap(null);
  }
  markers = [];
  bounds = new google.maps.LatLngBounds();
  nextReview = 0;
}

async function mapYelpReviews(userId, reviewNumberLimit) {

  resetMap();

  let loader = document.getElementById("loaderScreen");
  let loaderProgress = loader.getElementsByTagName("p");
  loader.style.display = "block";
  loaderProgress.textContent = `Getting data...`

  let endpoint = `/api/v1/yelpScraper/getReviews/${userId}/${reviewNumberLimit}`

  success = true;
  reviews = await axios(endpoint)
    .then(
      response => response.data.data
    )
    .catch(error => {
      alert(`${error.message}\n${error.response.data.error}`);
      success = false;
    });

  if (success) {
    if (reviews && reviews.length > 0) {

      loaderProgress.textContent = `Loading: 0 / ${reviews.length} reviews`

      theNext();
    }
    else {
      loader.style.display = "none";
      alert('User does not have any review');
    }
  } else {
    loader.style.display = "none";
  }
}
