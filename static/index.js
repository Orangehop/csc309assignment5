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
    $("#inputCottageName").val("");
    $("#inputLocation").val("");
    $("#inputAddress").val("");
    $("#inputPrice").val("");
    $("#inputDatesAvailable").val("");
    $("#inputDescription").val("");
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

var getListingPage = function (listingName) {
    var formData = {
        listingName: listingName,
    };
    $.post('/getListing', formData).success(function (data, status, xhr) { //sends post to search
        var commentTable = '';
        for (i = 0; i < data.comments.length; i++) {
            tableHtml += '<tr><td><a href="javascript:getListingPage(\'' + data.comments[i].email + '\');">' + data.comments[i].email + '</a></td><td>' + data.comments[i].comment + '</td></tr>';
        };
        console.log(data);
        $('#userComments').html(commentTable);
        $('#cottageName').text(data.name);
        $('#editCottageName').text(data.name);
        $('#listingUser').html('<a href="javascript:getUserPage(\'' + data.email + '\');">' + data.username + '</a>');
        $('#listingAddress').text(data.address);
        $('#listingLocation').text(data.location);
        $('#listingPricing').text(data.pricing);
        $('#ListingDescription').text(data.description);
        $('#listingDatesAvailable').text(data.available);
        $('#editAddress').val(data.address);
        $('#editPrice').val(data.pricing);
        $('#editDescription').val(data.description);
        $('#editDatesAvailable').val(data.available);
        $('#input-21a').attr("value", data.rating);
        $('#input-21a').on('rating.change', function (event, value, caption) {
            var formData = {
                name: $('#cottageName').text(),
                rating: value
            };
            console.log(value);
            $.post('/rate', formData).success(function (data, status, xhr) { //sends post request to sing up
            });
        });
        $("#cottageListingPage").show();
        $("#searchResults").hide();
    });
}

var submitComment = function () {
    var formData = {
        name: $('#cottageName').text(),
        comment: $('#commentInput').val()
    };
    console.log(formData);
    $.post('/comment', formData).success(function (data, status, xhr) { //sends post request to sing up
        $('#commentInput').val("");
        getListingPage($('#cottageName').text());
    });
}

var editListing = function () {
    $("#displayListing").hide();
    $("#editLocation").val("");
    $("#editListing").show();
    var autoCompleteInput = document.getElementById('editLocation');
    var autoCompleteOptions = {
        types: ['(cities)'],
        componentRestrictions: {
            country: 'ca'
        }
    };
    autocomplete = new google.maps.places.Autocomplete(autoCompleteInput, autoCompleteOptions);
}

var saveListing = function () {
    if (autocomplete) {
        if (autocomplete.getPlace()) {
            var place = autocomplete.getPlace();
            console.log(place.geometry.location.lat());
            console.log(place.geometry.location.lng());
            var formData = {
                name: $('#cottageName').text(),
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                location: place.formatted_address,
                address: $('#editAddress').val(),
                rentAmount: $('#editPrice').val(),
                datesAvailable: $('#editDatesAvailable').val(),
                description: $('#editDescription').val()
            };
            console.log(formData);
            $("#errorEditListing").text("");
            $.post('/editListing', formData).success(function (data, status, xhr) { //sends post request to sing up
                $('#editListing').hide();
                $('#displayListing').show();
                getListingPage($("#cottageName").text());
            }).fail(function (data, status, xhr) {
                $('#errorEditListing').text("Error editing listing!"); //error message if user cannot be created
            });
        } else {
            $("#errorEditListing").text("Please select a valid location!");
        }
    }
}

var editUserProfile = function () {
    $("#userProfileDisplay").hide();
    $("#userProfileEdit").show();
}

var saveUserProfile = function () {
    var formData = {
        location: $('#editUserLocation').val(),
        fullname: $('#editUserFullName').val(),
        phone: $('#editUserPhone').val(),
        description: $('#editUserDescription').val()
    };
    console.log(formData);
    $("#errorEditProfile").text("");
    $.post('/editProfile', formData).success(function (data, status, xhr) { //sends post request to sing up
        $('#userProfileEdit').hide();
        $('#userProfileDisplay').show();
        getUserPage($("#userEmail").text());
    }).fail(function (data, status, xhr) {
        $('#errorEditListing').text("Error editing profile!"); //error message if user cannot be created
    });
}

var showNavigationPage = function () {
    $('#navigation').show();
    $('#navigation').siblings().hide();
}

var getCurrentUserListings = function () {
    $.post('/cottageByUser').success(function (data, status, xhr) { //sends post to search
        var tableHtml = '';
        for (i = 0; i < data.length; i++) {
            tableHtml += '<tr><td><span class="label label-default">'
            if (data[i].rating === -1) {
                tableHtml += 'No Rating';
            } else {
                tableHtml += data[i].rating + 'Stars';
            }
            tableHtml += '</span></td><td><a href="javascript:getListingPage(\'' + data[i].name + '\');">' + data[i].name + '</a></td><td>' + data[i].location + '</td></tr>';
        };
        $('#listingResults').html(tableHtml);
        $('#cottageSearch').val("");
        $('#search').hide();
        $('#searchResults').show();
    })
}

var getUserPage = function (email) {
    console.log("getuser");
    var formData = {
        email: email
    };
    $.post('/getUserByEmail', formData).success(function (data, status, xhr) { //sends post to search
        console.log(data);
        $('#userEmail').text(data.email);
        $('#editUserEmail').text(data.email);
        $('#userLocation').text(data.location);
        $('#userFullName').text(data.name);
        $('#userPhone').text(data.phone);
        $('#userDescription').text(data.description);
        $('#editUserFullName').val(data.name);
        $('#editUserLocation').val(data.location);
        $('#editUserPhone').val(data.phone);
        $('#editUserDescription').val(data.description);
        $("#userProfilePage").show();
        $("#userProfilePage").siblings().hide();
    }).fail(function (data, status, xhr) {
        console.log(xhr);
    });
}

var getCurrentUserPage = function () {
    var formData = {};
    $.post('/getUserByEmail', formData).success(function (data, status, xhr) { //sends post to search
        console.log(data);
        $('#userEmail').text(data.email);
        $('#editUserEmail').text(data.email);
        $('#userLocation').text(data.location);
        $('#userFullName').text(data.name);
        $('#userPhone').text(data.phone);
        $('#userDescription').text(data.description);
        $('#editUserFullName').val(data.name);
        $('#editUserLocation').val(data.location);
        $('#editUserPhone').val(data.phone);
        $('#editUserDescription').val(data.description);
        $("#userProfilePage").show();
        $("#userProfilePage").siblings().hide();
    });
}

var searchButton = function () {
    if (autocomplete) {
        if (autocomplete.getPlace()) {
            var place = autocomplete.getPlace();
            console.log(place.geometry.location.lat());
            console.log(place.geometry.location.lng());
            console.log(place.formated_address);
            $("#errorMessageSearch").text("");
            var formData = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                location: place.formatted_address
            };
            $.post('/cottageByLocation', formData).success(function (data, status, xhr) { //sends post to search
                var tableHtml = '';
                for (i = 0; i < data.length; i++) {
                    tableHtml += '<tr><td><span class="label label-default">'
                    if (data[i].rating === -1) {
                        tableHtml += 'No Rating';
                    } else {
                        tableHtml += data[i].rating + 'Stars';
                    }
                    tableHtml += '</span></td><td><a href="javascript:getListingPage(\'' + data[i].name + '\');">' + data[i].name + '</a></td><td>' + data[i].location + '</td></tr>';
                };
                $('#listingResults').html(tableHtml);
                $('#cottageSearch').val("");
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
            var formData = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                name: $('#inputCottageName').val(),
                location: place.formatted_address,
                address: $('#inputAddress').val(),
                rentAmount: $('#inputPrice').val(),
                datesAvailable: $('#inputDatesAvailable').val(),
                description: $('#inputDescription').val()
            };
            $("#errorMessageCreateListing").text("");
            $.post('/createListing', formData).success(function (data, status, xhr) { //sends post request to sing up
                $('#createListingPage').hide();
                $("#navigation").show();
            }).fail(function (data, status, xhr) {
                $('#errorMessageCreateListing').text("Error creating listing!"); //error message if user cannot be created
            });
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
        console.log(xhr);
        window.location.href = ('/application.html');
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
        email: $('#inputSignupEmail').val(),
        password: $('#inputSignupPassword').val()
    };
    console.log(formData);
    $.post('/signup', formData).success(function (data, status, xhr) { //sends post request to sing up
        window.location.href = ('/application.html');
    }).fail(function (data, status, xhr) {
        $('#errorMessage').text("Error creating user!"); //error message if user cannot be created
    });
}