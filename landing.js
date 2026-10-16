document.querySelector('#start-button').addEventListener('click', () => {
  window.location.assign('briefing.html');
});
document.querySelector('#privacy-button').addEventListener('click', () => document.querySelector('#privacy-dialog').showModal());
document.querySelector('.dialog-close').addEventListener('click', () => document.querySelector('#privacy-dialog').close());
