/**
 * Filename: Assessment_Dev_Initializer.js
 * 目的: 今回作成したアセスメント・システムの全資産を読み込み、
 * 役割設定プロンプトの[FILE_LIST_PLACEHOLDER]に注入して出力する。
 */
const fs = require("fs");
const path = require("path");

// 同期対象のファイルリスト（アセスメント資産に限定）
const ASSETS_TO_SYNC = [
  "docs/治療院支援アセスメント・インフラ 仕様書.md",
  "common/engine.js",
  "common/core-style.css",
  "jiritu-assessment/base-config.js",
  "jiritu-assessment/settings/0001.js",
  "templates/elementor-glue.html",
];

function generate() {
  // 読み込むテンプレートファイルを「役割設定プロンプト.md」に固定
  const templatePath = path.join(
    process.cwd(),
    "docs/14_AI・プロンプト資産集/システム開発",
    "役割設定プロンプト.md",
  );

  if (!fs.existsSync(templatePath)) {
    console.error("Error: Template file not found -> " + templatePath);
    process.exit(1);
  }

  // 1. プロンプトテンプレートの読み込み
  let templateContent = fs.readFileSync(templatePath, "utf-8");

  // 2. 資産ファイルの中身をすべて読み込んで結合
  let combinedAssetContent = "";

  ASSETS_TO_SYNC.forEach((filePath) => {
    const absolutePath = path.resolve(filePath);

    if (fs.existsSync(absolutePath)) {
      const fileBody = fs.readFileSync(absolutePath, "utf-8");

      // 区切り線とファイル名を追加して結合
      combinedAssetContent +=
        "\n---\nFile: " + filePath + "\n---\n" + fileBody + "\n";
    } else {
      console.error("[Warning] Asset file not found: " + filePath);
    }
  });

  // 3. テンプレート内のプレースホルダーを置換して出力
  const output = templateContent.replace(
    "[FILE_LIST_PLACEHOLDER]",
    combinedAssetContent,
  );
  console.log(output.trim());
}

generate();
