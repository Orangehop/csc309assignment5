$(document).ready(function(){
	$("#messageDiv").hide();
	$('#eDescription').hide();
	$('#eEmail').hide();
	$('#eLocation').hide();
	$('#save').hide();
	$("#contact").click(function(){
		$(this).hide();
		$('#messageDiv').show();
		$('#comment').text(' ');
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
		$('#eDescription').show();
		$('#eEmail').show();
		$('#eLocation').show();
		$('#edit').hide();
		$('#save').show();
		$('#editLocation').val($('#Location').text());
		$('#editEmail').val($('#Email').text());
		$('#editDescription').val($('#Description').text());
	});

	$('#save').click(function(){
		$('#Location').show();
		$('#Email').show();
		$('#Description').show();
		$('#eDescription').hide();
		$('#eEmail').hide();
		$('#eLocation').hide();
		$('#save').hide();
		$('#edit').show();
		$('#Location').text($('#editLocation').val());
		$('#Email').text($('#editEmail').val());
		$('#Description').text($('#editDescription').val());

		
	});

});