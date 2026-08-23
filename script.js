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

    /* 品目カード：自動でゆっくり流れる（帯ストックは廃止） */
    (() => {
      const track = document.getElementById("carouselTrack");
      if (!track) return;
      const originals = [...track.children];
      // 途切れずに流すため、同じ並びをもう1組つくる
      originals.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.removeAttribute("id");
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });
      [...track.children].forEach((el) => el.classList.add("is-card"));

      // 1組ぶんの幅だけ流して先頭に戻す＝無限に見える
      const setDuration = () => {
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const one = originals.reduce((w, el) => w + el.getBoundingClientRect().width + gap, 0);
        track.style.setProperty("--flow-distance", one + "px");
        track.style.setProperty("--flow-duration", Math.max(24, one / 40) + "s");
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
          setDuration();
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
