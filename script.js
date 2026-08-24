/* 広いモニタ対策：画面幅に合わせて全体を拡大する
   1600pxまでは等倍。それ以上は「1560pxのデザインを画面に合わせて広げる」考え方。
   （2026-08-24 社長「PCで見るとサイドがすごく気になる」への対応） */
    (() => {
      const fit = () => {
        const w = window.innerWidth;
        const z = w > 1600 ? Math.min(3, w / 1560) : 1;
        // ★html に掛ける。body に掛けると幅が画面幅のまま拡大され右へ溢れる
        document.documentElement.style.zoom = z === 1 ? "" : String(z);
        document.body.style.zoom = "";
        document.body.style.width = "";
      };
      fit();
      window.addEventListener("resize", fit);
    })();

/* クチコミのスライダー（矢印で1枚ずつ送る。2026-08-24） */
    (() => {
      const track = document.getElementById("voicesTrack");
      const prev = document.getElementById("voicePrev");
      const next = document.getElementById("voiceNext");
      if (!track || !prev || !next) return;
      const step = () => {
        const card = track.querySelector(".voice");
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        return card ? card.offsetWidth + gap : track.clientWidth;
      };
      const update = () => {
        prev.disabled = track.scrollLeft <= 4;
        next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
      };
      const glide = (delta) => {
        const from = track.scrollLeft;
        const to = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, from + delta));
        const t0 = performance.now(), D = 340;
        const run = (t) => {
          const p = Math.min(1, (t - t0) / D);
          track.scrollLeft = from + (to - from) * (1 - Math.pow(1 - p, 3));
          if (p < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
        setTimeout(() => { if (Math.abs(track.scrollLeft - to) > 2) track.scrollLeft = to; update(); }, D + 160);
      };
      prev.addEventListener("click", () => glide(-step()));
      next.addEventListener("click", () => glide(step()));
      track.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      update();
    })();

/* スマホのメニュー開閉 */
    (() => {
      const btn = document.getElementById("navToggle");
      const nav = document.getElementById("globalNav");
      if (!btn || !nav) return;
      btn.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
        btn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
        // 開いている間は後ろのページを動かさない
        document.body.style.overflow = open ? "hidden" : "";
      });
      // 行き先を選んだら閉じる
      nav.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
          btn.setAttribute("aria-label", "メニューを開く");
          document.body.style.overflow = "";
        });
      });
    })();

    /* 品目カード
       PC＝常時ゆっくり流れるスライド（2026-08-24 社長「前の方がいい。ゆっくり流れる感じ」）。
         カードの大きさは5枚表示のまま。途切れず流すため同じ並びをもう1組つくる。
         マウスが乗っている間は止まる。
       スマホ＝3列グリッド（複製は表示しない）。 */
    (() => {
      const track = document.getElementById("carouselTrack");
      if (!track) return;
      const originals = [...track.children];
      originals.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.removeAttribute("id");
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("tabindex", "-1");
        track.appendChild(clone);
      });
      [...track.children].forEach((el) => el.classList.add("is-card"));

      // 1組ぶんの幅だけ流して先頭に戻す＝「その他」の次にすぐ「印鑑」が来る
      // ★幅は offsetWidth で測る。getBoundingClientRect は画面拡大（zoom）の影響を
      //   受けて距離が過大になり、一周の終わりに空白が見えてしまう
      const SPEED = 45; // px/秒
      const setDuration = () => {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const one = originals.reduce((w, el) => w + el.offsetWidth + gap, 0);
        track.style.setProperty("--flow-distance", one + "px");
        track.style.setProperty("--flow-duration", Math.max(20, one / SPEED) + "s");
      };
      setDuration();
      window.addEventListener("resize", setDuration);

      // 画像が置かれていれば敷く（未設置ならキャプションのまま）
      track.querySelectorAll(".ci-photo[data-photo]").forEach((face) => {
        const src = face.dataset.photo;
        const probe = new Image();
        probe.addEventListener("load", () => {
          face.style.backgroundImage = 'url("' + src + '")';
          const cap = face.querySelector("span");
          if (cap) cap.remove();
        });
        probe.src = src;
      });
    })();

    (() => {
      const items = document.querySelectorAll('.reveal');
      if (!('IntersectionObserver' in window)) {
        items.forEach(item => item.classList.add('visible'));
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      items.forEach(item => observer.observe(item));
    })();

/* 制作事例：img/works-<品目>-1..6.jpg が置かれていれば敷く */
(() => {
  const grid = document.querySelector("[data-works]");
  if (!grid) return;
  const key = grid.dataset.works;
  [...grid.children].forEach((cell, i) => {
    const src = "img/works-" + key + "-" + (i + 1) + ".jpg";
    const probe = new Image();
    probe.addEventListener("load", () => {
      cell.style.backgroundImage = 'url("' + src + '")';
      const cap = cell.querySelector("span");
      if (cap) cap.remove();
    });
    probe.src = src;
  });
})();

/* 店舗・店主などの写真：data-photo が置かれていれば敷く */
(() => {
  document.querySelectorAll(".photo-placeholder[data-photo]").forEach((face) => {
    const src = face.dataset.photo;
    const probe = new Image();
    probe.addEventListener("load", () => {
      face.style.backgroundImage = 'url("' + src + '")';
      face.style.backgroundSize = "cover";
      face.style.backgroundPosition = "center";
      const cap = face.querySelector("span");
      if (cap) cap.remove();
    });
    probe.src = src;
  });
})();
