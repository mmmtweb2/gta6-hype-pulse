(function () {
  const fallbackNode = document.getElementById("page-data");
  const root = document.getElementById("app");

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rich(value) {
    const str = String(value == null ? "" : value);
    const re = /[A-Za-z0-9](?:['’]?[A-Za-z0-9]+|[+|._:#\/\-]+[A-Za-z0-9]+| +[A-Za-z0-9]+)*/g;
    let out = "";
    let last = 0;
    let m;
    while ((m = re.exec(str))) {
      let start = m.index;
      let end = m.index + m[0].length;
      let chunk = m[0];
      if (start > 0 && str[start - 1] === "(" && end < str.length && str[end] === ")") {
        start -= 1;
        end += 1;
        chunk = str.slice(start, end);
      }
      out += esc(str.slice(last, start));
      out += `<bdi dir="ltr">${esc(chunk)}</bdi>`;
      last = end;
    }
    out += esc(str.slice(last));
    return out;
  }

  function sourceName(name) {
    return `<bdi>${rich(name || "מקור")}</bdi>`;
  }

  function sourceLink(source) {
    if (!source || !source.url) return "";
    return `<p class="source-line">מקור: <a href="${esc(source.url)}" rel="noopener noreferrer" target="_blank">${sourceName(source.name)}</a></p>`;
  }

  function sourcesList(sources) {
    if (!sources || !sources.length) return "";
    return `<ul class="source-list">${sources
      .map((s) => `<li><a href="${esc(s.url)}" rel="noopener noreferrer" target="_blank">${sourceName(s.name)}</a></li>`)
      .join("")}</ul>`;
  }

  function formatNumber(n) {
    return Number(n).toLocaleString("he-IL");
  }

  function collectSources(data) {
    const map = new Map();
    function walk(node) {
      if (!node) return;
      if (Array.isArray(node)) return node.forEach(walk);
      if (typeof node !== "object") return;
      if (node.name && node.url) map.set(node.url, node.name);
      Object.values(node).forEach(walk);
    }
    walk(data);
    return Array.from(map, ([url, name]) => ({ url, name }));
  }

  function render(data) {
    const release = data.release;
    const status = data.status;
    const follow = data.follow;
    const telegramAttrs = follow.telegram.placeholder
      ? `class="btn primary disabled" aria-disabled="true" role="link" data-track="cta"`
      : `class="btn primary" href="${esc(follow.telegram.url)}" target="_blank" rel="noopener noreferrer" data-track="cta"`;
    const xAttrs = follow.x.placeholder
      ? `class="btn ghost disabled" aria-disabled="true" role="link" data-track="cta"`
      : `class="btn ghost" href="${esc(follow.x.url)}" target="_blank" rel="noopener noreferrer" data-track="cta"`;

    root.innerHTML = `
      <header class="site">
        <div class="wrap nav">
          <a class="brand" href="#top" dir="ltr">GTA 6 <span>Hype Pulse</span></a>
          <nav class="nav-links" aria-label="ניווט בעמוד">
            <a href="#status">סטטוס</a>
            <a href="#now">עכשיו</a>
            <a href="#israel">בישראל</a>
            <a href="#prices">מחירים</a>
            <a href="#memes">ממים</a>
            <a href="#streams">סטרימים</a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section class="hero">
          <div class="wrap">
            <div class="kicker"><bdi dir="ltr">${esc(release.platforms)}</bdi></div>
            <h1>GTA 6 <em>Hype Pulse</em></h1>
            <p class="tagline">${rich(data.meta.tagline)}</p>
            <div class="countdown" id="countdown" aria-live="polite">
              <div class="unit"><b id="cd-d">--</b><span>ימים</span></div>
              <div class="unit"><b id="cd-h">--</b><span>שעות</span></div>
              <div class="unit"><b id="cd-m">--</b><span>דקות</span></div>
              <div class="unit"><b id="cd-s">--</b><span>שניות</span></div>
            </div>
            <p class="release-meta">
              השקה רשמית: <strong>${rich(release.dateLabel)}</strong>, ${rich(release.timeLabel)}.<br>
              ${rich(release.note)}
            </p>
            ${sourcesList(release.sources)}
          </div>
        </section>

        <p class="updated wrap">עדכון אחרון: <time datetime="${esc(data.meta.lastUpdated)}">${rich(data.meta.lastUpdatedLabel)}</time></p>

        <section id="status">
          <div class="wrap">
            <h2><span class="neon">סטטוס</span> חי</h2>
            <div class="status-grid">
              <article class="card">
                <h3>${rich(status.servers.label)}</h3>
                <div class="big-stat">${rich(status.servers.value)}</div>
                <p>${rich(status.servers.detail)}</p>
                ${sourcesList(status.servers.sources)}
              </article>
              <article class="card">
                <h3>${rich(status.viewers.label)}</h3>
                <p class="muted">${rich(status.viewers.detail)} נכון ל-${rich(status.viewers.capturedAtLabel)}.</p>
                ${status.viewers.items
                  .map(
                    (item) => `
                  <div class="viewer-row">
                    <span>${rich(item.platform)}${item.extra ? ` · ${rich(item.extra)}` : ""}</span>
                    <b>${formatNumber(item.viewers)}</b>
                  </div>
                  ${item.peakToday != null ? `<p class="muted">${rich(item.peakTodayLabel)}: ${formatNumber(item.peakToday)}</p>` : ""}`
                  )
                  .join("")}
                ${sourcesList(status.viewers.sources)}
              </article>
              <article class="card wide">
                <h3>${rich(status.trends.label)}</h3>
                <p><strong>X:</strong> ${rich(status.trends.x.summary)}</p>
                <p><strong>TikTok:</strong> ${rich(status.trends.tiktok.summary)}</p>
                ${sourcesList(status.trends.tiktok.sources)}
                <p><strong>Reddit:</strong> ${rich(status.trends.reddit.summary)}</p>
                ${sourcesList(status.trends.reddit.sources)}
              </article>
              <article class="card wide">
                <h3>תגובות בולטות</h3>
                <div class="react-grid">
                  ${status.reactions
                    .map(
                      (r) => `
                    <div>
                      <strong>${rich(r.who)}</strong>
                      <p>${rich(r.text)}</p>
                      ${sourceLink(r.source)}
                    </div>`
                    )
                    .join("")}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="now">
          <div class="wrap">
            <h2>מה קורה <span class="neon">עכשיו</span></h2>
            <ul class="bullets">
              ${data.now
                .map((item) => `<li><p>${rich(item.text)}</p>${sourceLink(item.source)}</li>`)
                .join("")}
            </ul>
          </div>
        </section>

        <section id="israel">
          <div class="wrap">
            <h2><span class="neon">בישראל</span></h2>
            <p class="lede">${rich(data.israel.intro)}</p>
            <ul class="bullets">
              ${data.israel.bullets
                .map((item) => `<li><p>${rich(item.text)}</p>${sourceLink(item.source)}</li>`)
                .join("")}
            </ul>
          </div>
        </section>

        <section id="prices">
          <div class="wrap">
            <h2>כמה זה עולה <span class="neon">בישראל</span></h2>
            <p class="lede">${rich(data.prices.intro)}</p>
            <div class="price-cards">
              ${data.prices.rows
                .map(
                  (row) => `
                <article class="card price-card">
                  <div class="top">
                    <a class="store" href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${rich(row.store)}</a>
                    <div class="price${row.verified ? "" : " soon"}">${rich(row.price)} ${
                      row.verified
                        ? '<span class="badge ok">אומת</span>'
                        : '<span class="badge wait">לא אומת</span>'
                    }</div>
                  </div>
                  <p>${rich(row.edition)}</p>
                  <p class="muted">${rich(row.note)}</p>
                </article>`
                )
                .join("")}
            </div>
            <div class="table-wrap price-table">
              <table>
                <thead>
                  <tr>
                    <th>חנות</th>
                    <th>מהדורה</th>
                    <th>מחיר</th>
                    <th>הערה</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.prices.rows
                    .map(
                      (row) => `
                    <tr>
                      <td><a href="${esc(row.url)}" target="_blank" rel="noopener noreferrer">${rich(row.store)}</a></td>
                      <td>${rich(row.edition)}</td>
                      <td class="price${row.verified ? "" : " soon"}">${rich(row.price)} ${
                        row.verified
                          ? '<span class="badge ok">אומת</span>'
                          : '<span class="badge wait">לא אומת</span>'
                      }</td>
                      <td class="muted">${rich(row.note)}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            ${sourcesList(data.prices.sources)}
          </div>
        </section>

        <section id="memes">
          <div class="wrap">
            <h2>ממים <span class="neon">של היום</span></h2>
            <p class="lede">לא המצאנו ממים חדשים להיום בלבד. אלה הפורמטים שרצים בימים האחרונים, לפי סקירות שפורסמו השבוע.</p>
            <div class="meme-grid">
              ${data.memes
                .map(
                  (m) => `
                <article class="card meme">
                  <h3>${rich(m.title)}</h3>
                  <p>${rich(m.text)}</p>
                  ${sourceLink(m.source)}
                </article>`
                )
                .join("")}
            </div>
          </div>
        </section>

        <section id="streams">
          <div class="wrap">
            <h2>סטרימים <span class="neon">מומלצים</span></h2>
            <div class="stream-list">
              ${data.streams
                .map(
                  (s) => `
                <article class="card stream">
                  <a class="title" data-track="stream" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${rich(s.name)}</a>
                  <p>${rich(s.detail)}</p>
                </article>`
                )
                .join("")}
            </div>
          </div>
        </section>

        <section id="follow">
          <div class="wrap" style="text-align:center">
            <h2>הישארו מעודכנים</h2>
            <p class="lede">${rich(follow.telegram.note)} ${rich(follow.x.note)}</p>
            <div class="cta-row">
              <a ${telegramAttrs}>${esc(follow.telegram.label)} · בקרוב</a>
              <a ${xAttrs}>${esc(follow.x.label)} · בקרוב</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div class="wrap">
          <p>${rich(data.meta.disclaimer)}</p>
          <p>כל הנתונים בעמוד נשמרו בקובץ <code dir="ltr">data.json</code> כדי שאפשר יהיה לעדכן אותם במהירות, בלי להמציא מספרים או ציטוטים.</p>
          <div class="sources">
            <details open>
              <summary>כל המקורות בעמוד</summary>
              <ul>
                ${collectSources(data)
                  .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${rich(s.name)}</a></li>`)
                  .join("")}
              </ul>
            </details>
          </div>
        </div>
      </footer>
    `;

    startCountdown(release.iso);
  }

  function startCountdown(iso) {
    const target = new Date(iso);
    const dEl = document.getElementById("cd-d");
    const hEl = document.getElementById("cd-h");
    const mEl = document.getElementById("cd-m");
    const sEl = document.getElementById("cd-s");
    const box = document.getElementById("countdown");

    function pad(n) {
      return String(n).padStart(2, "0");
    }

    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        dEl.textContent = "00";
        hEl.textContent = "00";
        mEl.textContent = "00";
        sEl.textContent = "00";
        box.setAttribute("data-state", "launched");
        return;
      }
      const sec = Math.floor(diff / 1000);
      const days = Math.floor(sec / 86400);
      const hours = Math.floor((sec % 86400) / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = sec % 60;
      dEl.textContent = pad(days);
      hEl.textContent = pad(hours);
      mEl.textContent = pad(mins);
      sEl.textContent = pad(secs);
    }

    tick();
    setInterval(tick, 1000);
  }

  function boot(data) {
    render(data);
  }

  fetch("data.json", { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("data.json missing");
      return res.json();
    })
    .then(boot)
    .catch(() => {
      try {
        boot(JSON.parse(fallbackNode.textContent));
      } catch (err) {
        root.innerHTML = "<p class=\"wrap\">לא הצלחנו לטעון את נתוני העמוד.</p>";
      }
    });
})();
