This is a Jazz platform service that will help with sending email notifications. 

This service requires the following POST body:

```javascript
{ 
    "from": '"Jazz Admin" <JazzAdminemailaddress>', 
    "to": 'receiver@sender.com',
    "subject": 'Email subject',
    "text": 'Plaintext version of the message',
    "html": 'HTML version of the message'
}
```

* from – The e-mail address of the sender. All e-mail addresses can be plain 'sender@server.com' or formatted '"Sender Name" <sender@server.com>'
* to – Comma separated list or an array of recipients e-mail addresses that will appear on the To: field
* subject – The subject of the e-mail
* text – The plaintext version of the message as an Unicode string, Buffer, Stream
* html – The HTML version of the message as an Unicode string, Buffer, Stream or an attachment-like object ({path: 'http://...'})