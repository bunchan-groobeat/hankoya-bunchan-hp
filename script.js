/* 広いモニタ対策：画面幅に合わせて全体を拡大する
   1600pxまでは等倍。それ以上は「1560pxのデザインを画面に合わせて広げる」考え方。
   （2026-08-24 社長「PCで見るとサイドがすごく気になる」への対応） */
    (() => {
      const fit = () => {
        const w = window.innerWidth;
        document.body.style.zoom = w > 1600 ? String(Math.min(3, w / 1560)) : "";
      };
      fit();
      window.addEventListener("resize", fit);
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
      });
      // 行き先を選んだら閉じる
      nav.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          btn.setAttribute("aria-expanded", "false");
          btn.setAttribute("aria-label", "メニューを開く");
        });
      });
    })();

    /* 品目カード：3列で並べる
       ★2026-08-23、自動で流す形（カルーセル）は廃止。
         流れてくるのを待たないと何があるか分からず、1枚も小さかったため。
         複製カードの生成と流れる速度の計算も不要になった。 */
    (() => {
      const track = document.getElementById("carouselTrack");
      if (!track) return;
      [...track.children].forEach((el) => el.classList.add("is-card"));

      // PCの手動スライド（矢印で1画面ぶん送る）
      // ★behavior:"smooth" はズーム環境で無反応になるため、自前のアニメで送る
      const prev = document.getElementById("carPrev");
      const next = document.getElementById("carNext");
      if (prev && next) {
        const page = () => track.clientWidth;
        const update = () => {
          prev.disabled = track.scrollLeft <= 4;
          next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
        };
        const glide = (delta) => {
          const from = track.scrollLeft;
          const to = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, from + delta));
          const t0 = performance.now();
          const D = 380;
          const step = (t) => {
            const p = Math.min(1, (t - t0) / D);
            const e = 1 - Math.pow(1 - p, 3); // ease-out
            track.scrollLeft = from + (to - from) * e;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          // 保険：タブが裏に居てアニメーションが止まっても、行き先には必ず着ける
          setTimeout(() => {
            if (Math.abs(track.scrollLeft - to) > 2) track.scrollLeft = to;
            update();
          }, D + 160);
        };
        prev.addEventListener("click", () => { glide(-page()); restart(); });
        next.addEventListener("click", () => { glide(page()); restart(); });
        // 端に着いたら矢印を薄くする
        track.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        update();

        // 自動スライド（2026-08-24 社長指示）：5秒ごとに1画面送る。
        // 端まで行ったら先頭に戻る。触っている間・見えていない間は止まる。
        let timer = null;
        const tick = () => {
          if (track.scrollWidth <= track.clientWidth + 4) return; // スマホ等、送る余地なし
          const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
          if (atEnd) glide(-track.scrollLeft); else glide(page());
        };
        const start = () => { if (!timer) timer = setInterval(tick, 5000); };
        const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
        const restart = () => { stop(); start(); };
        track.addEventListener("mouseenter", stop);
        track.addEventListener("mouseleave", start);
        track.addEventListener("touchstart", stop, { passive: true });
        track.addEventListener("touchend", () => setTimeout(start, 4000), { passive: true });
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) stop(); else start();
        });
        start();
      }

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
