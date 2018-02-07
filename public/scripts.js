(function ($) {
	$(document).ready(function () {
		$("#login-form").submit(function (e) {
			return false;
		});
	});
    
    /*
    When user clicks on switch account, open another Plaid connect. If successful, make 
    another POST request to get access token and transaction data, then redirect to account page.
    */
	$('#switch-btn').on('click', function (e) {
		var handler = Plaid.create({
			apiVersion: 'v2',
			clientName: 'mckinsey_intern demo',
			env: 'development',
			product: ['transactions'],
			key: 'c33e0e4be0efac810ac297009186a8',
			onSuccess: function (public_token) {
				$.post('/get_access_token', {
					public_token: public_token
				}, function () {
					$.post('/transactions', function (data) {
                        window.location = 'https://connected-account-management.herokuapp.com/account';
					});
				});
			},
		});
		handler.open();
	});

    /*
    Retrieve user entered email and password, send a POST request to login. If successful,
    open Plaid connection. If successful, make another POST request to get access token and
    transaction data, then redirect to account page.
    */
	$('#link-btn').on('click', function (e) {
		$('#loading').show();
		$.post('/checkLogin', {
			email: $('#inputEmail').val(),
			password: $('#inputPassword').val()
		}, function (data) {
			if (data) {
				var handler = Plaid.create({
					apiVersion: 'v2',
					clientName: 'mckinsey_intern demo',
					env: 'development',
					product: ['transactions'],
					key: 'c33e0e4be0efac810ac297009186a8',
					onExit: function () {
						$('#loading').hide();
					},
					onSuccess: function (public_token) {
						$.post('/get_access_token', {
							public_token: public_token
						}, function () {
							$.post('/transactions', function (data) {
								window.location = 'https://connected-account-management.herokuapp.com/account';
							});
						});
					}
				});
				handler.open();
			} else {
				$('#loading').hide();
				alert('Incorrect login, please try again');
			}
		});
	});
})(jQuery);