// Deploy this Google Apps Script as a web app that runs as the team Gmail owner.
// The Vercel function checks that the sender is a captain or coach before calling it.
function createInviteSecret() {
  var properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('INVITE_SECRET')) {
    Logger.log('An invite secret already exists. Keep the value in Vercel.');
    return;
  }
  var secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  properties.setProperty('INVITE_SECRET', secret);
  Logger.log('Copy this secret into Vercel as GOOGLE_INVITE_SECRET: ' + secret);
}

function authorizeMail() {
  Logger.log('Remaining email recipients today: ' + MailApp.getRemainingDailyQuota());
}

function inviteResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(event) {
  try {
    var data = JSON.parse(event.postData.contents || '{}');
    var expected = PropertiesService.getScriptProperties().getProperty('INVITE_SECRET');
    if (!expected || data.secret !== expected) return inviteResponse({ ok: false });
    var email = String(data.email || '').trim();
    var name = String(data.teamName || '').replace(/[\r\n]/g, ' ').slice(0, 100);
    var link = String(data.inviteUrl || '');
    var html = String(data.htmlBody || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name ||
        !/^https:\/\/[a-z0-9.-]+\/\?invite=[A-Z0-9-]+$/i.test(link) ||
        !html || html.length > 15000 || html.indexOf(link.replace(/&/g, '&amp;')) < 0)
      return inviteResponse({ ok: false });
    if (MailApp.getRemainingDailyQuota() < 1) return inviteResponse({ ok: false });
    MailApp.sendEmail(email, 'Join ' + name + ' on FTC Team Tracker',
      name + ' invited you to join their team workspace.\n\nOpen this link to join: ' + link +
      '\n\nSign in with Google or email. A captain or coach will approve your request.',
      { htmlBody: html, name: 'FTC Team Tracker' });
    return inviteResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return inviteResponse({ ok: false });
  }
}
