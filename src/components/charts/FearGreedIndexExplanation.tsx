import React from "react";

export default function FearGreedIndexExplanation() {
  return (
    <div className="mt-8 max-w-3xl mx-auto bg-muted/40 rounded-xl p-6 text-muted-foreground text-base leading-relaxed shadow-inner">
      <h3 className="text-lg font-semibold mb-2 text-foreground">Por que medir Fear &amp; Greed?</h3>
      <p>
        O comportamento do mercado cripto é altamente emocional. As pessoas tendem a ficar gananciosas quando o mercado sobe (o famoso FOMO) e, por outro lado, vendem de forma irracional quando veem quedas. O índice Fear &amp; Greed ajuda a identificar esses extremos:
      </p>
      <ul className="list-disc pl-6 my-2">
        <li>Medo extremo pode indicar que os investidores estão demasiadamente preocupados — o que pode ser uma oportunidade de compra.</li>
        <li>Muita ganância geralmente sinaliza que o mercado pode estar perto de uma correção.</li>
      </ul>
      <p>
        O índice resume o sentimento do mercado em uma escala de 0 (medo extremo) a 100 (ganância extrema), analisando os seguintes fatores:
      </p>
      <ul className="list-disc pl-6 my-2">
        <li><b>Volatilidade (25%)</b>: Variações anormais nos preços podem indicar medo.</li>
        <li><b>Volume e Momentum (25%)</b>: Altos volumes em mercados positivos sugerem ganância.</li>
        <li><b>Mídias Sociais (15%)</b>: Interações no Twitter indicam interesse e comportamento do mercado.</li>
        <li><b>Pesquisas (15%, atualmente pausado)</b>: Enquetes sobre o sentimento dos investidores.</li>
        <li><b>Dominância (10%)</b>: Aumento da dominância do Bitcoin pode indicar medo, enquanto queda pode indicar busca por ganhos em altcoins.</li>
        <li><b>Tendências (10%)</b>: Dados do Google Trends sobre buscas relacionadas ao Bitcoin e criptomoedas.</li>
      </ul>
      <p>
        <b>Importante:</b> O índice reflete apenas o sentimento para Bitcoin, mas representa bem o clima geral do mercado cripto.
      </p>
      <div className="mt-4 text-xs text-muted-foreground">
        Fonte e mais informações:&nbsp;
        <a
          href="https://alternative.me/crypto/fear-and-greed-index/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          alternative.me/crypto/fear-and-greed-index/
        </a>
      </div>
    </div>
  );
}