function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character],
  );
}

export function inviteEmailHtml(teamName, inviteUrl, code) {
  const team = escapeHtml(teamName);
  const link = escapeHtml(inviteUrl);
  const joinCode = escapeHtml(code);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Team invitation</title></head>
<body style="margin:0;padding:0;background:#090909;color:#f7f4ef;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#090909;"><tr><td align="center" style="padding:32px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-collapse:collapse;">
<tr><td style="padding:0 2px 20px;font-size:12px;font-weight:800;letter-spacing:3px;color:#ff790a;">FTC <span style="color:#f7f4ef;">TEAM TRACKER</span><span style="color:#ff790a;">.</span></td></tr>
<tr><td style="height:5px;background:#ff790a;border-radius:10px 10px 0 0;"></td></tr>
<tr><td style="padding:40px 38px 32px;border:1px solid #3d332a;border-top:0;border-radius:0 0 18px 18px;background:#171512;">
<p style="margin:0 0 20px;color:#ff9a43;font-size:11px;font-weight:800;letter-spacing:2px;">TEAM ACCESS / INVITATION</p>
<h1 style="margin:0;color:#f7f4ef;font-size:38px;line-height:1.08;letter-spacing:-1.5px;">YOU'RE INVITED<br><span style="color:#ff790a;">TO THE CREW.</span></h1>
<p style="margin:22px 0 8px;color:#c9c0b7;font-size:16px;line-height:1.6;"><strong style="color:#fff;">${team}</strong> invited you to their team workspace. Join the crew and keep the work moving.</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;border-collapse:collapse;border:1px solid #42352b;border-radius:10px;background:#201a16;"><tr><td style="padding:16px 18px;color:#ff9a43;font-size:11px;font-weight:800;letter-spacing:2px;">YOUR JOIN CODE</td><td align="right" style="padding:16px 18px;color:#f7f4ef;font-size:18px;font-weight:800;letter-spacing:3px;">${joinCode}</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 24px;"><tr><td align="center" bgcolor="#ff790a" style="border-radius:9px;"><a href="${link}" style="display:inline-block;padding:17px 28px;color:#16100a;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:.2px;">JOIN THE TEAM</a></td></tr></table>
<p style="margin:0;color:#a9a19b;font-size:13px;line-height:1.6;">Sign in with Google or email, then request access. A captain or coach will approve your request.</p>
<div style="height:1px;background:#3b332d;margin:30px 0 22px;"></div>
<p style="margin:0 0 8px;color:#c9c0b7;font-size:12px;">Button not opening? Use this link:</p>
<p style="margin:0;overflow-wrap:anywhere;word-break:break-all;font-size:12px;line-height:1.6;"><a href="${link}" style="color:#ff9a43;">${link}</a></p>
</td></tr>
<tr><td style="padding:22px 2px;color:#77716d;font-size:10px;letter-spacing:2px;text-align:center;">BUILD. TEST. ITERATE. REPEAT.</td></tr>
</table></td></tr></table></body></html>`;
}
