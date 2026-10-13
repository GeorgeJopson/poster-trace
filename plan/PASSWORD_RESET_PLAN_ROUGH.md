On the sign in page and account page, a link should exist "Reset my password", which points at a page: /password-reset
which holds a button to set off better auth password reset via email/ with opportunity to retry sending the email after 1 min has passed.
The redirect route should be /password-reset/authorized

To see how to enable/set up password reset, refer to https://better-auth.com/docs/authentication/email-password#request-password-reset

Utilize Resend to send the email, with React Email to create a basic styled template.
The resend key is stored as the RESEND_KEY env variable.

Remember to use the form components for the new password for example.

The /password-reset routes should be in the (public) route group.