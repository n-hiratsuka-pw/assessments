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

      // ★Elementorのレイアウト崩れ・Z-index問題を回避するため、強制的にbody直下へ移動（脱獄）
      if (this.container.parentNode !== document.body) {
        document.body.appendChild(this.container);
      }

      // ★黒い背景(オーバーレイ)を確実にbody直下に作成
      let overlay = document.getElementById("diag-overlay-bg");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "diag-overlay-bg";
        overlay.className = "diag-overlay";
        document.body.appendChild(overlay);
      }
      this.overlay = overlay;

      document.body.classList.add("diag-scroll-lock");
      this.overlay.style.display = "block"; // 黒背景を表示
      this.container.style.display = "flex";

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

        const closeBtn = e.target.closest(".js-close-btn");
        if (closeBtn) {
          e.preventDefault();
          this.close();
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

      // ★背景（黒い部分）をクリックしても閉じるように機能追加
      document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "diag-overlay-bg") {
          this.close();
        }
      });
    }

    close() {
      document.body.classList.remove("diag-scroll-lock");
      if (this.container) this.container.style.display = "none";
      if (this.overlay) this.overlay.style.display = "none"; // 黒背景も消す
    }

    render() {
      if (!this.config || !this.config.steps || this.config.steps.length === 0)
        return;

      const step = this.config.steps[this.currentIdx];
      const content = this.container.querySelector("#diag-content");
      const footer = this.container.querySelector("#diag-footer");
      const nextBtn = this.container.querySelector("#next-btn");

      this.container.querySelector("#current-step-num").innerText =
        this.currentIdx + 1;
      this.container.querySelector("#total-steps").innerText =
        this.config.steps.length;
      this.container.querySelector("#progress-inner").style.width =
        ((this.currentIdx + 1) / this.config.steps.length) * 100 + "%";

      nextBtn.innerText =
        this.currentIdx === this.config.steps.length - 1
          ? "診断結果を見る"
          : "次へ進む";

      content.scrollTop = 0;

      let html = `<div class="diag-instruction">${step.mainText}<span>${step.subText || ""}</span></div>`;

      if (step.type === "part1") {
        footer.classList.add("hidden");
        // ★ base-config に設定した optionsScore (今回は75点) を適用
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
      document.body.classList.remove("diag-scroll-lock");

      let totalScore = 0;
      this.config.steps.forEach((step) => {
        const ans = this.answers[step.id];
        if (!ans) return;

        if (step.type === "part1" && ans.score !== undefined) {
          totalScore += ans.score;
        } else if (Array.isArray(ans)) {
          // ★柔軟なスコア計算ロジック（上限値の自動制御）
          let stepScore = ans.length * (step.scorePerItem || 0);
          if (typeof step.maxScore === "number") {
            stepScore = Math.min(stepScore, step.maxScore); // maxScoreを超えないようにする
          }
          totalScore += stepScore;
        }
      });

      const total = Math.min(100, totalScore);
      const resultTitle = this.config.resultTitle || "あなたの自律神経危険度";

      const content = this.container.querySelector("#diag-content");
      const footer = this.container.querySelector("#diag-footer");

      if (footer) footer.style.display = "none";

      content.innerHTML = `
        <div class="result-box">
            <span style="font-weight:bold; color:#666;">${resultTitle}</span>
            <div style="margin:20px 0;"><span class="result-score">${total}</span><span style="font-size:24px; font-weight:bold; color:#ff4d4d;">%</span></div>
            <p style="line-height:1.6; margin-bottom:30px; text-align:left;">${this.config.resultComment}</p>
            <button type="button" class="cta-btn js-cta-btn" style="width:100%;">原因と解決策の解説へ ↓</button>
        </div>
      `;
      content.scrollTop = 0;
    }

    scroll() {
      this.close();
      const el = document.querySelector(this.config.ctaUrl);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };
}
