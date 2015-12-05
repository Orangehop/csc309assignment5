$(document).ready(function(){
	$("#messageDiv").hide();
	$('#eDescription').hide();
	$('#eEmail').hide();
	$('#eLocation').hide();
	$('#ePhone').hide();
	$('#save').hide();
	$("#contact").click(function(){
		$(this).hide();
		$('#messageDiv').show();
		$('#comment').val('');
	});
	$("#send").click(function(){
		$('#messageDiv').hide();
		$('#contact').show();
		var message = $('#comment').val();
	});

	$('#edit').click(function(){
		$('#Location').hide();
		$('#Email').hide();
		$('#Description').hide();
		$('#Phone').hide();
		$('#eDescription').show();
		$('#eEmail').show();
		$('#eLocation').show();
		$('#ePhone').show();
		$('#edit').hide();
		$('#save').show();
		$('#editLocation').val($('#Location').text());
		$('#editEmail').val($('#Email').text());
		$('#editDescription').val($('#Description').text());
		$('#editPhone').val($('#Phone').text());
	});

	$('#save').click(function(){
		$('#Location').show();
		$('#Email').show();
		$('#Description').show();
		$('#Phone').show();
		$('#eDescription').hide();
		$('#eEmail').hide();
		$('#eLocation').hide();
		$('#ePhone').hide();
		$('#save').hide();
		$('#edit').show();
		$('#Location').text($('#editLocation').val());
		$('#Email').text($('#editEmail').val());
		$('#Description').text($('#editDescription').val());
		$('#Phone').text($('#editPhone').val());

		
	});

});