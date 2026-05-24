const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Datenschutz · Yannick Salm</title>
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
      <span class="logo-sub">· Yannick Salm</span>
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

<!-- ═══════════════ PORTFOLIO ═══════════════ -->
<div id="tab-portfolio" class="tab-panel active">

  <div class="de">
    <h1>Portfolio · yannicksalm.ch</h1>
    <p class="subtitle">Letzte Aktualisierung: Mai 2026</p>

    <h2>1. Verantwortlicher</h2>
    <p><strong>Yannick Salm</strong><br>Schweiz<br>E-Mail: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. Was ist die Portfolio-Website?</h2>
    <p>yannicksalm.ch ist eine persönliche Portfolio-Website zur Präsentation von Projekten, Fähigkeiten und beruflichem Werdegang. Es handelt sich um eine reine Präsentationsseite ohne Nutzerkonten oder interaktive Dienste.</p>

    <h2>3. Erhobene Daten</h2>
    <p>Es werden <strong>keine personenbezogenen Daten aktiv erhoben oder dauerhaft gespeichert.</strong> Es gibt keine Nutzerkonten, Newsletter oder Tracking-Dienste.</p>
    <p>Technische Verbindungsdaten (IP-Adresse, Browsertyp, Referrer, Zeitstempel) werden durch <strong>Cloudflare</strong> im Rahmen des Hostings und der DDoS-Absicherung kurzfristig verarbeitet und nicht dauerhaft von uns gespeichert.</p>
    <p>Datenschutzrichtlinie Cloudflare: <a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></p>

    <h2>4. Kontaktaufnahme per E-Mail</h2>
    <p>Bei direkter Kontaktaufnahme per E-Mail werden deine Angaben (Name, E-Mail-Adresse, Nachrichteninhalt) ausschließlich zur Bearbeitung deiner Anfrage verwendet und nach Erledigung gelöscht.</p>
    <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung / vorvertragliche Maßnahmen).</p>

    <h2>5. Cookies</h2>
    <p>Wir setzen keine eigenen Tracking- oder Marketing-Cookies. Cloudflare kann technische Sicherheits-Cookies setzen (z. B. <code>__cf_bm</code>), die keine personenbezogenen Nutzerdaten speichern.</p>

    <h2>6. Deine Rechte</h2>
    <p>Gemäß DSGVO und dem Schweizer Datenschutzgesetz (nDSG) stehen dir folgende Rechte zu. Kontakt: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 DSGVO</div><div class="right-name">Auskunft</div><div class="right-desc">Einblick in gespeicherte Daten</div></div>
      <div class="right"><div class="right-art">Art. 16 DSGVO</div><div class="right-name">Berichtigung</div><div class="right-desc">Korrektur unrichtiger Daten</div></div>
      <div class="right"><div class="right-art">Art. 17 DSGVO</div><div class="right-name">Löschung</div><div class="right-desc">Recht auf Vergessenwerden</div></div>
      <div class="right"><div class="right-art">Art. 21 DSGVO</div><div class="right-name">Widerspruch</div><div class="right-desc">Widerspruch gegen Verarbeitung</div></div>
    </div>
    <p style="margin-top:16px">Beschwerden können beim <strong>Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB)</strong> eingereicht werden: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
  </div>

  <div class="en">
    <h1>Portfolio · yannicksalm.ch</h1>
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

<!-- ═══════════════ YS-WORKOUT ═══════════════ -->
<div id="tab-ys-workout" class="tab-panel">

  <div class="de">
    <h1>ys-workout</h1>
    <p class="subtitle">Letzte Aktualisierung: Mai 2026</p>

    <h2>1. Verantwortlicher</h2>
    <p><strong>Yannick Salm</strong><br>Schweiz<br>E-Mail: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. Was ist ys-workout?</h2>
    <p>ys-workout ist eine Trainings-Tracking-App zur digitalen Erfassung von Workouts, Übungen, Körpermaßen und persönlichen Rekorden. Die App richtet sich an Personen, die ihr Training eigenständig dokumentieren und auswerten möchten.</p>

    <h2>3. Erhobene Daten</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Kategorie</th><th>Daten</th><th>Pflichtfeld</th></tr>
        <tr><td>Konto</td><td>E-Mail-Adresse, Vor- und Nachname</td><td>Ja</td></tr>
        <tr><td>Profil</td><td>Profilfoto, Anzeigeename</td><td>Nein</td></tr>
        <tr><td>Training</td><td>Workouts, Übungen, Sets, Gewichte, Wiederholungen, Notizen, Datum</td><td>Nein</td></tr>
        <tr><td>Körper</td><td>Gewicht, Körpermaße, Datum der Messung</td><td>Nein</td></tr>
        <tr><td>Technisch</td><td>IP-Adresse (via Cloudflare), Geräteinformationen, Zeitstempel</td><td>Automatisch</td></tr>
      </table>
    </div>

    <h2>4. Zweck und Rechtsgrundlagen</h2>
    <p><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Konto-Daten werden zur Bereitstellung der App-Funktionen benötigt.</p>
    <p><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Optionale Daten (Körpermaße, Profilfoto) werden nur auf deine aktive Eingabe hin gespeichert.</p>
    <p><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Technische Betriebsdaten zur Sicherstellung der App-Funktionalität.</p>

    <h2>5. Google-Login (optional)</h2>
    <p>Falls du dich mit Google anmeldest, erhält ys-workout von Google ausschließlich <strong>E-Mail-Adresse und Namen</strong>. Kein Zugriff auf andere Google-Dienste oder -Daten.</p>
    <p>Datenschutzrichtlinie Google: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>6. Datenübertragung und Infrastruktur</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Dienst</th><th>Zweck</th><th>Serverstandort</th></tr>
        <tr><td>Supabase</td><td>Datenbank, Authentifizierung</td><td>EU – Frankfurt, Deutschland</td></tr>
        <tr><td>Cloudflare</td><td>Hosting, CDN, DDoS-Schutz</td><td>EU (primär)</td></tr>
        <tr><td>Google OAuth</td><td>Optionaler Login</td><td>USA / weltweit</td></tr>
      </table>
    </div>
    <p>Supabase-Datenschutz: <a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></p>

    <h2>7. Datenweitergabe</h2>
    <p>Deine Daten werden <strong>nicht verkauft</strong> und nicht an Dritte für Marketingzwecke weitergegeben. Eine Weitergabe erfolgt ausschließlich an die oben genannten Infrastrukturdienstleister, die als Auftragsverarbeiter gemäß Art. 28 DSGVO tätig sind.</p>

    <h2>8. Aufbewahrung und Löschung</h2>
    <p>Deine Daten werden gespeichert, bis du dein Konto löschst. Du kannst dein Konto und alle damit verbundenen Daten jederzeit in den App-Einstellungen vollständig löschen. Nach Löschung werden alle personenbezogenen Daten innerhalb von 30 Tagen unwiderruflich entfernt.</p>

    <h2>9. Deine Rechte</h2>
    <p>Kontakt zur Rechteausübung: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
    <div class="rights">
      <div class="right"><div class="right-art">Art. 15 DSGVO</div><div class="right-name">Auskunft</div><div class="right-desc">Einblick in gespeicherte Daten</div></div>
      <div class="right"><div class="right-art">Art. 16 DSGVO</div><div class="right-name">Berichtigung</div><div class="right-desc">Korrektur unrichtiger Daten</div></div>
      <div class="right"><div class="right-art">Art. 17 DSGVO</div><div class="right-name">Löschung</div><div class="right-desc">Recht auf Vergessenwerden</div></div>
      <div class="right"><div class="right-art">Art. 18 DSGVO</div><div class="right-name">Einschränkung</div><div class="right-desc">Einschränkung der Verarbeitung</div></div>
      <div class="right"><div class="right-art">Art. 20 DSGVO</div><div class="right-name">Portabilität</div><div class="right-desc">Export in maschinenlesbarem Format</div></div>
      <div class="right"><div class="right-art">Art. 21 DSGVO</div><div class="right-name">Widerspruch</div><div class="right-desc">Widerspruch gegen Verarbeitung</div></div>
    </div>
    <p style="margin-top:16px">Beschwerden beim <strong>EDÖB</strong>: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener">edoeb.admin.ch</a></p>
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
        <tr><td>Supabase</td><td>Database, authentication</td><td>EU – Frankfurt, Germany</td></tr>
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

<!-- ═══════════════ PTONE ═══════════════ -->
<div id="tab-ptone" class="tab-panel">

  <div class="de">
    <h1>PTOne</h1>
    <p class="subtitle">Letzte Aktualisierung: Mai 2026</p>

    <h2>1. Verantwortlicher</h2>
    <p><strong>Yannick Salm</strong><br>Schweiz<br>E-Mail: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. Was ist PTOne?</h2>
    <p>PTOne (ptone.yannicksalm.ch) ist eine SaaS-Plattform für Personal Trainer. Sie umfasst Clientverwaltung, Trainingsplanung, Wochenjournal, Abrechnung, Kommunikation und Kalenderintegration. Die Plattform hat zwei Nutzerrollen: <strong>Personal Trainer (PT)</strong> und <strong>Client</strong>.</p>

    <h2>3. Daten von Personal Trainern</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Kategorie</th><th>Daten</th><th>Pflichtfeld</th></tr>
        <tr><td>Konto</td><td>E-Mail-Adresse, Vor- und Nachname, Passwort (gehasht)</td><td>Ja</td></tr>
        <tr><td>Profil</td><td>Profilfoto, Spezialisierungen, Kurzbiografie, Standort, Sprachen, Erfahrungsjahre</td><td>Nein</td></tr>
        <tr><td>Clients</td><td>Verwaltete Client-Profile: Name, E-Mail, Status, Vertragsbeginn</td><td>Nein</td></tr>
        <tr><td>Pläne</td><td>Trainingspläne, Übungssets, Notizen</td><td>Nein</td></tr>
        <tr><td>Journal</td><td>Journalvorlagen (Fragen, Abschnitte)</td><td>Nein</td></tr>
        <tr><td>Rechnungen</td><td>Empfänger, Beträge, Positionen, Fälligkeitsdaten, Zahlungsstatus</td><td>Nein</td></tr>
        <tr><td>Kalender</td><td>Google OAuth-Token (bei aktivierter Kalender-Integration)</td><td>Nein</td></tr>
      </table>
    </div>

    <h2>4. Daten von Clients</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Kategorie</th><th>Daten</th><th>Pflichtfeld</th></tr>
        <tr><td>Konto</td><td>E-Mail-Adresse, Vor- und Nachname, Passwort (gehasht)</td><td>Ja</td></tr>
        <tr><td>Profil</td><td>Profilfoto, Anzeigename</td><td>Nein</td></tr>
        <tr><td>Journal</td><td>Wöchentliches Check-in: Gewicht, Taillenumfang, Befinden (1–10), Notizen</td><td>Nein</td></tr>
        <tr><td>Training</td><td>Logbücher: Übungen, Sets, Gewichte, Wiederholungen, Datum</td><td>Nein</td></tr>
      </table>
    </div>

    <div class="warn">
      <p><strong>Gesundheitsdaten (Art. 9 DSGVO):</strong> Körperliche Maße, Gewicht und Gesundheitsbefinden sind besondere Kategorien personenbezogener Daten. Die Verarbeitung erfolgt auf Basis deiner <strong>ausdrücklichen Einwilligung</strong> (Art. 9 Abs. 2 lit. a DSGVO), die du durch die aktive Nutzung der Journal-Funktion gibst. Diese Einwilligung kann jederzeit durch Nichtnutzung der Funktion oder Löschung des Kontos widerrufen werden.</p>
    </div>

    <h2>5. Google Calendar Integration (optional)</h2>
    <div class="info">
      <p>Wenn du in den Einstellungen unter <strong>Integrationen &rarr; Google Calendar</strong> die Verbindung aktivierst, speichern wir:</p>
    </div>
    <ul>
      <li><strong>Access Token</strong> – ermöglicht temporären Zugriff auf deinen Google Kalender</li>
      <li><strong>Refresh Token</strong> – erneuert den Zugriff automatisch</li>
      <li><strong>Google-E-Mail-Adresse</strong> – zur Anzeige des verbundenen Kontos</li>
    </ul>
    <p>Diese Daten werden verschlüsselt in unserer Datenbank gespeichert und ausschließlich zur Terminsynchronisation verwendet. Du kannst die Verbindung jederzeit in den Einstellungen trennen – dabei werden alle gespeicherten Tokens sofort und unwiderruflich gelöscht.</p>
    <p>Google-Datenschutz: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>6. Login-Optionen</h2>
    <p><strong>E-Mail / Passwort:</strong> Passwörter werden niemals im Klartext gespeichert (bcrypt-Hashing via Supabase Auth).</p>
    <p><strong>Google Sign-In (optional):</strong> Bei Anmeldung mit Google erhält PTOne ausschließlich E-Mail und Namen. Dies ist unabhängig von der optionalen Google Calendar-Integration.</p>

    <h2>7. Infrastruktur und Datenübertragung</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Dienst</th><th>Zweck</th><th>Serverstandort</th><th>Datenschutz</th></tr>
        <tr><td>Supabase</td><td>Datenbank, Authentifizierung, Dateispeicher</td><td>EU – Frankfurt, DE</td><td><a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></td></tr>
        <tr><td>Cloudflare</td><td>Hosting, CDN, DDoS-Schutz</td><td>EU (primär)</td><td><a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></td></tr>
        <tr><td>Google LLC</td><td>Optionaler Login, Kalender-Integration</td><td>USA / weltweit</td><td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></td></tr>
      </table>
    </div>
    <p>Alle Anbieter sind als Auftragsverarbeiter gemäß Art. 28 DSGVO vertraglich gebunden. Die EU-Serverstandorte gewährleisten die Einhaltung der DSGVO.</p>

    <h2>8. Datenweitergabe</h2>
    <p>Deine Daten werden <strong>niemals verkauft</strong> oder für Marketingzwecke an Dritte weitergegeben. Personal Trainer sind für die datenschutzkonforme Verarbeitung der von ihnen verwalteten Client-Daten mitverantwortlich.</p>

    <h2>9. Aufbewahrung und Löschung</h2>
    <p>Daten werden gespeichert, bis das Konto auf Anfrage gelöscht wird. Personal Trainer sind verpflichtet, Client-Daten zu löschen, wenn das Vertragsverhältnis endet. Nach Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen entfernt.</p>

    <h2>10. Deine Rechte</h2>
    <p>Kontakt: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
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
    <p class="subtitle">Last updated: May 2026</p>

    <h2>1. Data Controller</h2>
    <p><strong>Yannick Salm</strong><br>Switzerland<br>Email: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>

    <h2>2. What is PTOne?</h2>
    <p>PTOne (ptone.yannicksalm.ch) is a SaaS platform for personal trainers covering client management, training plans, weekly journals, billing, communication, and calendar integration. The platform has two user roles: <strong>Personal Trainer (PT)</strong> and <strong>Client</strong>.</p>

    <h2>3. Data collected from Personal Trainers</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Category</th><th>Data</th><th>Required</th></tr>
        <tr><td>Account</td><td>Email address, first and last name, password (hashed)</td><td>Yes</td></tr>
        <tr><td>Profile</td><td>Profile photo, specialisations, bio, location, languages, years of experience</td><td>No</td></tr>
        <tr><td>Clients</td><td>Managed client profiles: name, email, status, contract start date</td><td>No</td></tr>
        <tr><td>Plans</td><td>Training plans, exercise sets, notes</td><td>No</td></tr>
        <tr><td>Journal</td><td>Journal templates (questions, sections)</td><td>No</td></tr>
        <tr><td>Invoices</td><td>Recipient, amounts, line items, due dates, payment status</td><td>No</td></tr>
        <tr><td>Calendar</td><td>Google OAuth token (when Calendar integration is enabled)</td><td>No</td></tr>
      </table>
    </div>

    <h2>4. Data collected from Clients</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Category</th><th>Data</th><th>Required</th></tr>
        <tr><td>Account</td><td>Email address, first and last name, password (hashed)</td><td>Yes</td></tr>
        <tr><td>Profile</td><td>Profile photo, display name</td><td>No</td></tr>
        <tr><td>Journal</td><td>Weekly check-in: weight, waist circumference, well-being score (1–10), notes</td><td>No</td></tr>
        <tr><td>Training</td><td>Logbooks: exercises, sets, weights, reps, date</td><td>No</td></tr>
      </table>
    </div>

    <div class="warn">
      <p><strong>Health data (Art. 9 GDPR):</strong> Physical measurements, weight, and health well-being are special categories of personal data. Processing is based on your <strong>explicit consent</strong> (Art. 9(2)(a) GDPR), given by actively using the journal feature. This consent can be withdrawn at any time by not using the feature or deleting your account.</p>
    </div>

    <h2>5. Google Calendar Integration (optional)</h2>
    <div class="info">
      <p>When you enable the connection in Settings &rarr; <strong>Integrations &rarr; Google Calendar</strong>, we store:</p>
    </div>
    <ul>
      <li><strong>Access token</strong> – enables temporary access to your Google Calendar</li>
      <li><strong>Refresh token</strong> – automatically renews access</li>
      <li><strong>Google email address</strong> – to display the connected account</li>
    </ul>
    <p>These are stored securely in our database and used exclusively for appointment synchronisation. You can disconnect at any time in Settings — this immediately and irrevocably deletes all stored tokens.</p>
    <p>Google privacy policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></p>

    <h2>6. Login options</h2>
    <p><strong>Email / password:</strong> Passwords are never stored in plain text (bcrypt hashing via Supabase Auth).</p>
    <p><strong>Google Sign-In (optional):</strong> When signing in with Google, PTOne receives only your email and name. This is independent of the optional Google Calendar integration.</p>

    <h2>7. Infrastructure and data transfers</h2>
    <div class="table-wrap">
      <table>
        <tr><th>Service</th><th>Purpose</th><th>Server location</th><th>Privacy</th></tr>
        <tr><td>Supabase</td><td>Database, authentication, file storage</td><td>EU – Frankfurt, DE</td><td><a href="https://supabase.com/privacy" target="_blank" rel="noopener">supabase.com/privacy</a></td></tr>
        <tr><td>Cloudflare</td><td>Hosting, CDN, DDoS protection</td><td>EU (primary)</td><td><a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener">cloudflare.com/privacy</a></td></tr>
        <tr><td>Google LLC</td><td>Optional login, Calendar integration</td><td>USA / worldwide</td><td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener">policies.google.com/privacy</a></td></tr>
      </table>
    </div>
    <p>All providers are contractually bound as data processors under Art. 28 GDPR. EU server locations ensure GDPR compliance.</p>

    <h2>8. Data sharing</h2>
    <p>Your data is <strong>never sold</strong> or shared with third parties for marketing purposes. Personal trainers share responsibility for the lawful processing of client data they manage.</p>

    <h2>9. Retention and deletion</h2>
    <p>Data is stored until the account is deleted upon request. Trainers are obligated to delete client data when the contractual relationship ends. After account deletion, all personal data is removed within 30 days.</p>

    <h2>10. Your rights</h2>
    <p>Contact: <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a></p>
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
  <p>© 2026 Yannick Salm &nbsp;·&nbsp; <a href="mailto:yannicksalm07@gmail.com">yannicksalm07@gmail.com</a> &nbsp;·&nbsp; Schweiz / Switzerland</p>
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
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/' && url.pathname !== '') {
      return new Response('Not found', { status: 404 });
    }
    return new Response(HTML, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    });
  },
};
