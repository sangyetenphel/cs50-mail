document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#send-email').onclick = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value; 
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    })
  }
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Showing all mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    for(var i = 0; i < emails.length; i++) {
      const mails = document.createElement('div');
      mails.className = 'mails';
      mails.setAttribute('data-id', emails[i]['id'])
      mails.innerHTML = `
        <strong>${emails[i]['sender']}</strong> ${emails[i]['subject']}
        <span class='timestamp'>${emails[i]['timestamp']}</span>
        
      `

      // If it's inbox then add a button to archive or unarchive
      if(mailbox === 'inbox'){
        document.querySelector('#emails-view').innerHTML += `<button id=${emails[i]['id']} class='archive btn btn-warning' data-archive='archive'>Archive</button>`
      }
      if(mailbox === 'archive'){
        document.querySelector('#emails-view').innerHTML += `<button id=${emails[i]['id']} class='archive btn btn-warning' data-archive='unarchive'>Unarchive</button>`
      }

      // Change color of the mail's div if it is read or not
      if(emails[i]['read'] === false){
        mails.classList.add('unread')
      }else{
        mails.classList.add('read')
      }
      
      // Add the mail to our emails-view 
      document.querySelector('#emails-view').append(mails)

      // When user clicks archive or unarchive
      document.querySelectorAll('.archive').forEach(btn => {
        btn.onclick = function() {
          const archive = btn.getAttribute('data-archive')
          const email_id = btn.id

          if(archive === 'archive'){
            fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: true
              })
            })
            .then(() => {
              load_mailbox('inbox');
            })
          }else{
            fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: false
              })
            })
            .then(() => {
              load_mailbox('inbox');
            })
          }
        }
      })

      // When user clicks on a particular email from lists of email
      document.querySelectorAll('.mails').forEach(mail => {
        mail.onclick = function() {

          // Clear prev email
          document.querySelector('#email-view').innerHTML = ''

          // Hide the emails-view
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#email-view').style.display = 'block';

          const mail_id = mail.getAttribute('data-id')
          fetch(`/emails/${mail_id}`)
          .then(response => response.json())
          .then(email => {
            console.log(email)
            const mail = document.createElement('div')
            mail.className = 'mail'
            mail.innerHTML = 
            `
              <h6><strong>From:</strong> ${email['sender']}</h6>
              <h6><strong>To:</strong> ${email['recipients']}</h6>
              <h6><strong>Subject:</strong> ${email['subject']}</h6>
              <h6><strong>Timestamp:</strong> ${email['timestamp']}</h6>
              <button class='btn btn-outline-primary reply'>Reply</button>
              <hr>
              ${email['body']}
            `
            document.querySelector('#email-view').append(mail)

            // Make a PUT request to update email is read
            fetch(`/emails/${mail_id}`, {
              method: 'PUT',
              body: JSON.stringify({
                read: true
              })
            })

            document.querySelectorAll('.reply').forEach(function(button){
              button.onclick = function(){
                compose_email()
                document.querySelector('#compose-recipients').value = email['sender']
                document.querySelector('#compose-subject').value = 'Re: ' + email['subject']
                document.querySelector('#compose-body').value = `On ${email['timestamp']} ${email['sender']} wrote: ${email['body']}`
              }
            })

          })
        }
      })
    } 
  })
}

