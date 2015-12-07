var autocomplete;

var signUpButton = function () {
    $("#login").hide();
    $("#cover").hide();
    $("#signup").show();
    $('#errorMessageSignUp').text("");
}

var loginButton = function () {
    $("#signup").hide();
    $("#cover").hide();
    $("#login").show();
    $('#errorMessageLogin').text("");
}

var createListingButton = function () {
    $("#navigation").hide();
    $("#createListingPage").show();
    var autoCompleteInput = document.getElementById('inputLocation');
    var autoCompleteOptions = {
        types: ['(cities)'],
        componentRestrictions: {
            country: 'ca'
        }
    };
    autocomplete = new google.maps.places.Autocomplete(autoCompleteInput, autoCompleteOptions);
}

var searchForListingButton = function () {
    $("#navigation").hide();
    $("#search").show();
    var autoCompleteInput = document.getElementById('cottageSearch');
    var autoCompleteOptions = {
        types: ['(cities)'],
        componentRestrictions: {
            country: 'ca'
        }
    };
    autocomplete = new google.maps.places.Autocomplete(autoCompleteInput, autoCompleteOptions);
}

var getListingPage = function (listingId) {
    var formData = {
        listingId: listingId,
    };
    $.post('/getListing', formData).success(function (data, status, xhr) { //sends post to search
        var commentTable = '';
        for (i = 0; i < data.comments.length; i++) {
            tableHtml += '<tr><td><a href="javascript:getListingPage(\'' + data.comments[i].userId + '\');">' + data.comments[i].username + '</a></td><td>' + data.comments[i].comment + '</td><td>' + data.comments[i].submitTime + '</td></tr>';
        };
        $('#userComments').html(commentTable);
        $('#listingUser').text(data.username);
        $('#listingAddress').text(data.address);
        $('#listingLocation').text(data.location);
        $('#listingPricing').text(data.pricing);
        $('#ListingDescription').text(data.description);
        $('#listingDatesAvailable').text(data.available);
        $('#eAddress').text(data.address);
        $('#eLocation').text(data.location);
        $('#ePricing').text(data.pricing);
        $('#eDescription').text(data.description);
        $('#eDatesAvailable').text(data.available);
        $("#cottageListingPage").show();
        $("wrapper").not(":eq(#cottageListingPage)").hide();
    });
}

var searchButton = function () {
    if (autocomplete) {
        if (autocomplete.getPlace()) {
            var place = autocomplete.getPlace();
            console.log(place.geometry.location.lat());
            console.log(place.geometry.location.lng());
            $("#errorMessageSearch").text("");
            var formData = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };
            $.post('/searchListings', formData).success(function (data, status, xhr) { //sends post to search
                var tableHtml = '';
                for (i = 0; i < data.length; i++) {
                    tableHtml += '<tr><td><img data-src="holder.js/100x100" class="img-thumbnail" alt="100x100" style="width: 100px; height: 100px;" src="' + data[i].picture + '" data-holder-rendered="true"></td><td><a href="javascript:getListingPage(\'' + data[i].listingId + '\');">' + data[i].name + '</a></td><td><a href="javascript:getListingPage(\'' + data[i].listingId + '\');">' + data[i].displayName + '</a></td></tr>';
                };
                $('#listingResults').html(tableHtml);
                $('#search').hide();
                $('#searchResults').show();

            }).fail(function (data, status, xhr) {
                $('#errorMessageSearch').text("Internal Server Error!"); //error message if user cannot be created
            });
        } else {
            $("#errorMessageSearch").text("Please select a valid location!");
        }
    }
}

var createButton = function () {
    $('#errorMessageCreateListing').text("");
    if (!$('#inputCottageName').val()) {
        $('#errorMessageCreateListing').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputLocation').val()) {
        $('#errorMessageCreateListing').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputPrice').val()) {
        $('#errorMessageCreateListing').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputDatesAvailable').val()) {
        $('#errorMessageCreateListing').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputDescription').val()) {
        $('#errorMessageCreateListing').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (autocomplete) {
        if (autocomplete.getPlace()) {
            var place = autocomplete.getPlace();
            console.log(place.geometry.location.lat());
            console.log(place.geometry.location.lng());
            console.log(place.getName());
            var formData = {
                placeName: place.getName(),
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                cottageName: $('#inputCottageName').val(),
                price: $('#inputPrice').val(),
                datesAvailable: $('#inputDatesAvailable').val(),
                description: $('#inputDescription').val()
            };
            $("#errorMessageCreateListing").text("");
        } else {
            $("#errorMessageCreateListing").text("Please select a valid location!");
        }
    }
}

var login = function () { //logs into application
    $('#errorMessageLogin').text("");
    if (!$('#inputEmail').val()) {
        $('#errorMessageLogin').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputPassword').val()) {
        $('#errorMessageLogin').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    var formData = {
        email: $('#inputEmail').val(),
        password: $('#inputPassword').val()
    };
    $.post('/login', formData).success(function (data, status, xhr) { //sends post request to login
        $('#login').hide();
        $('#navigation').show();
        $('#navbarProfile').show();
    }).fail(function (data, status, xhr) {
        $('#errorMessageLogin').text("Authentication Failed!"); // error message if unable to login
    });
}

var signUp = function () {
    $('#errorMessageSignUp').text("");
    if (!$('#inputSignupEmail').val()) {
        $('#errorMessageSignUp').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputSignupPassword').val()) {
        $('#errorMessageSignUp').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputVerifyPassword').val()) {
        console.log($("#inputVerifyPassword"));
        $('#errorMessageSignUp').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if ($('#inputVerifyPassword').val() !== $('#inputSignupPassword').val()) { //give error message if new password and verify password do not match
        $('#errorMessageSignUp').text("Passwords do not match!");
        return;
    };
    var formData = {
        email: $('#inputEmail').val(),
        password: $('#inputPassword').val(),
        firstName: $('#inputFirstName').val(),
        lastName: $('#inputLastName').val()
    };
    $.post('/signup', formData).success(function (data, status, xhr) { //sends post request to sing up
        $('#signup').hide();
        $("#navigation").show();
        $('#navbarProfile').show();
    }).fail(function (data, status, xhr) {
        $('#errorMessage').text("Error creating user!"); //error message if user cannot be created
    });
}