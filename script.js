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

/* お問い合わせフォーム（2026-08-24）
   action が Formspree のURLになっていれば、ページを移動せずに送信して
   「送信しました」を出す。mailto のままなら、これまで通りメールソフトが開く。 */
    (() => {
      const form = document.getElementById("contactForm");
      if (!form) return;
      const action = form.getAttribute("action") || "";
      if (!/formspree\.io/.test(action)) return;   // 未設定のうちは何もしない

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = form.querySelector(".cf-submit");
        const before = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = "送信中…"; }
        try {
          const res = await fetch(action, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" },
          });
          if (!res.ok) throw new Error("送信に失敗しました");
          const done = document.createElement("p");
          done.className = "cf-done";
          // 画面が変わったことを読み上げソフトにも伝える（2026-08-26 監査#10）
          done.setAttribute("role", "status");
          done.setAttribute("aria-live", "polite");
          done.tabIndex = -1;
          done.textContent = "送信しました。ありがとうございます。折り返しご連絡します。";
          form.replaceWith(done);
          done.focus();
        } catch (err) {
          if (btn) { btn.disabled = false; btn.textContent = before; }
          alert("うまく送信できませんでした。お手数ですが、お電話（024-925-6861）かLINEでご連絡ください。");
        }
      });
    })();

/* クチコミ：自動でゆっくり流れる（2026-08-25 社長指示）
   途切れないよう同じ並びをもう1組つくり、1組ぶんの幅だけ流して先頭に戻す。 */
    (() => {
      const track = document.getElementById("voicesTrack");
      if (!track) return;
      const originals = [...track.children];
      if (!originals.length) return;

      originals.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });

      const SPEED = 40; // px/秒（品目カードよりゆっくり）
      const setDuration = () => {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const one = originals.reduce((w, el) => w + el.offsetWidth + gap, 0);
        track.style.setProperty("--voice-distance", one + "px");
        track.style.setProperty("--voice-duration", Math.max(30, one / SPEED) + "s");
      };
      setDuration();
      window.addEventListener("resize", setDuration);
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

    /* ★2026-09-04 社長指示：セクション見出し（h2.section-title）を1文字ずつ打ち込む演出。
       水野谷HP（site.js:initTypewriter・2026-08-10）の移植。設計はそのまま＝
       ・HTMLの文字は消さない。1文字ずつ <span class="tw-char"> で包み、CSSで透明にしてから順に見せる
         → JSが動かない環境・検索・読み上げには最初から全文がある
       ・<br> はそのまま残す（改行位置を壊さない）
       ・隠すのは「演出できる」と確定して h2 に .is-typing を付けたときだけ（CSS側も .is-typing 起点）
       ・動きを減らす設定の方には演出しない
       ・打ち始めるのは .reveal が visible になった瞬間（スクロールで見えたとき）。1回だけ */
    /* ★2026-09-04 深夜 社長「見出し打たれてるのわからない」→ 3点を直した
       ①70ms→110ms/字（18文字で約2秒）②打ち始めは「見出しが画面の下から30%より上に入ったとき」（セクションの
       浮き上がりと同時だと、フェードに埋もれて打っているのが見えない）③CSS側で見出しのフェードを外し、文字だけ動かす */
    const TW_STEP = 85;        /* 1文字あたり。110→85ms（2026-09-04 社長「もう少しだけ早く」）。18文字で約1.5秒 */
    const TW_START = 120;      /* 見出しが見える位置に来てから打ち始めるまで */
    const twReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const twReady = !twReduce && 'IntersectionObserver' in window;
    /* ★2026-09-04 社長「スライドで表示されたら打ち込みで11年とかも」→ 対象を広げた。
       見出し(h2.section-title)＋大きい数字（.big-year「11年」・.years strong・.review-num）＋品目ページのh1(.pg-title) */
    const TW_TARGETS = '.reveal h2.section-title, .reveal h2.speed-statement, .reveal .big-year, .reveal .years, .reveal .review-num, .pg-hero .pg-title';
    if (twReady) {
      /* 文字を1つずつ span に包む。<br> はそのまま。<strong>・<span> など入れ子の要素は、要素を残して中の文字だけ包む
         （「印鑑・名刺は<strong>その日のうちに</strong>」「<strong>11</strong><span>年分</span>」も全部の文字が打たれる） */
      const wrap = (parent) => {
        Array.prototype.slice.call(parent.childNodes).forEach((node) => {
          if (node.nodeType === 3) {
            const frag = document.createDocumentFragment();
            node.textContent.split('').forEach((ch) => {
              const s = document.createElement('span');
              s.className = 'tw-char';
              s.textContent = ch;
              frag.appendChild(s);
            });
            parent.replaceChild(frag, node);
          } else if (node.nodeType === 1 && node.tagName !== 'BR') {
            wrap(node);
          }
        });
      };
      document.querySelectorAll(TW_TARGETS).forEach((h) => { wrap(h); h.classList.add('is-typing'); });
    }
    const typeOne = (h) => {
      if (h.dataset.typed) return;
      h.dataset.typed = '1';
      h.querySelectorAll('.tw-char').forEach((s, i) => {
        setTimeout(() => s.classList.add('is-on'), TW_START + i * TW_STEP);
      });
    };
    const typeTitle = (section) => section.querySelectorAll('.is-typing').forEach(typeOne);
    /* 見出しそのものを監視して、画面の下30%より上に入ったら打つ（セクションの出現より遅らせる）。
       品目ページのh1は読み込み時点で画面内なので、そのまま即打ち始まる（水野谷のヒーローと同じ） */
    if (twReady) {
      const twIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { typeOne(e.target); twIO.unobserve(e.target); } });
      }, { threshold: 0, rootMargin: '0px 0px -30% 0px' });
      document.querySelectorAll('.is-typing').forEach((h) => twIO.observe(h));
    }

    (() => {
      const items = document.querySelectorAll('.reveal');
      /* IntersectionObserver が無い環境だけ、セクション表示と同時に打つ（twIO が無いので） */
      const show = (item) => { item.classList.add('visible'); if (!twReady) typeTitle(item); };
      if (!('IntersectionObserver' in window)) {
        items.forEach(show);
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        // 画面に少し入った時点で動き始める。下から120px手前で発火させ、
        // スクロールに合わせて自然に見えるようにする（2026-08-25）
        threshold: 0,
        rootMargin: "0px 0px -120px 0px",
      });
      items.forEach(item => observer.observe(item));

      // 保険：監視が働かない環境でも、スクロール位置から自前で判定する
      const showByPosition = () => {
        const line = window.innerHeight - 120;
        items.forEach((item) => {
          if (item.classList.contains("visible")) return;
          if (item.getBoundingClientRect().top < line) show(item);
        });
      };
      window.addEventListener("scroll", showByPosition, { passive: true });
      window.addEventListener("resize", showByPosition);
      showByPosition();
      // 何かの理由で最後まで出ないままなら、4秒後に全部表示して詰まらせない
      setTimeout(() => items.forEach(show), 4000);
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

/* トップの制作事例グリッド：セルごとの data-photo を敷く（2026-08-30） */
(() => {
  document.querySelectorAll(".works-cell[data-photo]").forEach((cell) => {
    const src = cell.dataset.photo;
    const probe = new Image();
    probe.addEventListener("load", () => {
      cell.style.backgroundImage = 'url("' + src + '")';
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

/* アンカーで開かれたときの位置合わせ（2026-09-01）
   ★直している困りごとは2つ。
     ① 飛んだ先が .reveal だと opacity:0 のまま「真っ白」に見える → その場で表示する
     ② 画像が順に入ってページが伸び続けるため、飛んだ位置からどんどんずれる
        （実測: #app はページ内15085pxにあるのに、合わせた直後の画面は115px＝ほぼトップだった）
   ★1回合わせるだけでは足りないので、**高さが変わるたびに合わせ直す**。
     ただしユーザーが自分でスクロールを始めたら即やめる（勝手に飛ぶのは不快なので）。
     4秒で見切る。それ以上引っぱると、読み終わったあとに動いてしまう。 */
(() => {
  if (!location.hash) return;
  let target;
  try { target = document.querySelector(location.hash); } catch (e) { return; }
  if (!target) return;

  // 飛んだ先とその中身は、出てくる演出を待たずにすぐ見せる
  target.classList.add('visible');
  target.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

  let done = false;
  // ★behavior は必ず 'instant'。
  //   html に scroll-behavior:smooth があるため、既定のままだと1回1回がアニメーションになり、
  //   高さが変わるたびに呼び直すと**前のアニメーションを打ち消し合って一歩も進まない**。
  //   実測: 既定では scrollY が114のまま動かず、instant にした瞬間に 12799 まで飛んだ。
  //   （クリックしたときの「ぬるっ」は smooth のまま残るので、気持ちよさは失われない）
  const settle = () => { if (!done) target.scrollIntoView({ behavior: 'instant', block: 'start' }); };
  const stop = () => { done = true; if (ro) ro.disconnect(); };

  addEventListener('wheel', stop, { passive: true, once: true });
  addEventListener('touchstart', stop, { passive: true, once: true });
  addEventListener('keydown', stop, { once: true });

  let ro = null;
  if ('ResizeObserver' in window) { ro = new ResizeObserver(settle); ro.observe(document.body); }
  addEventListener('load', settle);
  setTimeout(settle, 300);
  setTimeout(settle, 1000);
  setTimeout(stop, 4000);
})();
