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

var searchButton = function () {
    if (autocomplete) {
        if (autocomplete.getPlace()) {
            var place = autocomplete.getPlace();
            console.log(place.geometry.location.lat());
            console.log(place.geometry.location.lng());
            $("#errorMessageSearch").text("");
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
        $('#landingPage').hide();
        $('#navigation').show();
        $('navbarProfile').show();
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
    if (!$('#inputFirstName').val()) {
        console.log($("#inputFirstName"));
        $('#errorMessageSignUp').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if (!$('#inputLastName').val()) {
        console.log($("#inputLastName"));
        $('#errorMessageSignUp').text("Required fields missing!"); //give error message if fields are missing
        return;
    };
    if ($('#inputVerifyPassword').val() !== $('#inputPassword').val()) { //give error message if new password and verify password do not match
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
        $('#landingPage').hide();
        $("#navigation").show();
        $('navbarProfile').show();
    }).fail(function (data, status, xhr) {
        $('#errorMessage').text("Error creating user!"); //error message if user cannot be created
    });
}