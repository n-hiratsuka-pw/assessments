const DIAG_BASE_CONFIG = {
  steps: [
    {
      id: 1,
      type: "part1",
      mainText: "どこが一番痛かったですか？",
      subText: "番号をタップしてください",
      image:
        "https://n-hiratsuka-pw.github.io/assessments/jiritu-assessment/assets/calf-map.webp",
      options: ["1", "2", "3", "4", "5", "6"],
      subOptions: [
        { id: "all", text: "全体的に痛い・場所は特定できない", score: 75 },
        { id: "none", text: "特に痛みや違和感はない", score: 0 },
      ],
    },
    {
      id: 2,
      type: "part2",
      mainText: "過去に以下のような経験はありますか？",
      subText: "当てはまるものすべてにチェック",
      items: [
        "病院で異常なしと言われたが、本人は辛い",
        "薬を飲んでも、めまいや頭痛が止まらない",
        "朝、目が覚めた瞬間から「体が重い」",
        "外出するのが怖くなるほどの不安感がある",
        "一生このままではないかと絶望を感じる",
      ],
      scorePerItem: 10,
    },
    {
      id: 3,
      type: "part3",
      mainText: "自律神経を乱す「悪い習慣」のチェック",
      subText: "当てはまるものすべてにチェック",
      items: [
        "寝る直前までスマホを長時間見ている",
        "集中すると無意識に奥歯を噛み締めている",
        "1日中デスクワークで、ほとんど歩かない",
        "呼吸が浅く、深く息を吸えていない",
        "湯船に浸からずシャワーだけで済ませる",
      ],
      scorePerItem: 5,
    },
  ],
  resultComment:
    "診断の結果、あなたの不調は、背骨の歪みによる物理的な神経圧迫が原因である可能性が高いと判定されました。早急な専門ケアをご検討ください。",
  ctaUrl: "#lp-main",
};
