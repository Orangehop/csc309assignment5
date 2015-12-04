$(document).ready(function(){
	$("#messageDiv").hide();

	$("#contact").click(function(){
		$(this).hide();
		$('#messageDiv').show();
	});
	$("#send").click(function(){
		$('#messageDiv').hide();
		$('#contact').show();
	});
});