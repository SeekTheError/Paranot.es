Paranot.es is a web application that allow user to manage their notes in a "safe" way,
By safe, I mean that the notes are encrypted on the client side, so the decrypted version never transit on the network
The encryption method used for notes is AES(http://en.wikipedia.org/wiki/Advanced_Encryption_Standard), and the key is the user password. This password does not transit directly on the network either, instead, a hash of the login and the password is used for user authentication.

This is the lib used for encryption:
https://code.google.com/p/crypto-js/


IN MAINTENANCE----You can see it live at http://paranot.es

To install:
you need nodejs, npm and the redis server to run the application.

once it's install , simply use  

node app.js

and open your browser on "localhost"


