// src/index.js
var HTML = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Datenschutz \xB7 Yannick Salm</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#07070f;--surface:#0f0f1a;--card:#13131f;
  --border:rgba(255,255,255,0.07);--border-s:rgba(255,255,255,0.13);
  --accent:#7c6aff;--accent-m:rgba(124,106,255,0.12);--accent-t:#bdb0ff;
  --text:#eeeeff;--muted:#8888aa;--subtle:#555577;
}
html{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;font-size:15px}
body{min-height:100vh}

body[data-lang="de"] .en{display:none!important}
body[data-lang="en"] .de{display:none!important}
.tab-panel{display:none}
.tab-panel.active{display:block}

header{
  position:sticky;top:0;z-index:100;
  background:rgba(7,7,15,.9);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);padding:0 24px
}
.header-inner{
  max-width:820px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;height:56px
}
.logo{font-size:15px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:9px;text-decoration:none}
.logo-icon{width:26px;height:26px;border-radius:7px;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-icon svg{display:block}
.logo-sub{color:var(--subtle);font-weight:400;font-size:14px}

.lang-toggle{display:flex;gap:4px}
.lang-btn{
  padding:4px 11px;border-radius:6px;border:1px solid var(--border-s);
  background:none;color:var(--muted);font-family:inherit;font-size:12px;
  font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:.04em
}
.lang-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}

.tab-bar{
  position:sticky;top:56px;z-index:99;
  background:rgba(7,7,15,.9);backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);padding:0 24px
}
.tab-bar-inner{max-width:820px;margin:0 auto;display:flex}
.tab-btn{
  padding:14px 22px;background:none;border:none;cursor:pointer;
  font-family:inherit;font-size:14px;font-weight:500;color:var(--muted);
  border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s;white-space:nowrap
}
.tab-btn.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
.tab-btn:hover:not(.active){color:var(--text)}

main{max-width:820px;margin:0 auto;padding:48px 24px 96px}

h1{font-size:27px;font-weight:700;margin-bottom:6px}
.subtitle{font-size:13px;color:var(--subtle);margin-bottom:40px}
h2{font-size:16px;font-weight:600;color:var(--text);margin:32px 0 10px}
h3{font-size:12px;font-weight:600;color:var(--subtle);text-transform:uppercase;letter-spacing:.06em;margin:24px 0 8px}
p{color:var(--muted);margin-bottom:12px}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
ul{color:var(--muted);padding-left:20px;margin-bottom:12px}
li{margin-bottom:5px}
strong{color:var(--text);font-weight:600}

table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px}
th{text-align:left;padding:9px 14px;background:var(--surface);color:var(--subtle);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--border)}
td{padding:10px 14px;color:var(--muted);border-bottom:1px solid var(--border);vertical-align:top}
td:first-child{color:var(--text);font-weight:500;white-space:nowrap;width:140px}
tr:last-child td{border-bottom:none}
.table-wrap{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px}

.info{background:var(--accent-m);border:1px solid rgba(124,106,255,.22);border-radius:10px;padding:14px 18px;margin-bottom:16px}
.info p{margin:0;font-size:14px;color:var(--muted)}
.info strong{color:var(--accent-t)}
.warn{background:rgba(245,166,35,.08);border:1px solid rgba(245,166,35,.2);border-radius:10px;padding:14px 18px;margin-bottom:16px}
.warn p{margin:0;font-size:14px;color:var(--muted)}
.warn strong{color:#f5a623}

.rights{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:12px}
.right{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px}
.right-art{font-size:11px;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.right-name{font-size:14px;font-weight:600;color:var(--text);margin-bottom:3px}
.right-desc{font-size:13px;color:var(--muted)}

.divider{height:1px;background:var(--border);margin:40px 0}

footer{border-top:1px solid var(--border);padding:28px 24px;text-align:center}
footer p{font-size:13px;color:var(--subtle);margin:0}

@media(max-width:600px){
  main{padding:32px 16px 64px}
  h1{font-size:22px}
  .tab-btn{padding:12px 14px;font-size:13px}
  td:first-child{width:100px}
}
</style>
</head>
<body data-lang="de">

<header>
  <div class="header-inner">
    <div class="logo">
      <div class="logo-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <span class="de">Datenschutz</span><span class="en">Privacy Policy</span>
      <span class="logo-sub">\xB7 Yannick Salm</span>
    </div>
    <div class="lang-toggle">
      <button class="lang-btn active" data-lang="de" onclick="setLang('de')">DE</button>
      <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
    </div>
  </div>
</header>

<div class="tab-bar">
  <div class="tab-bar-inner">
    <button class="tab-btn active" data-tab="portfolio" onclick="setTab('portfolio')">Portfolio</button>
    <button class="tab-btn" data-tab="ys-workout" onclick="setTab('ys-workout')">ys-workout</button>
    <button class="tab-btn" data-tab="ptone" onclick="setTab('ptone')">PTOne</button>
  </div>
</div>

<main>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PORTFOLIO \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="tab-portfolio" class="tab-panel active">

  <div class="de">
    <h1>Portfolio \xB7 yannicksalm.ch</h1>
    <p class="subtitle">Letzte Aktualisierung: Mai 2026</p>

    <h2>1. Verantwortlicher</h2>
    <p><strong>Yannick Salm</strong><br>Schweiz<br>E-Mail: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. Was ist die Portfolio-Website?</h2>
    <p>yannicksalm.ch ist eine pers\xF6nliche Portfolio-Website zur Pr\xE4sentation von Projekten, F\xE4higkeiten und beruflichem Werdegang. Es handelt sich um eine reine Pr\xE4sentationsseite ohne Nutzerkonten oder interaktive Dienste.</p>

    <h2>3. Erhobene Daten</h2>
    <p>Es werden <strong>keine personenbezogenen Daten aktiv erhoben oder dauerhaft gespeichert.</strong> Es gibt keine Nutzerkonten, Newsletter oder Tracking-Dienste.</p>
    <p>Technische Verbindungsdaten (IP-Adresse, Browsertyp, Referrer, Zeitstempel) werden durch <strong>Cloudflare</strong> im Rahmen des Hostings und der DDoS-Absicherung kurzfristig verarbeitet und nicht dauerhaft von uns gespeichert.</p>
    <p>Datenschutzrichtlinie Cloudflare: <a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></p>

    <h2>4. Kontaktaufnahme per E-Mail</h2>
    <p>Bei direkter Kontaktaufnahme per E-Mail werden deine Angaben (Name, E-Mail-Adresse, Nachrichteninhalt) ausschlie\xDFlich zur Bearbeitung deiner Anfrage verwendet und nach Erledigung gel\xF6scht.</p>
    <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung / vorvertragliche Ma\xDFnahmen).</p>

    <h2>5. Cookies</h2>
    <p>Wir setzen keine eigenen Tracking- oder Marketing-Cookies. Cloudflare kann technische Sicherheits-Cookies setzen (z. B. <code>__cf_bm</code>), die keine personenbezogenen Nutzerdaten speichern.</p>

    <h2>6. Deine Rechte</h2>
    <p>Gem\xE4\xDF DSGVO und dem Schweizer Datenschutzgesetz (nDSG) stehen dir folgende Rechte zu. Kontakt: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 DSGVO</div><div class="right-name">Auskunft</div><div class="right-desc">Einblick in gespeicherte Daten</div></div>
      <div class="right"><div class="right-art">Art. 16 DSGVO</div><div class="right-name">Berichtigung</div><div class="right-desc">Korrektur unrichtiger Daten</div></div>
      <div class="right"><div class="right-art">Art. 17 DSGVO</div><div class="right-name">L\xF6schung</div><div class="right-desc">Recht auf Vergessenwerden</div></div>
      <div class="right"><div class="right-art">Art. 21 DSGVO</div><div class="right-name">Widerspruch</div><div class="right-desc">Widerspruch gegen Verarbeitung</div></div>
    </div>
    <p style="margin-top:16px">Beschwerden k\xF6nnen beim <strong>Eidgen\xF6ssischen Datenschutz- und \xD6ffentlichkeitsbeauftragten (ED\xD6B)</strong> eingereicht werden: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>

  <div class="en">
    <h1>Portfolio \xB7 yannicksalm.ch</h1>
    <p class="subtitle">Last updated: May 2026</p>

    <h2>1. Data Controller</h2>
    <p><strong>Yannick Salm</strong><br>Switzerland<br>Email: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. What is the portfolio website?</h2>
    <p>yannicksalm.ch is a personal portfolio website showcasing projects, skills, and professional background. It is a purely presentational site with no user accounts or interactive services.</p>

    <h2>3. Data collected</h2>
    <p><strong>No personal data is actively collected or permanently stored.</strong> There are no user accounts, newsletters, or tracking services.</p>
    <p>Technical connection data (IP address, browser type, referrer, timestamps) are processed by <strong>Cloudflare</strong> as part of hosting and DDoS protection, and are not permanently stored by us.</p>
    <p>Cloudflare privacy policy: <a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></p>

    <h2>4. Contact by email</h2>
    <p>If you contact us by email, your details (name, email address, message content) will be used solely to process your inquiry and deleted once resolved.</p>
    <p><strong>Legal basis:</strong> Art. 6(1)(b) GDPR (contract initiation / pre-contractual measures).</p>

    <h2>5. Cookies</h2>
    <p>We do not set any tracking or marketing cookies of our own. Cloudflare may set technical security cookies (e.g. <code>__cf_bm</code>) that do not store personal user data.</p>

    <h2>6. Your rights</h2>
    <p>Under GDPR and the Swiss Data Protection Act (nDSG), you have the following rights. Contact: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 GDPR</div><div class="right-name">Access</div><div class="right-desc">View your stored data</div></div>
      <div class="right"><div class="right-art">Art. 16 GDPR</div><div class="right-name">Rectification</div><div class="right-desc">Correct inaccurate data</div></div>
      <div class="right"><div class="right-art">Art. 17 GDPR</div><div class="right-name">Erasure</div><div class="right-desc">Right to be forgotten</div></div>
      <div class="right"><div class="right-art">Art. 21 GDPR</div><div class="right-name">Objection</div><div class="right-desc">Object to data processing</div></div>
    </div>
    <p style="margin-top:16px">Complaints can be lodged with the <strong>Federal Data Protection and Information Commissioner (FDPIC)</strong>: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 YS-WORKOUT \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="tab-ys-workout" class="tab-panel">

  <div class="de">
    <h1>ys-workout</h1>
    <p class="subtitle">Letzte Aktualisierung: Mai 2026</p>

    <h2>1. Verantwortlicher</h2>
    <p><strong>Yannick Salm</strong><br>Schweiz<br>E-Mail: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. Was ist ys-workout?</h2>
    <p>ys-workout ist eine Trainings-Tracking-App zur digitalen Erfassung von Workouts, \xDCbungen, K\xF6rperma\xDFen und pers\xF6nlichen Rekorden. Die App richtet sich an Personen, die ihr Training eigenst\xE4ndig dokumentieren und auswerten m\xF6chten.</p>

    <h2>3. Erhobene Daten</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Kategorie</th><th>Daten</th><th>Pflichtfeld</th></tr>
        <tr><td>Konto</td><td>E-Mail-Adresse, Vor- und Nachname</td><td>Ja</td></tr>
        <tr><td>Profil</td><td>Profilfoto, Anzeigeename</td><td>Nein</td></tr>
        <tr><td>Training</td><td>Workouts, \xDCbungen, Sets, Gewichte, Wiederholungen, Notizen, Datum</td><td>Nein</td></tr>
        <tr><td>K\xF6rper</td><td>Gewicht, K\xF6rperma\xDFe, Datum der Messung</td><td>Nein</td></tr>
        <tr><td>Technisch</td><td>IP-Adresse (via Cloudflare), Ger\xE4teinformationen, Zeitstempel</td><td>Automatisch</td></tr>
      </table>
    </div>

    <h2>4. Zweck und Rechtsgrundlagen</h2>
    <p><strong>Vertragserf\xFCllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Konto-Daten werden zur Bereitstellung der App-Funktionen ben\xF6tigt.</p>
    <p><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Optionale Daten (K\xF6rperma\xDFe, Profilfoto) werden nur auf deine aktive Eingabe hin gespeichert.</p>
    <p><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Technische Betriebsdaten zur Sicherstellung der App-Funktionalit\xE4t.</p>

    <h2>5. Google-Login (optional)</h2>
    <p>Falls du dich mit Google anmeldest, erh\xE4lt ys-workout von Google ausschlie\xDFlich <strong>E-Mail-Adresse und Namen</strong>. Kein Zugriff auf andere Google-Dienste oder -Daten.</p>
    <p>Datenschutzrichtlinie Google: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>6. Daten\xFCbertragung und Infrastruktur</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Dienst</th><th>Zweck</th><th>Serverstandort</th></tr>
        <tr><td>Supabase</td><td>Datenbank, Authentifizierung</td><td>EU \u2013 Frankfurt, Deutschland</td></tr>
        <tr><td>Cloudflare</td><td>Hosting, CDN, DDoS-Schutz</td><td>EU (prim\xE4r)</td></tr>
        <tr><td>Google OAuth</td><td>Optionaler Login</td><td>USA / weltweit</td></tr>
      </table>
    </div>
    <p>Supabase-Datenschutz: <a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></p>

    <h2>7. Datenweitergabe</h2>
    <p>Deine Daten werden <strong>nicht verkauft</strong> und nicht an Dritte f\xFCr Marketingzwecke weitergegeben. Eine Weitergabe erfolgt ausschlie\xDFlich an die oben genannten Infrastrukturdienstleister, die als Auftragsverarbeiter gem\xE4\xDF Art. 28 DSGVO t\xE4tig sind.</p>

    <h2>8. Aufbewahrung und L\xF6schung</h2>
    <p>Deine Daten werden gespeichert, bis du dein Konto l\xF6schst. Du kannst dein Konto und alle damit verbundenen Daten jederzeit in den App-Einstellungen vollst\xE4ndig l\xF6schen. Nach L\xF6schung werden alle personenbezogenen Daten innerhalb von 30 Tagen unwiderruflich entfernt.</p>

    <h2>9. Deine Rechte</h2>
    <p>Kontakt zur Rechteaus\xFCbung: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 DSGVO</div><div class="right-name">Auskunft</div><div class="right-desc">Einblick in gespeicherte Daten</div></div>
      <div class="right"><div class="right-art">Art. 16 DSGVO</div><div class="right-name">Berichtigung</div><div class="right-desc">Korrektur unrichtiger Daten</div></div>
      <div class="right"><div class="right-art">Art. 17 DSGVO</div><div class="right-name">L\xF6schung</div><div class="right-desc">Recht auf Vergessenwerden</div></div>
      <div class="right"><div class="right-art">Art. 18 DSGVO</div><div class="right-name">Einschr\xE4nkung</div><div class="right-desc">Einschr\xE4nkung der Verarbeitung</div></div>
      <div class="right"><div class="right-art">Art. 20 DSGVO</div><div class="right-name">Portabilit\xE4t</div><div class="right-desc">Export in maschinenlesbarem Format</div></div>
      <div class="right"><div class="right-art">Art. 21 DSGVO</div><div class="right-name">Widerspruch</div><div class="right-desc">Widerspruch gegen Verarbeitung</div></div>
    </div>
    <p style="margin-top:16px">Beschwerden beim <strong>ED\xD6B</strong>: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>

  <div class="en">
    <h1>ys-workout</h1>
    <p class="subtitle">Last updated: May 2026</p>

    <h2>1. Data Controller</h2>
    <p><strong>Yannick Salm</strong><br>Switzerland<br>Email: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. What is ys-workout?</h2>
    <p>ys-workout is a workout tracking app for digitally logging exercises, body measurements, and personal records. It is designed for individuals who want to document and analyse their training independently.</p>

    <h2>3. Data collected</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Category</th><th>Data</th><th>Required</th></tr>
        <tr><td>Account</td><td>Email address, first and last name</td><td>Yes</td></tr>
        <tr><td>Profile</td><td>Profile photo, display name</td><td>No</td></tr>
        <tr><td>Training</td><td>Workouts, exercises, sets, weights, reps, notes, date</td><td>No</td></tr>
        <tr><td>Body</td><td>Weight, body measurements, measurement date</td><td>No</td></tr>
        <tr><td>Technical</td><td>IP address (via Cloudflare), device info, timestamps</td><td>Automatic</td></tr>
      </table>
    </div>

    <h2>4. Purpose and legal basis</h2>
    <p><strong>Contract performance (Art. 6(1)(b) GDPR):</strong> Account data is required to provide app functionality.</p>
    <p><strong>Consent (Art. 6(1)(a) GDPR):</strong> Optional data (body measurements, profile photo) is stored only upon your active input.</p>
    <p><strong>Legitimate interest (Art. 6(1)(f) GDPR):</strong> Technical operational data to ensure app functionality.</p>

    <h2>5. Google login (optional)</h2>
    <p>If you sign in with Google, ys-workout receives only your <strong>email address and name</strong> from Google. No access to other Google services or data.</p>
    <p>Google privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>6. Data transfers and infrastructure</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Service</th><th>Purpose</th><th>Server location</th></tr>
        <tr><td>Supabase</td><td>Database, authentication</td><td>EU \u2013 Frankfurt, Germany</td></tr>
        <tr><td>Cloudflare</td><td>Hosting, CDN, DDoS protection</td><td>EU (primary)</td></tr>
        <tr><td>Google OAuth</td><td>Optional login</td><td>USA / worldwide</td></tr>
      </table>
    </div>
    <p>Supabase privacy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></p>

    <h2>7. Data sharing</h2>
    <p>Your data is <strong>never sold</strong> and not shared with third parties for marketing purposes. Sharing occurs only with the infrastructure providers listed above, who act as data processors under Art. 28 GDPR.</p>

    <h2>8. Retention and deletion</h2>
    <p>Your data is stored until you delete your account. You can permanently delete your account and all associated data at any time in app settings. After deletion, all personal data is irreversibly removed within 30 days.</p>

    <h2>9. Your rights</h2>
    <p>To exercise your rights, contact: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 GDPR</div><div class="right-name">Access</div><div class="right-desc">View your stored data</div></div>
      <div class="right"><div class="right-art">Art. 16 GDPR</div><div class="right-name">Rectification</div><div class="right-desc">Correct inaccurate data</div></div>
      <div class="right"><div class="right-art">Art. 17 GDPR</div><div class="right-name">Erasure</div><div class="right-desc">Right to be forgotten</div></div>
      <div class="right"><div class="right-art">Art. 18 GDPR</div><div class="right-name">Restriction</div><div class="right-desc">Restrict processing</div></div>
      <div class="right"><div class="right-art">Art. 20 GDPR</div><div class="right-name">Portability</div><div class="right-desc">Export in machine-readable format</div></div>
      <div class="right"><div class="right-art">Art. 21 GDPR</div><div class="right-name">Objection</div><div class="right-desc">Object to data processing</div></div>
    </div>
    <p style="margin-top:16px">Complaints to the <strong>FDPIC</strong>: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PTONE \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div id="tab-ptone" class="tab-panel">

  <div class="de">
    <h1>PTOne</h1>
    <p class="subtitle">Letzte Aktualisierung: 2. Juni 2026</p>

    <h2>1. Verantwortlicher</h2>
    <p><strong>Yannick Salm</strong><br>Zürich, Schweiz<br>E-Mail: <a href="mailto:info@yannicksalm.ch">info@yannicksalm.ch</a></p>

    <h2>2. Was ist PTOne?</h2>
    <p>PTOne (pt.yannicksalm.ch &middot; ptclient.yannicksalm.ch) ist eine SaaS-Plattform für Personal Trainer mit:</p>
    <ul>
      <li>Clientverwaltung und Trainingsplanung mit Übungsvideos</li>
      <li>Wöchentliche Journal-Einreichungen mit Körperdaten</li>
      <li>Buchhaltung: Swiss QR-Rechnungen (SPS 2022), Mahnwesen, PDF-Generierung</li>
      <li>Google Calendar-Integration für Termine</li>
      <li>Datei-Verwaltung (Drive): Dokumente, Rechnungs-PDFs, Übungsvideos</li>
      <li>E-Mail-Versand über Resend (Rechnungen, Mahnungen)</li>
      <li>Kontaktformular über Formspree</li>
    </ul>
    <p>Zwei Nutzerrollen: <strong>Personal Trainer (PT)</strong> und <strong>Client</strong>. PT-Zugang ausschließlich auf persönliche Anfrage.</p>

    <h2>3. Daten von Personal Trainern</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Kategorie</th><th>Daten</th><th>Pflichtfeld</th></tr>
        <tr><td>Konto</td><td>E-Mail, Vor-/Nachname, Passwort (bcrypt-gehasht)</td><td>Ja</td></tr>
        <tr><td>Profil</td><td>Profilfoto, Spezialisierungen, Kurzbiografie, Standort, Sprachen, Erfahrungsjahre, Stundensatz, Zertifizierungen</td><td>Nein</td></tr>
        <tr><td>Clients</td><td>Name, E-Mail, Status, Vertragsbeginn</td><td>Nein</td></tr>
        <tr><td>Trainingspläne</td><td>Titel, Übungen, Sets, Gewichte, Wdh., Supersets, Notizen</td><td>Nein</td></tr>
        <tr><td>Journal-Vorlagen</td><td>Titel, Fragen, Abschnitte</td><td>Nein</td></tr>
        <tr><td>Rechnungen</td><td>Empfänger, Positionen, Beträge, MwSt., Fälligkeitsdaten, Zahlungsstatus, PDF-URL, Versandzeitpunkt, Mahndaten</td><td>Nein</td></tr>
        <tr><td>Ausgaben</td><td>Bezeichnung, Betrag, Kategorie, Datum, Notizen, Beleg-Datei (optional), Wiederholungsintervall</td><td>Nein</td></tr>
        <tr><td>Buchhaltungseinst.</td><td>Währung, MwSt.-Satz, IBAN, Gläubiger-Adresse (Swiss QR), Rechnungspräfix, E-Mail-Vorlagen</td><td>Nein</td></tr>
        <tr><td>Übungsvideos</td><td>Videodateien + Metadaten (Titel, Übungs-ID, Pfad) in Supabase Storage (Bucket: pt_videos)</td><td>Nein</td></tr>
        <tr><td>Drive-Dateien</td><td>Dokumente, PDFs, Belege (Pfad, Name, Größe, Typ) in Supabase Storage (ptone_drive, accounting)</td><td>Nein</td></tr>
        <tr><td>Kalender</td><td>Google OAuth Access-/Refresh-Token, Standard-Kalender-ID</td><td>Nein</td></tr>
        <tr><td>Termine</td><td>Titel, Start-/Endzeit, Notizen, Client, Google Event-ID</td><td>Nein</td></tr>
      </table>
    </div>

    <h2>4. Daten von Clients</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Kategorie</th><th>Daten</th><th>Pflichtfeld</th></tr>
        <tr><td>Konto</td><td>E-Mail, Vor-/Nachname, Passwort (bcrypt-gehasht)</td><td>Ja</td></tr>
        <tr><td>Profil</td><td>Profilfoto, Anzeigename, Größe, Geburtstag, Ziel</td><td>Nein</td></tr>
        <tr><td>Journal</td><td>Gewicht, Taillen-/Brust-/Hüft-/Arm-/Beinumfang, Befinden (1–10), Notizen</td><td>Nein</td></tr>
        <tr><td>Workouts</td><td>Logbücher: Übungen, Sets, Gewichte, Wdh., Datum, Dauer</td><td>Nein</td></tr>
        <tr><td>Rechnungen</td><td>Lesezugriff auf PT-Rechnungen inkl. Positionen (read-only)</td><td>–</td></tr>
        <tr><td>Termine</td><td>Lesezugriff auf PT-erstellte Termine (read-only)</td><td>–</td></tr>
        <tr><td>Übungsvideos</td><td>Lesezugriff auf PT-Videos (read-only)</td><td>–</td></tr>
        <tr><td>Dokumente</td><td>Lesezugriff auf PT-geteilte Dateien (read-only)</td><td>–</td></tr>
      </table>
    </div>

    <div class="warn">
      <p><strong>Gesundheitsdaten (Art. 9 DSGVO):</strong> Körpermäße, Gewicht und Gesundheitsbefinden sind besondere Datenkategorien. Verarbeitung auf Basis ausdrücklicher <strong>Einwilligung</strong> (Art. 9 Abs. 2 lit. a DSGVO) durch aktive Nutzung der Journal-Funktion. Widerruf jederzeit möglich.</p>
    </div>

    <h2>5. Rechnungs-PDF und Dateispeicher</h2>
    <div class="info">
      <p>PDFs werden <strong>clientseitig im Browser</strong> generiert (jsPDF). Beim Versand Speicherung in <strong>Supabase Storage</strong>:</p>
    </div>
    <ul>
      <li><code>{PT-ID}/invoices/{Dateiname}.pdf</code> (PT-Archiv)</li>
      <li><code>{PT-ID}/clients/{Client-ID}/invoices/{Dateiname}.pdf</code> (Client-Ordner)</li>
    </ul>
    <p>Swiss QR-Rechnungen enthalten IBAN und Gläubiger-Adresse gemäß SPS 2022. Belege im Bucket <em>accounting</em>, Übungsvideos im Bucket <em>pt_videos</em>. Zugriff nur per Row-Level Security.</p>

    <h2>6. E-Mail-Versand (Resend)</h2>
    <p>Rechnungen und Mahnungen über <strong>Resend Inc.</strong> versendet. E-Mail-Adresse, Betreff, Inhalt und PDF werden übertragen.</p>
    <p>Datenschutz Resend: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal/privacy-policy</a></p>

    <h2>7. Google Calendar Integration (optional)</h2>
    <div class="info">
      <p>Bei Aktivierung unter <strong>Einstellungen &rarr; Integrationen</strong> speichern wir Access-Token, Refresh-Token und Google-E-Mail.</p>
    </div>
    <p>Termine in Google Calendar <em>und</em> PTOne-Datenbank gespeichert (inkl. Google Event-ID). Verbindung jederzeit trennbar – Tokens sofort gelöscht.</p>
    <p>Google-Datenschutz: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>8. Kontaktformular (Formspree)</h2>
    <p>Name, E-Mail und Nachricht werden an <strong>Formspree Inc.</strong> übermittelt. Keine dauerhafte Speicherung auf unseren Servern.</p>
    <p>Formspree: <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal/privacy-policy</a></p>

    <h2>9. Login-Optionen</h2>
    <p><strong>E-Mail / Passwort:</strong> Ausschließlich als bcrypt-Hash gespeichert.<br>
    <strong>Google Sign-In (optional):</strong> Nur E-Mail und Name. Unabhängig von der Calendar-Integration.</p>

    <h2>10. Infrastruktur</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Dienst</th><th>Zweck</th><th>Standort</th><th>Datenschutz</th></tr>
        <tr><td>Supabase</td><td>Datenbank, Auth, 3 Buckets (ptone_drive, accounting, pt_videos)</td><td>EU – Frankfurt</td><td><a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></td></tr>
        <tr><td>Cloudflare</td><td>Hosting aller 3 Apps (Workers), CDN, DDoS</td><td>EU (primär)</td><td><a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></td></tr>
        <tr><td>Google LLC</td><td>Login, Kalender-Integration</td><td>USA / weltweit</td><td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></td></tr>
        <tr><td>Resend Inc.</td><td>E-Mail-Versand</td><td>USA</td><td><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal</a></td></tr>
        <tr><td>Formspree Inc.</td><td>Kontaktformular</td><td>USA</td><td><a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal</a></td></tr>
      </table>
    </div>
    <p>Alle Anbieter nach Art. 28 DSGVO gebunden. US-Übertragungen auf Basis EU-SCCs.</p>

    <h2>11. Aufbewahrung</h2>
    <ul>
      <li><strong>Kontodaten:</strong> bis zur Kontolöschung</li>
      <li><strong>Rechnungen / Buchhaltung:</strong> 10 Jahre (Schweizer Gesetz)</li>
      <li><strong>Server-Logs:</strong> max. 90 Tage (Cloudflare)</li>
      <li><strong>Inaktive Konten:</strong> nach 24 Monaten</li>
    </ul>

    <h2>12. Cookies und localStorage</h2>
    <ul>
      <li><strong>Session-Cookies:</strong> Authentifizierung (technisch notwendig)</li>
      <li><strong>localStorage:</strong> Sprachpräferenz, Theme, Dashboard-Layout – nur lokal</li>
      <li>Kein Tracking, keine Analyse-Tools</li>
    </ul>

    <h2>13. Deine Rechte</h2>
    <p>Kontakt: <a href="mailto:info@yannicksalm.ch">info@yannicksalm.ch</a> – Antwort innerhalb 30 Tage.</p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 DSGVO</div><div class="right-name">Auskunft</div><div class="right-desc">Einblick in gespeicherte Daten</div></div>
      <div class="right"><div class="right-art">Art. 16 DSGVO</div><div class="right-name">Berichtigung</div><div class="right-desc">Korrektur unrichtiger Daten</div></div>
      <div class="right"><div class="right-art">Art. 17 DSGVO</div><div class="right-name">Löschung</div><div class="right-desc">Recht auf Vergessenwerden</div></div>
      <div class="right"><div class="right-art">Art. 18 DSGVO</div><div class="right-name">Einschränkung</div><div class="right-desc">Einschränkung der Verarbeitung</div></div>
      <div class="right"><div class="right-art">Art. 20 DSGVO</div><div class="right-name">Portabilität</div><div class="right-desc">Export in maschinenlesbarem Format</div></div>
      <div class="right"><div class="right-art">Art. 21 DSGVO</div><div class="right-name">Widerspruch</div><div class="right-desc">Widerspruch gegen Verarbeitung</div></div>
      <div class="right"><div class="right-art">Art. 7 DSGVO</div><div class="right-name">Widerruf</div><div class="right-desc">Widerruf erteilter Einwilligungen</div></div>
    </div>
    <p style="margin-top:16px">Beschwerden beim <strong>EDÖB</strong>: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>

  <div class="en">
    <h1>PTOne</h1>
    <p class="subtitle">Last updated: 2 June 2026</p>

    <h2>1. Data Controller</h2>
    <p><strong>Yannick Salm</strong><br>Zürich, Switzerland<br>Email: <a href="mailto:info@yannicksalm.ch">info@yannicksalm.ch</a></p>

    <h2>2. What is PTOne?</h2>
    <p>PTOne (pt.yannicksalm.ch &middot; ptclient.yannicksalm.ch) is a SaaS platform for personal trainers providing:</p>
    <ul>
      <li>Client management and training planning with exercise demo videos</li>
      <li>Weekly journal submissions with body metrics</li>
      <li>Accounting: Swiss QR invoices (SPS 2022), dunning and PDF generation</li>
      <li>Google Calendar integration for appointments</li>
      <li>File management (Drive): documents, invoice PDFs, exercise videos</li>
      <li>Email delivery via Resend (invoices, reminders)</li>
      <li>Contact form via Formspree</li>
    </ul>
    <p>Two user roles: <strong>Personal Trainer (PT)</strong> and <strong>Client</strong>. PT access by invitation only.</p>

    <h2>3. Data collected from Personal Trainers</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Category</th><th>Data</th><th>Required</th></tr>
        <tr><td>Account</td><td>Email, first/last name, password (bcrypt hashed)</td><td>Yes</td></tr>
        <tr><td>Profile</td><td>Profile photo, specialisations, bio, location, languages, years of exp., hourly rate, certifications</td><td>No</td></tr>
        <tr><td>Clients</td><td>Name, email, status, contract start date</td><td>No</td></tr>
        <tr><td>Training plans</td><td>Title, exercises, sets, weights, reps, supersets, notes</td><td>No</td></tr>
        <tr><td>Journal templates</td><td>Title, questions, sections</td><td>No</td></tr>
        <tr><td>Invoices</td><td>Recipient, line items, amounts, VAT, due dates, payment status, PDF URL, sent timestamp, dunning dates</td><td>No</td></tr>
        <tr><td>Expenses</td><td>Title, amount, category, date, notes, receipt file (optional), recurrence</td><td>No</td></tr>
        <tr><td>Accounting settings</td><td>Currency, tax rate, IBAN, creditor address (Swiss QR), invoice prefix, dunning templates</td><td>No</td></tr>
        <tr><td>Exercise videos</td><td>Video files + metadata (title, exercise ID, path) in Supabase Storage (pt_videos)</td><td>No</td></tr>
        <tr><td>Drive files</td><td>Documents, PDFs, receipts (path, name, size, type) in Supabase Storage (ptone_drive, accounting)</td><td>No</td></tr>
        <tr><td>Calendar</td><td>Google OAuth access/refresh token, default calendar ID</td><td>No</td></tr>
        <tr><td>Appointments</td><td>Title, start/end time, notes, linked client, Google event ID</td><td>No</td></tr>
      </table>
    </div>

    <h2>4. Data collected from Clients</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Category</th><th>Data</th><th>Required</th></tr>
        <tr><td>Account</td><td>Email, first/last name, password (bcrypt hashed)</td><td>Yes</td></tr>
        <tr><td>Profile</td><td>Profile photo, display name, height, date of birth, goal</td><td>No</td></tr>
        <tr><td>Journal</td><td>Weight, waist/chest/hip/arm/leg measurements, well-being (1&ndash;10), notes</td><td>No</td></tr>
        <tr><td>Workouts</td><td>Logbooks: exercises, sets, weights, reps, date, duration</td><td>No</td></tr>
        <tr><td>Invoices</td><td>Read access to PT invoices incl. line items (read-only)</td><td>&ndash;</td></tr>
        <tr><td>Appointments</td><td>Read access to PT-created appointments (read-only)</td><td>&ndash;</td></tr>
        <tr><td>Exercise videos</td><td>Read access to PT-uploaded demo videos (read-only)</td><td>&ndash;</td></tr>
        <tr><td>Documents</td><td>Read access to PT-shared files (read-only)</td><td>&ndash;</td></tr>
      </table>
    </div>

    <div class="warn">
      <p><strong>Health data (Art. 9 GDPR):</strong> Physical measurements, weight and well-being are special data categories. Processing based on explicit <strong>consent</strong> (Art. 9(2)(a) GDPR) given by using the journal feature. Withdrawal possible at any time.</p>
    </div>

    <h2>5. Invoice PDF and file storage</h2>
    <div class="info">
      <p>PDFs generated <strong>client-side in the browser</strong> (jsPDF). On sending, stored in <strong>Supabase Storage</strong>:</p>
    </div>
    <ul>
      <li><code>{PT-ID}/invoices/{filename}.pdf</code> (PT archive)</li>
      <li><code>{PT-ID}/clients/{Client-ID}/invoices/{filename}.pdf</code> (client folder)</li>
    </ul>
    <p>Swiss QR invoices contain PT&rsquo;s IBAN and creditor address per SPS 2022. Expense receipts in bucket <em>accounting</em>, exercise videos in bucket <em>pt_videos</em>. Access via Row-Level Security only.</p>

    <h2>6. Email delivery (Resend)</h2>
    <p>Invoices and dunning reminders dispatched via <strong>Resend Inc.</strong> Recipient email, subject, body and PDF transmitted.</p>
    <p>Resend privacy: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal/privacy-policy</a></p>

    <h2>7. Google Calendar Integration (optional)</h2>
    <div class="info">
      <p>When enabled under <strong>Settings &rarr; Integrations</strong>, we store access token, refresh token and Google email address.</p>
    </div>
    <p>Appointments stored in both Google Calendar <em>and</em> PTOne database (including Google event ID). Disconnect anytime &mdash; all tokens deleted immediately.</p>
    <p>Google privacy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>8. Contact form (Formspree)</h2>
    <p>Name, email and message transmitted to <strong>Formspree Inc.</strong> No permanent storage on our servers.</p>
    <p>Formspree: <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal/privacy-policy</a></p>

    <h2>9. Login options</h2>
    <p><strong>Email / password:</strong> Stored exclusively as bcrypt hash.<br>
    <strong>Google Sign-In (optional):</strong> Only email and name received. Independent of Calendar integration.</p>

    <h2>10. Infrastructure</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Service</th><th>Purpose</th><th>Location</th><th>Privacy</th></tr>
        <tr><td>Supabase</td><td>Database, auth, 3 storage buckets (ptone_drive, accounting, pt_videos)</td><td>EU &ndash; Frankfurt</td><td><a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></td></tr>
        <tr><td>Cloudflare</td><td>Hosting all 3 apps (Workers), CDN, DDoS</td><td>EU (primary)</td><td><a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></td></tr>
        <tr><td>Google LLC</td><td>Login, Calendar integration</td><td>USA / worldwide</td><td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></td></tr>
        <tr><td>Resend Inc.</td><td>Email delivery</td><td>USA</td><td><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">resend.com/legal</a></td></tr>
        <tr><td>Formspree Inc.</td><td>Contact form</td><td>USA</td><td><a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal</a></td></tr>
      </table>
    </div>
    <p>All providers bound as data processors under Art. 28 GDPR. US transfers based on EU Standard Contractual Clauses.</p>

    <h2>11. Retention</h2>
    <ul>
      <li><strong>Account data:</strong> until account deletion</li>
      <li><strong>Invoices / accounting records:</strong> 10 years (Swiss statutory requirement)</li>
      <li><strong>Server logs:</strong> max. 90 days (Cloudflare)</li>
      <li><strong>Inactive accounts:</strong> after 24 months</li>
    </ul>

    <h2>12. Cookies and localStorage</h2>
    <ul>
      <li><strong>Session cookies:</strong> authentication (technically necessary)</li>
      <li><strong>localStorage:</strong> language preference, theme, dashboard layout &mdash; local only</li>
      <li>No tracking, no analytics tools, no marketing cookies</li>
    </ul>

    <h2>13. Your rights</h2>
    <p>Contact: <a href="mailto:info@yannicksalm.ch">info@yannicksalm.ch</a> &mdash; we respond within 30 days.</p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 GDPR</div><div class="right-name">Access</div><div class="right-desc">View your stored data</div></div>
      <div class="right"><div class="right-art">Art. 16 GDPR</div><div class="right-name">Rectification</div><div class="right-desc">Correct inaccurate data</div></div>
      <div class="right"><div class="right-art">Art. 17 GDPR</div><div class="right-name">Erasure</div><div class="right-desc">Right to be forgotten</div></div>
      <div class="right"><div class="right-art">Art. 18 GDPR</div><div class="right-name">Restriction</div><div class="right-desc">Restrict processing</div></div>
      <div class="right"><div class="right-art">Art. 20 GDPR</div><div class="right-name">Portability</div><div class="right-desc">Export in machine-readable format</div></div>
      <div class="right"><div class="right-art">Art. 21 GDPR</div><div class="right-name">Objection</div><div class="right-desc">Object to data processing</div></div>
      <div class="right"><div class="right-art">Art. 7 GDPR</div><div class="right-name">Withdrawal</div><div class="right-desc">Withdraw given consents</div></div>
    </div>
    <p style="margin-top:16px">Complaints to the <strong>FDPIC</strong>: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>
</div>

</main>

<footer>
  <p>\xA9 2026 Yannick Salm &nbsp;\xB7&nbsp; <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a> &nbsp;\xB7&nbsp; Schweiz / Switzerland</p>
</footer>

<script>
function setLang(l){
  document.body.setAttribute('data-lang',l);
  document.documentElement.setAttribute('lang',l);
  document.querySelectorAll('.lang-btn').forEach(function(b){b.classList.toggle('active',b.dataset.lang===l)});
  try{localStorage.setItem('ds_lang',l)}catch(e){}
}
function setTab(id){
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===id)});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.toggle('active',p.id==='tab-'+id)});
  history.replaceState(null,'','#'+id);
}
(function(){
  try{
    var saved=localStorage.getItem('ds_lang')||(navigator.language.startsWith('de')?'de':'en');
    setLang(saved);
  }catch(e){}
  var hash=location.hash.replace('#','');
  if(['portfolio','ys-workout','ptone'].indexOf(hash)!==-1)setTab(hash);
})();
<\/script>
</body>
</html>`;
var index_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname !== "") {
      return new Response("Not found", { status: 404 });
    }
    return new Response(HTML, {
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
