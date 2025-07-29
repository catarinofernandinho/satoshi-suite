import React from "react";

export default function FearGreedIndexImage() {
  return (
    <div className="border rounded-xl p-6 bg-black text-white flex flex-col items-center shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Índice Fear &amp; Greed</h2>
      <a
        href="https://alternative.me/crypto/fear-and-greed-index/"
        target="_blank"
        rel="noopener noreferrer"
        className="mb-2"
      >
        <img
          src="https://alternative.me/crypto/fear-and-greed-index.png"
          alt="Bitcoin Fear & Greed Index"
          className="rounded-lg"
          style={{ background: "#171717", maxWidth: 340, width: "100%" }}
        />
      </a>
      <div className="text-xs text-muted-foreground mt-2 text-center">
        Fonte:{" "}
        <a
          href="https://alternative.me/crypto/fear-and-greed-index/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80"
        >
          alternative.me
        </a>
      </div>
    </div>
  );
}