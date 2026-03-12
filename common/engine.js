if (typeof window.AssessmentEngine === "undefined") {
  window.AssessmentEngine = class {
    constructor(containerId = "diag-app") {
      var base =
        typeof DIAG_BASE_CONFIG !== "undefined" ? DIAG_BASE_CONFIG : null;
      var override =
        typeof DIAG_CLINIC_OVERRIDE !== "undefined" ? DIAG_CLINIC_OVERRIDE : {};

      if (!base || !base.steps) {
        console.error("診断データが見つかりません。");
        return;
      }

      this.config = this.deepMerge(base, override);
      this.currentIdx = 0;
      this.answers = {};
      this.containerId = containerId;

      this.init();
    }

    deepMerge(target, source) {
      if (target === null || typeof target !== "object") return source;
      if (source === null || typeof source !== "object") return source;

      if (Array.isArray(target) && Array.isArray(source)) {
        const isIdArray = (arr) =>
          arr.length > 0 &&
          arr.every((item) => item && typeof item === "object" && "id" in item);
        if (isIdArray(target) && isIdArray(source)) {
          const result = [...target];
          source.forEach((srcItem) => {
            const index = result.findIndex((tItem) => tItem.id === srcItem.id);
            if (index !== -1)
              result[index] = this.deepMerge(result[index], srcItem);
            else result.push(srcItem);
          });
          return result;
        }
        return source;
      }

      const output = { ...target };
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (key in target)
            output[key] = this.deepMerge(target[key], source[key]);
          else output[key] = source[key];
        }
      }
      return output;
    }

    init() {
      this.container = document.getElementById(this.containerId);
      if (!this.container) return;

      if (this.container.parentNode !== document.body) {
        document.body.appendChild(this.container);
      }

      let overlay = document.getElementById("diag-overlay-bg");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "diag-overlay-bg";
        overlay.className = "diag-overlay";
        document.body.appendChild(overlay);
      }
      this.overlay = overlay;

      document.body.classList.add("diag-scroll-lock");
      this.overlay.style.display = "block";
      this.container.style.display = "flex";

      // ★設定からタイトルを描画
      const titleEl = this.container.querySelector("#diag-main-title");
      if (titleEl && this.config.mainTitle) {
        titleEl.innerText = this.config.mainTitle;
      } else if (titleEl) {
        titleEl.style.display = "none";
      }

      if (!this.eventsBound) {
        this.bindEvents();
        this.eventsBound = true;
      }

      this.render();
    }

    bindEvents() {
      this.container.addEventListener("click", (e) => {
        const p1Btn = e.target.closest(".js-p1-btn");
        if (p1Btn) {
          e.preventDefault();
          this.handleP1(p1Btn.dataset.val, parseInt(p1Btn.dataset.score, 10));
          return;
        }

        const nextBtn = e.target.closest("#next-btn");
        if (nextBtn) {
          e.preventDefault();
          this.next();
          return;
        }

        const prevBtn = e.target.closest("#prev-btn");
        if (prevBtn) {
          e.preventDefault();
          this.prev();
          return;
        }

        const ctaBtn = e.target.closest(".js-cta-btn");
        if (ctaBtn) {
          e.preventDefault();
          this.scroll();
          return;
        }
      });

      this.container.addEventListener("change", (e) => {
        const checkInput = e.target.closest(".js-check-input");
        if (checkInput) {
          this.toggleCheck(
            parseInt(checkInput.dataset.stepId, 10),
            parseInt(checkInput.dataset.idx, 10),
          );
        }
      });
      // ★背景クリックでの「閉じる機能」を削除しました（逃げ道封鎖）
    }

    close() {
      document.body.classList.remove("diag-scroll-lock");
      if (this.container) this.container.style.display = "none";
      if (this.overlay) this.overlay.style.display = "none";
    }

    render() {
      if (!this.config || !this.config.steps || this.config.steps.length === 0)
        return;

      const step = this.config.steps[this.currentIdx];
      const content = this.container.querySelector("#diag-content");
      const footer = this.container.querySelector("#diag-footer");
      const nextBtn = this.container.querySelector("#next-btn");

      // ★「あと○問」の動的計算
      const remaining = this.config.steps.length - this.currentIdx;
      const remainingEl = this.container.querySelector("#remaining-steps");
      if (remainingEl) remainingEl.innerText = remaining;

      const progressInner = this.container.querySelector("#progress-inner");
      if (progressInner) {
        progressInner.style.width =
          ((this.currentIdx + 1) / this.config.steps.length) * 100 + "%";
      }

      nextBtn.innerText =
        this.currentIdx === this.config.steps.length - 1
          ? "診断結果を見る"
          : "次へ進む";

      content.scrollTop = 0;

      let html = `<div class="diag-instruction">${step.mainText}<span>${step.subText || ""}</span></div>`;

      if (step.type === "part1") {
        footer.classList.add("hidden");
        const optScore =
          step.optionsScore !== undefined ? step.optionsScore : 100;

        html += `
          ${step.image ? `<div style="text-align:center; margin-bottom:15px;"><img src="${step.image}" style="max-width:100%; height:auto;"></div>` : ""}
          <div class="num-grid">
              ${(step.options || []).map((n) => `<button type="button" class="num-btn js-p1-btn" data-val="${n}" data-score="${optScore}">${n}</button>`).join("")}
          </div>
          ${(step.subOptions || []).map((o) => `<button type="button" class="wide-btn js-p1-btn" data-val="${o.id}" data-score="${o.score}">${o.text}</button>`).join("")}
        `;
      } else {
        footer.classList.remove("hidden");
        this.container
          .querySelector("#prev-btn")
          .classList.toggle("hidden", this.currentIdx === 0);
        html += `<div class="check-list">
          ${(step.items || [])
            .map((item, i) => {
              const checked = (this.answers[step.id] || []).includes(i)
                ? "checked"
                : "";
              return `<label class="check-item"><input type="checkbox" class="js-check-input" data-step-id="${step.id}" data-idx="${i}" ${checked}><span class="check-text">${item}</span></label>`;
            })
            .join("")}
        </div>`;
      }
      content.innerHTML = html;
    }

    handleP1(val, score) {
      const stepId = this.config.steps[this.currentIdx].id;
      this.answers[stepId] = { val, score };
      this.next();
    }

    toggleCheck(stepId, idx) {
      if (!this.answers[stepId]) this.answers[stepId] = [];
      const pos = this.answers[stepId].indexOf(idx);
      if (pos > -1) this.answers[stepId].splice(pos, 1);
      else this.answers[stepId].push(idx);
    }

    next() {
      if (this.currentIdx < this.config.steps.length - 1) {
        this.currentIdx++;
        this.render();
      } else {
        this.showResult();
      }
    }

    prev() {
      if (this.currentIdx > 0) {
        this.currentIdx--;
        this.render();
      }
    }

    showResult() {
      const content = this.container.querySelector("#diag-content");
      const footer = this.container.querySelector("#diag-footer");

      if (footer) footer.style.display = "none";

      const headerInfo = this.container.querySelector(".progress-info");
      if (headerInfo) headerInfo.innerHTML = "回答データを分析中...";

      const progressInner = this.container.querySelector("#progress-inner");
      if (progressInner) progressInner.style.width = "100%";

      // ★1. ローディング画面（分析中）を表示
      content.innerHTML = `
        <div class="diag-loading-box">
          <div class="diag-spinner"></div>
          <p class="diag-loading-text">あなたの状態を分析しています...</p>
        </div>
      `;
      content.scrollTop = 0;

      // ★2. 2秒後（2000ミリ秒後）に結果を表示
      setTimeout(() => {
        if (headerInfo) headerInfo.innerHTML = "診断が完了しました";

        let totalScore = 0;
        this.config.steps.forEach((step) => {
          const ans = this.answers[step.id];
          if (!ans) return;

          if (step.type === "part1" && ans.score !== undefined) {
            totalScore += ans.score;
          } else if (Array.isArray(ans)) {
            let stepScore = ans.length * (step.scorePerItem || 0);
            if (typeof step.maxScore === "number") {
              stepScore = Math.min(stepScore, step.maxScore);
            }
            totalScore += stepScore;
          }
        });

        const total = Math.min(100, totalScore);
        const resultTitle = this.config.resultTitle || "あなたの自律神経危険度";

        content.innerHTML = `
          <div class="result-box">
              <span style="font-weight:bold; color:#666;">${resultTitle}</span>
              <div style="margin:20px 0;"><span class="result-score">${total}</span><span style="font-size:24px; font-weight:bold; color:#ff4d4d;">%</span></div>
              <p style="line-height:1.6; margin-bottom:30px; text-align:left;">${this.config.resultComment}</p>
              <button type="button" class="cta-btn js-cta-btn" style="width:100%;">原因と解決策の解説へ ↓</button>
          </div>
        `;
        content.scrollTop = 0;
      }, 2000);
    }

    scroll() {
      this.close(); // 最後のボタンを押した時だけ閉じる（逃げ道解除）
      const el = document.querySelector(this.config.ctaUrl);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };
}
