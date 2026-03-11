/**
 * AssessmentEngine v1.2 - Paradigm Works Edition
 */
class AssessmentEngine {
  constructor() {
    const base =
      typeof DIAG_BASE_CONFIG !== "undefined" ? DIAG_BASE_CONFIG : {};
    const override =
      typeof DIAG_CLINIC_OVERRIDE !== "undefined" ? DIAG_CLINIC_OVERRIDE : {};
    this.config = this.deepMerge(base, override);
    this.currentIdx = 0;
    this.answers = {};
    this.init();
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    return { ...target, ...source };
  }

  init() {
    document.body.classList.add("diag-scroll-lock");
    this.render();
    document.getElementById("next-btn").onclick = () => this.next();
    document.getElementById("prev-btn").onclick = () => this.prev();
  }

  render() {
    const step = this.config.steps[this.currentIdx];
    const content = document.getElementById("diag-content");
    const footer = document.getElementById("diag-footer");
    const nextBtn = document.getElementById("next-btn");

    document.getElementById("current-step-num").innerText = this.currentIdx + 1;
    document.getElementById("total-steps").innerText = this.config.steps.length;
    document.getElementById("progress-inner").style.width =
      ((this.currentIdx + 1) / this.config.steps.length) * 100 + "%";

    if (this.currentIdx === this.config.steps.length - 1) {
      nextBtn.innerText = "診断結果を見る";
    } else {
      nextBtn.innerText = "次へ進む";
    }

    let html = `<div class="diag-instruction">${step.mainText}<span>${step.subText}</span></div>`;

    if (step.type === "part1") {
      footer.classList.add("hidden");
      html += `
                <div class="diag-img-wrapper" style="text-align:center; margin-bottom:15px;">
                    <img src="${step.image}" class="diag-img" style="max-width:100%; height:auto; border:1px solid #eee;">
                </div>
                <div class="num-grid">
                    ${step.options.map((n) => `<button class="num-btn" onclick="diagApp.handleP1('${n}', 100)">${n}</button>`).join("")}
                </div>
                ${step.subOptions.map((o) => `<button class="wide-btn" onclick="diagApp.handleP1('${o.id}', ${o.score})">${o.text}</button>`).join("")}
            `;
    } else {
      footer.classList.remove("hidden");
      document
        .getElementById("prev-btn")
        .classList.toggle("hidden", this.currentIdx === 0);
      html += `<div class="check-list">
                ${step.items
                  .map((item, i) => {
                    const checked = (this.answers[step.id] || []).includes(i)
                      ? "checked"
                      : "";
                    return `
                        <label class="check-item">
                            <input type="checkbox" ${checked} onchange="diagApp.toggleCheck(${step.id}, ${i})">
                            <span style="margin-left:10px;">${item}</span>
                        </label>
                    `;
                  })
                  .join("")}
            </div>`;
    }
    content.innerHTML = html;
  }

  handleP1(val, score) {
    this.answers[1] = { val, score };
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
    const p1 = this.answers[1]?.score || 0;
    const p2 =
      (this.answers[2] || []).length *
      (this.config.steps[1].scorePerItem || 10);
    const p3 =
      (this.answers[3] || []).length * (this.config.steps[2].scorePerItem || 5);
    const total = Math.min(100, p1 + p2 + p3);

    document.getElementById("diag-app").innerHTML = `
            <div class="result-box" style="text-align:center; padding:20px;">
                <span class="result-label" style="font-weight:bold; color:#666;">あなたの自律神経危険度</span>
                <div class="result-score-wrap" style="margin:20px 0;"><span class="result-score" style="font-size:72px; font-weight:bold; color:#ff4d4d;">${total}</span><span style="font-size:24px; font-weight:bold; color:#ff4d4d;">%</span></div>
                <p class="result-desc" style="line-height:1.6; margin-bottom:30px;">${this.config.resultComment}</p>
                <a href="${this.config.ctaUrl}" class="cta-btn">原因と解決策の解説へ ↓</a>
            </div>
        `;
  }

  scroll() {
    const el = document.querySelector(this.config.ctaUrl);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }
}
