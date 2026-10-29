/* ==========================================================================
   McLuncher 官网 · 交互脚本
   --------------------------------------------------------------------------
   原生 JavaScript，无依赖、无构建。整站即使禁用脚本，正文与下载链接依旧可用：
   页头页脚是真实 HTML，只有“增强”行为放在这里。
   模块：1 配色  2 页头滚动态与移动端抽屉  3 复制校验值  4 问答筛选
        5 滚动渐显  6 站点向导  7 其他细节
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector("[data-header]");

  /* ==== 1 配色：跟随系统 → 浅色 → 深色 三态循环 ========================= */
  var THEME_KEY = "mc.theme";
  var THEME_ORDER = ["auto", "light", "dark"];
  var THEME_TEXT = { auto: "跟随系统", light: "浅色", dark: "深色" };
  var darkQuery = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function resolveTheme(mode) {
    if (mode === "auto") {
      return darkQuery && darkQuery.matches ? "dark" : "light";
    }
    return mode;
  }

  function paintTheme(mode) {
    root.setAttribute("data-theme-mode", mode);
    root.setAttribute("data-theme", resolveTheme(mode));
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.setAttribute("title", "配色：" + THEME_TEXT[mode] + "（点击切换）");
      btn.setAttribute("aria-label", "配色：" + THEME_TEXT[mode] + "，点击切换");
      var label = btn.querySelector("[data-theme-label]");
      if (label) label.textContent = THEME_TEXT[mode];
    }
  }

  function readTheme() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      return THEME_ORDER.indexOf(v) >= 0 ? v : "auto";
    } catch (e) {
      return "auto";
    }
  }

  function saveTheme(mode) {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch (e) {
      /* 隐私模式下写入失败：本次会话内仍然生效 */
    }
  }

  paintTheme(readTheme());

  // 点击切换：跟随系统 → 浅色 → 深色 → 跟随系统
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-theme-toggle]") : null;
    if (!btn) return;
    var cur = root.getAttribute("data-theme-mode") || "auto";
    var next = THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length];
    saveTheme(next);
    paintTheme(next);
  });

  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener("change", function () {
      if (root.getAttribute("data-theme-mode") === "auto") paintTheme("auto");
    });
  }

  /* ==== 2 页头：滚动投影 + 移动端抽屉 ================================== */
  function syncHeader() {
    if (!header) return;
    header.setAttribute("data-scrolled", window.scrollY > 8 ? "true" : "false");
  }

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  function setNav(open) {
    if (!header) return;
    header.setAttribute("data-open", open ? "true" : "false");
    var btn = header.querySelector("[data-nav-toggle]");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (header) {
    var navToggle = header.querySelector("[data-nav-toggle]");
    if (navToggle) {
      navToggle.addEventListener("click", function () {
        setNav(header.getAttribute("data-open") !== "true");
      });
    }
    header.addEventListener("click", function (ev) {
      var link = ev.target.closest ? ev.target.closest(".nav__link") : null;
      if (link) setNav(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setNav(false);
    });
    setNav(false);
  }

  /* ==== 3 复制校验值 ==================================================== */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  /* ==== 4 问答筛选 ====================================================== */
  function initFaq() {
    var input = document.querySelector("[data-faq-filter]");
    if (!input) return;

    var items = [].slice.call(document.querySelectorAll("[data-faq-item]"));
    var count = document.querySelector("[data-faq-count]");
    var empty = document.querySelector("[data-faq-empty]");
    var total = items.length;

    function run() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;

      items.forEach(function (item) {
        var text = (item.textContent || "").toLowerCase();
        var hit = !q || text.indexOf(q) >= 0;
        if (hit) {
          item.removeAttribute("hidden");
          shown++;
        } else {
          item.setAttribute("hidden", "");
          item.removeAttribute("open");
        }
      });

      if (count) count.textContent = "共 " + total + " 条，匹配 " + shown + " 条";
      if (empty) empty.setAttribute("data-show", shown === 0 ? "true" : "false");
    }

    input.addEventListener("input", run);

    // 按 Esc 清空筛选，方便键盘操作
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        input.value = "";
        run();
      }
    });

    run();
  }

  /* ==== 5 滚动渐显 ====================================================== */
  function initReveal() {
    var nodes = [].slice.call(document.querySelectorAll("[data-reveal]"));
    if (!nodes.length) return;

    function revealAll() {
      nodes.forEach(function (n) {
        n.setAttribute("data-in", "true");
      });
    }

    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.style.transitionDelay = Math.min(i * 60, 240) + "ms";
          el.setAttribute("data-in", "true");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    // 首屏内的元素同步点亮，不等回调：避免“内容一开始看不见”的观感问题
    var fold = window.innerHeight * 0.94;
    nodes.forEach(function (n) {
      if (n.getBoundingClientRect().top < fold) {
        n.setAttribute("data-in", "true");
      } else {
        io.observe(n);
      }
    });

    // 兜底：即便观察器没有回调，内容也不会一直隐身
    window.setTimeout(revealAll, 2600);
  }

  /* ==== 6 站点向导（右下角角色） ======================================= */
  var GUIDE = {
    name: "花冈柚子",
    art: [
      "assets/img/yuzu_hoodie.png",
      "assets/img/yuzu_maid.png",
      "assets/img/yuzu_red.png"
    ],
    tips: [
      "嗨，我是花冈柚子，这个站点的向导就是我啦～哪里看不懂就点我。",
      "想装 McLuncher？去「下载」页拿整包，双击就能跑，不用解压也不用安装。",
      "下载之前对一下页面上的 SHA-256，确认文件没被动过，心里更踏实。",
      "同一个版本可以开好几份：一份原版、一份装模组，存档和设置互不干扰。",
      "第一次启动记得看「指南」，每一步都写清楚了，还有键盘快捷键表。",
      "女仆装营业中～今天也陪你把这个站点逛完。"
    ]
  };

  function initGuide() {
    if (!GUIDE.tips.length) return;

    var hidden = false;
    try {
      hidden = sessionStorage.getItem("mc.guide") === "off";
    } catch (e) {}

    var wrap = document.createElement("div");
    wrap.className = "guide";
    wrap.setAttribute("data-hidden", hidden ? "true" : "false");
    wrap.innerHTML =
      '<div class="guide__bubble" data-show="false" role="status" aria-live="polite">' +
      '<button class="guide__close" type="button" aria-label="收起向导">×</button>' +
      '<span data-guide-text></span></div>' +
      '<button class="guide__char" type="button" aria-label="和向导聊天">' +
      '<img alt="" width="240" height="480"></button>';

    document.body.appendChild(wrap);

    var bubble = wrap.querySelector(".guide__bubble");
    var textEl = wrap.querySelector("[data-guide-text]");
    var img = wrap.querySelector("img");
    var char = wrap.querySelector(".guide__char");
    var close = wrap.querySelector(".guide__close");
    var idx = 0;
    var artIdx = Math.floor(Math.random() * GUIDE.art.length);
    var timer = null;

    img.src = GUIDE.art[artIdx];
    img.alt = GUIDE.name + "（站点向导）";
    char.setAttribute("title", "点一下换台词");

    function showTip(i) {
      textEl.textContent = GUIDE.tips[i];
      bubble.setAttribute("data-show", "true");
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        bubble.setAttribute("data-show", "false");
      }, 9000);
    }

    function nextOutfit() {
      if (GUIDE.art.length < 2) return;
      var next = artIdx;
      while (next === artIdx) {
        next = Math.floor(Math.random() * GUIDE.art.length);
      }
      artIdx = next;
      img.src = GUIDE.art[artIdx];
    }

    char.addEventListener("click", function () {
      idx = (idx + 1) % GUIDE.tips.length;
      nextOutfit();
      showTip(idx);
    });

    close.addEventListener("click", function () {
      wrap.setAttribute("data-hidden", "true");
      try {
        sessionStorage.setItem("mc.guide", "off");
      } catch (e) {}
    });

    // 窄屏上自动弹气泡会压住正文，交给用户点一下再看
    if (!hidden && window.innerWidth > 600) {
      window.setTimeout(function () {
        showTip(0);
      }, 1400);
    }
  }

  /* ==== 7 其他细节：复制按钮、年份、外链 ============================== */
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-copy]") : null;
    if (!btn) return;

    var value = btn.getAttribute("data-copy") || "";
    var original = btn.textContent;

    copyText(value).then(
      function () {
        btn.setAttribute("data-copied", "true");
        btn.textContent = "已复制";
        window.setTimeout(function () {
          btn.removeAttribute("data-copied");
          btn.textContent = original;
        }, 1800);
      },
      function () {
        btn.textContent = "复制失败";
        window.setTimeout(function () {
          btn.textContent = original;
        }, 1800);
      }
    );
  });

  [].slice.call(document.querySelectorAll("[data-year]")).forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // 站外链接统一加安全属性（当前站点暂无外链，保留以便后续扩展）
  [].slice.call(document.querySelectorAll('a[href^="http"]')).forEach(function (a) {
    if (a.host === window.location.host) return;
    a.setAttribute("rel", "noopener noreferrer");
    a.setAttribute("target", "_blank");
  });

  /* ==== 启动 ============================================================ */
  function boot() {
    initFaq();
    initReveal();
    initGuide();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
