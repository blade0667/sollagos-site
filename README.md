# Sollagos Energia Solar — novo site

Renovação do site da Sollagos (energia solar, Região dos Lagos – RJ). HTML/CSS/JS puro, sem build.

- **Motion:** biblioteca [Motion](https://motion.dev) (CDN) + CSS. Personalidade *Premium*: easing de entrada `cubic-bezier(.05,.7,.1,1)`, durações 0.2 / 0.45 / 0.9s, stagger total < 0.5s. Respeita `prefers-reduced-motion`.
- **3D:** casa low-poly em [three.js](https://threejs.org) (`house.js`). No hero, o scroll (GSAP ScrollTrigger) instala as placas, sobe o sol e derruba a conta de luz; no simulador, a faixa de consumo define o número de placas. Sem WebGL, o site volta para a foto. A regra de estimativa (placas por faixa, kWh por placa, % de economia) é provisória e fica em `index.html` (`data-panels`) e `main.js`.
- **Seções:** hero com formulário (envia para o WhatsApp), segmentos, benefícios, passo a passo com linha animada pelo scroll, cases com gráficos antes/depois, avaliações, vídeos, galeria de projetos, sobre, FAQ e CTA.
- **Conteúdo, imagens e vídeos** vindos do site original (sollagos.com.br).

## Rodar localmente
```bash
python -m http.server 8000   # abra http://localhost:8000
```
(precisa de servidor local por causa do `type="module"`).

Configurações: número do WhatsApp em `main.js` (`WA`) e nos links de `index.html`.
