/**
 * Filename: Assessment_Dev_Initializer.js
 * 目的: 資産ファイルの中身を結合し、そのまま出力する。
 */
const fs = require("fs");
const path = require("path");

// 同期対象のファイルリスト
const ASSETS_TO_SYNC = [
  "docs/治療院支援アセスメント・インフラ 仕様書.md",
  "common/engine.js",
  "common/core-style.css",
  "jiritu-assessment/base-config.js",
  "jiritu-assessment/settings/0001.js",
  "templates/elementor-glue.html",
];

function generate() {
  let output =
    "以下は、現在のアセスメント・インフラの最新ソースコードと仕様書です。解析・改善をお願いします。\n";

  // 資産ファイルの中身をすべて読み込んで結合
  ASSETS_TO_SYNC.forEach((filePath) => {
    const absolutePath = path.resolve(filePath);

    if (fs.existsSync(absolutePath)) {
      const fileBody = fs.readFileSync(absolutePath, "utf-8");

      // 区切り線とファイル名を追加
      output += "\n---\nFile: " + filePath + "\n---\n" + fileBody + "\n";
    } else {
      console.error("[Warning] Asset file not found: " + filePath);
    }
  });

  // そのまま標準出力（タスクによってクリップボードへ送られる）
  console.log(output.trim());
}

generate();
