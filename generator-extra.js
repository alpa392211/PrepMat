/**
 * ==========================================================================
 * PREPMAT - MÓDULO EXTRA DE PROBLEMAS (cargar DESPUÉS de app.js)
 * 1. 21 nuevos tipos de problema paramétricos (3 por rama: sencilla/media/alta)
 * 2. Memoria "no repetir" entre exámenes y sesiones (localStorage)
 * 3. QuestionGenerator.audit() para contar problemas únicos por rama
 * ==========================================================================
 */
(function () {
  const G = QuestionGenerator;
  const R = (a, b) => G.randInt(a, b);
  const NZ = (a, b) => G.randNonZero(a, b);
  const pick = (arr) => G.randChoice(arr);
  const fr = (n, d) => G.formatFrac(n, d);
  const st = (v, x, first) => G.signTerm(v, x, first);
  const peso = (v) => `\\$${v}\\text{ pesos}`;

  const X = {
    /* ===================== ARITMÉTICA ===================== */
    ariOrdenOperaciones() {
      const a = R(2, 40), b = R(2, 12), c = R(2, 12), e = R(2, 9), q = R(2, 12), d = e * q;
      const ans = a + b * c - q;
      return {
        calculator: "none",
        question: `Calcula el valor de la siguiente expresión respetando la jerarquía de operaciones:\n$$${a} + ${b} \\times ${c} - ${d} \\div ${e}$$`,
        options: this.buildUniqueOptions(`${ans}`, [`${(a + b) * c - q}`, `${a + b * c - d}`, `${a + b * c + q}`], (k) => `${ans + k * 2}`),
        explanation: `Primero se resuelven multiplicaciones y divisiones, y después sumas y restas: $$${a} + ${b * c} - ${q} = ${ans}$$`
      };
    },

    ariInteresSimple() {
      const C = R(2, 40) * 500, r = R(2, 15), t = R(1, 8), I = (C * r * t) / 100, M = C + I;
      return {
        calculator: "basic",
        question: `Se depositan $\\$${C}\\text{ pesos}$ a una tasa de interés simple del $${r}\\%$ anual durante $${t}$ ${t === 1 ? "año" : "años"}. ¿Cuál es el monto final acumulado?`,
        options: this.buildUniqueOptions(peso(M), [peso(I), peso((C * Math.pow(1 + r / 100, t)).toFixed(2)), peso(C + (C * r) / 100)], (k) => peso(M + k * 50)),
        explanation: `El interés simple es $I = \\frac{C \\cdot r \\cdot t}{100} = \\frac{${C} \\cdot ${r} \\cdot ${t}}{100} = ${I}$. El monto es: $$M = C + I = ${C} + ${I} = \\$${M}\\text{ pesos}$$`
      };
    },

    ariRepartoProporcional() {
      const a = R(1, 6), b = R(1, 6), c = R(1, 6), S = a + b + c, k = R(3, 40), N = S * k;
      return {
        calculator: "basic",
        question: `Ana, Beto y Carla se reparten $\\$${N}\\text{ pesos}$ en forma directamente proporcional a $${a}$, $${b}$ y $${c}$ respectivamente. ¿Cuánto recibe Beto?`,
        options: this.buildUniqueOptions(peso(b * k), [peso(a * k), peso(c * k), peso(Math.round(N / 3))], (s) => peso(b * k + s * 10)),
        explanation: `La suma de las partes es $${a} + ${b} + ${c} = ${S}$, así que cada parte vale $\\frac{${N}}{${S}} = ${k}$. Beto recibe: $$${b} \\times ${k} = \\$${b * k}\\text{ pesos}$$`
      };
    },

    /* ===================== ÁLGEBRA ===================== */
    algInecuacionLineal() {
      const a = R(2, 9), s = R(-9, 12), b = NZ(-12, 12), c = a * s + b;
      const gt = pick([true, false]);
      const rel = gt ? "\\gt" : "\\lt";
      const correct = gt ? `(${s}, \\infty)` : `(-\\infty, ${s})`;
      const wrong = gt
        ? [`[${s}, \\infty)`, `(-\\infty, ${s})`, `(${-s}, \\infty)`]
        : [`(-\\infty, ${s}]`, `(${s}, \\infty)`, `(-\\infty, ${-s})`];
      return {
        calculator: "none",
        question: `Resuelve la inecuación lineal y expresa la solución como intervalo:\n$$${a}x ${st(b)} ${rel} ${c}$$`,
        options: this.buildUniqueOptions(correct, wrong, (k) => (gt ? `(${s + k}, \\infty)` : `(-\\infty, ${s + k})`)),
        explanation: `Despejamos $x$ (como $${a} \\gt 0$ el sentido de la desigualdad no cambia): $$${a}x ${rel} ${c - b} \\Rightarrow x ${rel} ${s}$$ Por lo tanto, la solución es $${correct}$.`
      };
    },

    algRectanguloPerimetro() {
      const w = R(3, 25), k = R(1, 12), P = 2 * (2 * w + k);
      return {
        calculator: "none",
        question: `El largo de un rectángulo excede en $${k}\\text{ cm}$ a su ancho. Si su perímetro es de $${P}\\text{ cm}$, ¿cuánto mide su ancho?`,
        options: this.buildUniqueOptions(`${w}\\text{ cm}`, [`${w + k}\\text{ cm}`, `${Math.round(P / 4)}\\text{ cm}`, `${w + 2}\\text{ cm}`], (s) => `${w + s * 3}\\text{ cm}`),
        explanation: `Si el ancho es $w$, el largo es $w + ${k}$. El perímetro cumple: $$2\\left(w + (w + ${k})\\right) = ${P} \\Rightarrow 4w + ${2 * k} = ${P} \\Rightarrow w = ${w}\\text{ cm}$$`
      };
    },

    algLogaritmo() {
      const b = R(2, 5), n = R(2, 4), c = R(1, 12), x = Math.pow(b, n) - c;
      return {
        calculator: "none",
        question: `Determina el valor de $x$ que satisface la ecuación logarítmica:\n$$\\log_{${b}}(x + ${c}) = ${n}$$`,
        options: this.buildUniqueOptions(`x = ${x}`, [`x = ${n * b - c}`, `x = ${Math.pow(b, n) + c}`, `x = ${Math.pow(n, b) - c}`], (k) => `x = ${x + k * 2}`),
        explanation: `Por definición de logaritmo, $\\log_b(u) = n \\Leftrightarrow u = b^n$: $$x + ${c} = ${b}^{${n}} = ${Math.pow(b, n)} \\Rightarrow x = ${x}$$`
      };
    },

    /* ===================== GEOMETRÍA EUCLIDIANA ===================== */
    geoRectanguloPerimetro() {
      const l = R(6, 30), w = R(2, l - 1), P = 2 * (l + w), A = l * w;
      return {
        calculator: "basic",
        question: `Un rectángulo tiene perímetro de $${P}\\text{ cm}$ y su largo mide $${l}\\text{ cm}$. ¿Cuál es su área?`,
        options: this.buildUniqueOptions(`${A}\\text{ cm}^2`, [`${l * l}\\text{ cm}^2`, `${(P / 2) * l}\\text{ cm}^2`, `${(l + w) * w}\\text{ cm}^2`], (k) => `${A + k * 6}\\text{ cm}^2`),
        explanation: `El semiperímetro es $l + w = \\frac{${P}}{2} = ${P / 2}$, entonces $w = ${P / 2} - ${l} = ${w}\\text{ cm}$. El área es: $$A = l \\cdot w = ${l} \\times ${w} = ${A}\\text{ cm}^2$$`
      };
    },

    geoTrianguloRazon() {
      const S = pick([9, 10, 12, 15, 18, 20, 30]);
      const p = R(1, S - 2), q = R(1, S - p - 1), r = S - p - q;
      const unit = 180 / S, mx = Math.max(p, q, r), mn = Math.min(p, q, r), ans = mx * unit;
      return {
        calculator: "none",
        question: `Los ángulos interiores de un triángulo están en la razón $${p} : ${q} : ${r}$. ¿Cuánto mide el ángulo mayor?`,
        options: this.buildUniqueOptions(`${ans}^\\circ`, [`${mn * unit}^\\circ`, `${ans + unit}^\\circ`, `90^\\circ`], (k) => `${ans + k * 5}^\\circ`),
        explanation: `Los ángulos suman $180^\\circ$ y la suma de las razones es $${p} + ${q} + ${r} = ${S}$, de modo que cada parte vale $\\frac{180^\\circ}{${S}} = ${unit}^\\circ$. El mayor es: $$${mx} \\times ${unit}^\\circ = ${ans}^\\circ$$`
      };
    },

    geoSectorCircular() {
      const th = pick([30, 45, 60, 72, 90, 120, 135, 150, 180, 210, 240, 270]), r = R(3, 24);
      const f = (n, d) => `${fr(n, d)}\\pi\\text{ cm}^2`;
      const ans = f(th * r * r, 360);
      return {
        calculator: "none",
        question: `Calcula el área de un sector circular de radio $r = ${r}\\text{ cm}$ y ángulo central $${th}^\\circ$. Exprésala en términos de $\\pi$:`,
        options: this.buildUniqueOptions(ans, [f(th * r, 180), f(th * r * r, 180), f(th * r, 360)], (k) => f(th * r * r + 5 * k, 360)),
        explanation: `El área de un sector es proporcional a su ángulo: $$A = \\frac{\\theta}{360^\\circ}\\pi r^2 = \\frac{${th}}{360}\\pi (${r})^2 = ${ans}$$`
      };
    },

    /* ===================== TRIGONOMETRÍA ===================== */
    trig30_60_90() {
      const k = R(2, 40), askHyp = pick([true, false]);
      if (askHyp) {
        return {
          calculator: "none",
          question: `En un triángulo rectángulo con ángulos agudos de $30^\\circ$ y $60^\\circ$, el cateto menor mide $${k}\\text{ cm}$. ¿Cuánto mide la hipotenusa?`,
          options: this.buildUniqueOptions(`${2 * k}\\text{ cm}`, [`${k}\\sqrt{3}\\text{ cm}`, `${k}\\sqrt{2}\\text{ cm}`, `${3 * k}\\text{ cm}`], (s) => `${2 * k + s}\\text{ cm}`),
          explanation: `El cateto opuesto a $30^\\circ$ es la mitad de la hipotenusa porque $\\sin(30^\\circ) = \\frac{1}{2}$: $$c = \\frac{${k}}{\\sin(30^\\circ)} = ${2 * k}\\text{ cm}$$`
        };
      }
      return {
        calculator: "none",
        question: `En un triángulo rectángulo con ángulos agudos de $30^\\circ$ y $60^\\circ$, el cateto menor mide $${k}\\text{ cm}$. ¿Cuánto mide el cateto mayor?`,
        options: this.buildUniqueOptions(`${k}\\sqrt{3}\\text{ cm}`, [`${2 * k}\\text{ cm}`, `${k}\\sqrt{2}\\text{ cm}`, `${3 * k}\\text{ cm}`], (s) => `${k + s}\\sqrt{3}\\text{ cm}`),
        explanation: `El cateto mayor es el adyacente a $30^\\circ$ y cumple $\\tan(60^\\circ) = \\sqrt{3}$: $$b = ${k} \\cdot \\tan(60^\\circ) = ${k}\\sqrt{3}\\text{ cm}$$`
      };
    },

    trigAreaSeno() {
      const a = R(3, 24), b = R(3, 24), ang = pick([30, 60, 90, 120, 150]), ab = a * b;
      let den = 4, sfx = "", sinTxt = "\\frac{1}{2}";
      if (ang === 90) { den = 2; sinTxt = "1"; }
      else if (ang === 60 || ang === 120) { sfx = "\\sqrt{3}"; sinTxt = "\\frac{\\sqrt{3}}{2}"; }
      const f = (n, d) => `${fr(n, d)}${sfx}\\text{ cm}^2`;
      const ans = f(ab, den);
      return {
        calculator: "none",
        question: `Dos lados de un triángulo miden $${a}\\text{ cm}$ y $${b}\\text{ cm}$ y el ángulo comprendido entre ellos es de $${ang}^\\circ$. ¿Cuál es su área exacta?`,
        options: this.buildUniqueOptions(ans, [f(ab, den * 2), f(ab, den / 2), `${ab}\\text{ cm}^2`], (k) => f(ab + k * 2, den)),
        explanation: `Usamos $A = \\frac{1}{2}ab\\sin(C)$ con $\\sin(${ang}^\\circ) = ${sinTxt}$: $$A = \\frac{1}{2}(${a})(${b})${sinTxt} = ${ans}$$`
      };
    },

    trigDobleAngulo() {
      const [p, q, h] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]);
      const [o, a] = pick([[p, q], [q, p]]);
      const fn = pick(["sin", "cos", "tan"]);
      let nC, dC, wrong;
      if (fn === "sin") { nC = 2 * o * a; dC = h * h; wrong = [fr(2 * o, h), fr(o * a, h * h), fr(2 * o * o, h * h)]; }
      else if (fn === "cos") { nC = a * a - o * o; dC = h * h; wrong = [fr(o * o - a * a, h * h), fr(2 * a, h), fr(a * a, h * h)]; }
      else { nC = 2 * o * a; dC = a * a - o * o; wrong = [fr(2 * o, a), fr(2 * o * a, h * h), fr(a * a - o * o, 2 * o * a)]; }
      const ans = fr(nC, dC);
      const formula = { sin: "2\\sin\\theta\\cos\\theta", cos: "\\cos^2\\theta - \\sin^2\\theta", tan: "\\frac{2\\sin\\theta\\cos\\theta}{\\cos^2\\theta - \\sin^2\\theta}" }[fn];
      return {
        calculator: "none",
        question: `Si $\\theta$ es un ángulo agudo y $\\sin(\\theta) = \\frac{${o}}{${h}}$, calcula el valor exacto de $\\${fn}(2\\theta)$:`,
        options: this.buildUniqueOptions(ans, wrong, (k) => fr(nC + k, dC)),
        explanation: `Como $\\theta$ es agudo, $\\cos(\\theta) = \\sqrt{1 - \\left(\\frac{${o}}{${h}}\\right)^2} = \\frac{${a}}{${h}}$. Aplicando la identidad de ángulo doble: $$\\${fn}(2\\theta) = ${formula} = ${ans}$$`
      };
    },

    /* ===================== GEOMETRÍA ANALÍTICA ===================== */
    geoanExtremoSimetrico() {
      const mx = R(-9, 9), my = R(-9, 9), x1 = R(-9, 9), y1 = R(-9, 9), bx = 2 * mx - x1, by = 2 * my - y1;
      return {
        calculator: "none",
        question: `El punto medio del segmento $AB$ es $M(${mx}, ${my})$ y uno de sus extremos es $A(${x1}, ${y1})$. ¿Cuáles son las coordenadas del extremo $B$?`,
        options: this.buildUniqueOptions(`B(${bx}, ${by})`, [`B(${mx - x1}, ${my - y1})`, `B(${x1 - 2 * mx}, ${y1 - 2 * my})`, `B(${mx + x1}, ${my + y1})`], (k) => `B(${bx + k}, ${by - k})`),
        explanation: `Como $M = \\frac{A + B}{2}$, entonces $B = 2M - A$: $$B = \\left(2(${mx}) - (${x1}),\\; 2(${my}) - (${y1})\\right) = (${bx}, ${by})$$`
      };
    },

    geoanDistanciaPuntoRecta() {
      const [A0, B0, n] = pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 6, 10], [8, 15, 17], [15, 8, 17]]);
      const A = A0, B = B0 * pick([1, -1]);
      const x0 = R(-6, 6), y0 = R(-6, 6), d = R(1, 9), s = pick([1, -1]);
      const C = s * d * n - A * x0 - B * y0;
      return {
        calculator: "none",
        question: `Calcula la distancia del punto $P(${x0}, ${y0})$ a la recta:\n$$${A}x ${st(B, "y")} ${st(C)} = 0$$`,
        options: this.buildUniqueOptions(`${d}`, [`${d * n}`, `${-d}`, fr(d * n, n * n)], (k) => `${d + k}`),
        explanation: `Aplicamos $d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$. El numerador vale $|${s * d * n}| = ${d * n}$ y el denominador $\\sqrt{${A * A} + ${B * B}} = ${n}$: $$d = \\frac{${d * n}}{${n}} = ${d}$$`
      };
    },

    geoanHiperbola() {
      const [a0, b0, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [15, 20, 25], [10, 24, 26]]);
      const [a, b] = pick([[a0, b0], [b0, a0]]);
      const foci = pick([true, false]);
      const eq = `\\frac{x^2}{${a * a}} - \\frac{y^2}{${b * b}} = 1`;
      if (foci) {
        return {
          calculator: "none",
          question: `Determina las coordenadas de los focos de la hipérbola:\n$$${eq}$$`,
          options: this.buildUniqueOptions(`F(\\pm ${c}, 0)`, [`F(\\pm ${a}, 0)`, `F(0, \\pm ${c})`, `F(\\pm ${a * a + b * b}, 0)`], (k) => `F(\\pm ${c + k}, 0)`),
          explanation: `Aquí $a^2 = ${a * a}$ y $b^2 = ${b * b}$. En la hipérbola $c^2 = a^2 + b^2$: $$c = \\sqrt{${a * a} + ${b * b}} = ${c}$$ El eje transversal es horizontal, por lo que los focos son $F(\\pm ${c}, 0)$.`
        };
      }
      return {
        calculator: "none",
        question: `Determina las ecuaciones de las asíntotas de la hipérbola:\n$$${eq}$$`,
        options: this.buildUniqueOptions(`y = \\pm ${fr(b, a)}x`, [`y = \\pm ${fr(a, b)}x`, `y = \\pm ${fr(b * b, a * a)}x`, `y = \\pm ${fr(c, a)}x`], (k) => `y = \\pm ${fr(b + k, a)}x`),
        explanation: `Con $a = ${a}$ y $b = ${b}$, las asíntotas de una hipérbola horizontal son $y = \\pm \\frac{b}{a}x$: $$y = \\pm ${fr(b, a)}x$$`
      };
    },

    /* ===================== FUNCIONES / PRECÁLCULO ===================== */
    funcTramos() {
      const c = R(-3, 4), m = NZ(-5, 5), b = NZ(-9, 9), d = NZ(-9, 9);
      const x0 = pick([c - R(1, 4), c + R(0, 4)]);
      const v1 = m * x0 + b, v2 = x0 * x0 + d;
      const first = x0 < c, ans = first ? v1 : v2, other = first ? v2 : v1;
      return {
        calculator: "none",
        question: `Dada la función definida por tramos:\n$$f(x) = \\begin{cases} ${st(m, "x", true)} ${st(b)} & \\text{si } x \\lt ${c} \\\\ x^2 ${st(d)} & \\text{si } x \\ge ${c} \\end{cases}$$\nCalcula $f(${x0})$:`,
        options: this.buildUniqueOptions(`${ans}`, [`${other}`, `${-ans}`, `${ans + 2}`], (k) => `${ans + k * 3}`),
        explanation: `Como $${x0} ${first ? "\\lt" : "\\ge"} ${c}$, usamos el ${first ? "primer" : "segundo"} tramo: $$f(${x0}) = ${first ? `${m}(${x0}) ${st(b)}` : `(${x0})^2 ${st(d)}`} = ${ans}$$`
      };
    },

    funcVerticeParabola() {
      const a = R(1, 4) * pick([1, -1]), h = NZ(-7, 7), k = NZ(-9, 9), b = -2 * a * h, c = k + a * h * h;
      return {
        calculator: "none",
        question: `Determina las coordenadas del vértice de la parábola:\n$$f(x) = ${st(a, "x^2", true)} ${st(b, "x")} ${st(c)}$$`,
        options: this.buildUniqueOptions(`V(${h}, ${k})`, [`V(${-h}, ${k})`, `V(${h}, ${c})`, `V(${h}, ${-k})`], (s) => `V(${h + s}, ${k})`),
        explanation: `La abscisa del vértice es $h = -\\frac{b}{2a} = -\\frac{${b}}{${2 * a}} = ${h}$. La ordenada es $k = f(${h}) = ${k}$. Por tanto, $V(${h}, ${k})$.`
      };
    },

    funcLimiteInfinito() {
      const a = R(1, 9), d = R(1, 9), b = NZ(-9, 9), c = NZ(-9, 9), e = NZ(-9, 9), f = NZ(-9, 9);
      const ans = fr(a, d);
      return {
        calculator: "none",
        question: `Calcula el siguiente límite al infinito:\n$$\\lim_{x \\to \\infty} \\frac{${a}x^2 ${st(b, "x")} ${st(c)}}{${d}x^2 ${st(e, "x")} ${st(f)}}$$`,
        options: this.buildUniqueOptions(ans, [fr(d, a), `0`, `\\infty`], (k) => fr(a + k, d)),
        explanation: `Dividimos numerador y denominador entre la mayor potencia, $x^2$. Los términos $\\frac{1}{x}$ y $\\frac{1}{x^2}$ tienden a $0$: $$\\lim_{x \\to \\infty} \\frac{${a} + \\frac{${b}}{x} + \\frac{${c}}{x^2}}{${d} + \\frac{${e}}{x} + \\frac{${f}}{x^2}} = \\frac{${a}}{${d}} = ${ans}$$`
      };
    },

    /* ===================== CÁLCULO DIFERENCIAL ===================== */
    calcPendienteTangente() {
      const a = R(1, 6), b = NZ(-9, 9), c = NZ(-9, 9), x0 = NZ(-5, 6), m = 2 * a * x0 + b;
      return {
        calculator: "none",
        question: `Calcula la pendiente de la recta tangente a la curva $f(x) = ${st(a, "x^2", true)} ${st(b, "x")} ${st(c)}$ en el punto de abscisa $x = ${x0}$:`,
        options: this.buildUniqueOptions(`${m}`, [`${a * x0 * x0 + b * x0 + c}`, `${2 * a * x0}`, `${2 * a + b}`], (k) => `${m + k * 2}`),
        explanation: `La pendiente de la tangente es la derivada evaluada en $x_0$. Como $f'(x) = ${2 * a}x ${st(b)}$: $$f'(${x0}) = ${2 * a}(${x0}) ${st(b)} = ${m}$$`
      };
    },

    calcDerivadaLn() {
      const a = R(1, 9), n = R(3, 9), co = a === 1 ? "" : `${a}`;
      const ans = `f'(x) = ${co}x^{${n - 1}}(${n}\\ln x + 1)`;
      return {
        calculator: "none",
        question: `Utilizando la regla del producto, calcula la derivada de:\n$$f(x) = ${co}x^{${n}}\\ln x$$`,
        options: this.buildUniqueOptions(ans, [`f'(x) = ${co}x^{${n - 1}}`, `f'(x) = ${co}x^{${n - 1}}(${n}\\ln x - 1)`, `f'(x) = ${co}x^{${n - 1}}(\\ln x + ${n})`], (k) => `f'(x) = ${co}x^{${n - 1}}(${n + k}\\ln x + 1)`),
        explanation: `Con $u = x^{${n}}$ y $v = \\ln x$: $u' = ${n}x^{${n - 1}}$ y $v' = \\frac{1}{x}$. Entonces: $$f'(x) = ${co}\\left(${n}x^{${n - 1}}\\ln x + x^{${n}} \\cdot \\frac{1}{x}\\right) = ${ans.replace("f'(x) = ", "")}$$`
      };
    },

    calcOptimizacionCerca() {
      const m = R(3, 40), wall = pick([true, false]);
      if (!wall) {
        const ans = m * m;
        return {
          calculator: "none",
          question: `Se dispone de $${4 * m}\\text{ m}$ de malla para cercar un terreno rectangular. ¿Cuál es el área máxima que se puede encerrar?`,
          options: this.buildUniqueOptions(`${ans}\\text{ m}^2`, [`${2 * ans}\\text{ m}^2`, `${4 * m}\\text{ m}^2`, `${m * (m - 1)}\\text{ m}^2`], (k) => `${ans + k * m}\\text{ m}^2`),
          explanation: `Si un lado mide $x$, el otro mide $${2 * m} - x$ y $A(x) = x(${2 * m} - x)$. Entonces $A'(x) = ${2 * m} - 2x = 0 \\Rightarrow x = ${m}$ (un cuadrado). $$A_{\\max} = ${m} \\times ${m} = ${ans}\\text{ m}^2$$`
        };
      }
      const ans = 2 * m * m;
      return {
        calculator: "none",
        question: `Un granjero tiene $${4 * m}\\text{ m}$ de cerca y desea delimitar un corral rectangular aprovechando un muro existente como uno de los lados (el muro no requiere cerca). ¿Cuál es el área máxima del corral?`,
        options: this.buildUniqueOptions(`${ans}\\text{ m}^2`, [`${m * m}\\text{ m}^2`, `${4 * m * m}\\text{ m}^2`, `${m * (2 * m - 1)}\\text{ m}^2`], (k) => `${ans + k * m}\\text{ m}^2`),
        explanation: `Con dos lados de ancho $w$ y uno de largo $l = ${4 * m} - 2w$: $A(w) = w(${4 * m} - 2w)$. Entonces $A'(w) = ${4 * m} - 4w = 0 \\Rightarrow w = ${m}$ y $l = ${2 * m}$. $$A_{\\max} = ${m} \\times ${2 * m} = ${ans}\\text{ m}^2$$`
      };
    }
  };

  /* Registro: 3 nuevos tipos por rama, uno por dificultad */
  G.EXTRA = {
    aritmetica: { sencilla: [X.ariOrdenOperaciones], media: [X.ariInteresSimple], alta: [X.ariRepartoProporcional] },
    algebra: { sencilla: [X.algInecuacionLineal], media: [X.algRectanguloPerimetro], alta: [X.algLogaritmo] },
    geometria_euclidiana: { sencilla: [X.geoRectanguloPerimetro], media: [X.geoTrianguloRazon], alta: [X.geoSectorCircular] },
    trigonometria: { sencilla: [X.trig30_60_90], media: [X.trigAreaSeno], alta: [X.trigDobleAngulo] },
    geometria_analitica: { sencilla: [X.geoanExtremoSimetrico], media: [X.geoanDistanciaPuntoRecta], alta: [X.geoanHiperbola] },
    funciones: { sencilla: [X.funcTramos], media: [X.funcVerticeParabola], alta: [X.funcLimiteInfinito] },
    calculo_diferencial: { sencilla: [X.calcPendienteTangente], media: [X.calcDerivadaLn], alta: [X.calcOptimizacionCerca] }
  };

  const baseGetFactories = G.getFactories;
  G.getFactories = function (topic, difficulty) {
    const extra = ((this.EXTRA || {})[topic] || {})[difficulty] || [];
    return baseGetFactories.call(this, topic, difficulty).concat(extra);
  };

  /* Auditoría: cuántos enunciados únicos produce cada rama y si hay opciones/textos inválidos */
  G.audit = function (samples = 4000) {
    const report = {};
    TOPICS.forEach((t) => {
      const all = new Set();
      const row = { sencilla: 0, media: 0, alta: 0, total: 0, errores: 0 };
      ["sencilla", "media", "alta"].forEach((diff) => {
        const set = new Set();
        for (let i = 0; i < samples; i++) {
          const q = G.generate(t.id, "all", diff);
          set.add(G.normalizeKey ? G.normalizeKey(q.question) : String(q.question).replace(/\s+/g, " ").trim());
          const blob = q.question + q.options.join("") + q.explanation;
          if (q.options.length !== 4 || new Set(q.options).size !== 4 || /NaN|undefined|Infinity/.test(blob)) row.errores++;
        }
        row[diff] = set.size;
        set.forEach((s) => all.add(s));
      });
      row.total = all.size;
      report[t.name] = row;
    });
    return report;
  };

  /* ===================== MEMORIA "NO REPETIR" ===================== */
  const SEEN_KEY = "prepmat_seen_v1", SEEN_MAX = 20000;
  Object.assign(ExamEngine, {
    seenSet: null,
    hashStatement(s) {
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      return (h >>> 0).toString(36);
    },
    loadSeen() {
      if (!this.seenSet) {
        try { this.seenSet = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
        catch (e) { this.seenSet = new Set(); }
      }
      return this.seenSet;
    },
    isSeen(norm) { return this.loadSeen().has(this.hashStatement(norm)); },
    markSeen(list) {
      const s = this.loadSeen();
      list.forEach((x) => s.add(this.hashStatement(x)));
      let arr = [...s];
      if (arr.length > SEEN_MAX) { arr = arr.slice(-SEEN_MAX); this.seenSet = new Set(arr); }
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(arr)); } catch (e) { /* sin almacenamiento */ }
    },
    resetSeen() {
      this.seenSet = new Set();
      try { localStorage.removeItem(SEEN_KEY); } catch (e) { /* noop */ }
    },

    /* createExam: igual que el original, pero prioriza problemas NUNCA vistos antes */
    createExam(topic = "general", level = "all", requestedCount = 15) {
      let pool = [...this.rawQuestions];
      if (topic !== "general") pool = pool.filter((q) => q.topic === topic);
      if (level !== "all") pool = pool.filter((q) => q.level === level);

      const targetCount = requestedCount;
      let numHard, numEasy, numMedium;
      if (targetCount >= 30) {
        numHard = Math.min(15, Math.max(10, Math.floor(targetCount * 0.3)));
        const remaining = targetCount - numHard;
        numEasy = Math.floor(remaining * 0.45);
        numMedium = remaining - numEasy;
      } else {
        numHard = Math.floor(targetCount / 3);
        numEasy = Math.floor(targetCount / 3);
        numMedium = targetCount - numHard - numEasy;
      }

      const used = new Set();
      const topicIds = topic === "general" ? TOPICS.map((t) => t.id) : [topic];

      const buildTier = (difficulty, needed) => {
        const tier = [];
        for (const cand of this.fisherYates(pool.filter((q) => q.difficulty === difficulty))) {
          if (tier.length >= needed) break;
          const norm = this.normalizeStatement(cand.question);
          if (!used.has(norm) && !this.isSeen(norm)) { used.add(norm); tier.push(cand); }
        }
        // Pasada 1: solo problemas nunca vistos. Pasada 2 (si el espacio se agotó): permite vistos, nunca duplicados dentro del examen.
        for (const allowSeen of [false, true]) {
          let attempts = 0;
          const max = needed * 80 + 400;
          while (tier.length < needed && attempts < max) {
            const g = QuestionGenerator.generate(topicIds[attempts % topicIds.length], level, difficulty);
            const norm = this.normalizeStatement(g.question);
            if (!used.has(norm) && (allowSeen || !this.isSeen(norm))) { used.add(norm); tier.push(g); }
            attempts++;
          }
        }
        return this.fisherYates(tier);
      };

      const easy = buildTier("sencilla", numEasy);
      const medium = buildTier("media", numMedium);
      const hard = buildTier("alta", numHard);
      this.markSeen([...used]);

      const prepared = [...easy, ...medium, ...hard].slice(0, targetCount).map((q) => this.prepareQuestion(q));
      this.currentExam = {
        title: topic === "general" ? "Simulacro General de Matemáticas" : (TOPICS.find((t) => t.id === topic)?.name || "Examen"),
        topic, level,
        targetCount: prepared.length,
        questions: prepared,
        currentIndex: 0,
        score: 0
      };
      return this.currentExam;
    }
  });
})();
