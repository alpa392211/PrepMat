/**
 * ==========================================================================
 * PREPMAT - APLICACIÓN WEB/MÓVIL MODULAR PARA EXÁMENES DE MATEMÁTICAS
 * JavaScript ES6+ Modular:
 * 1. StorageManager (Persistencia de Racha, Tema y Tipografía)
 * 2. ThemeManager (Modo Claro / Modo Oscuro)
 * 3. TypographyManager (Calibri / Times New Roman)
 * 4. MathCanvasBackground (Canvas Dinámico con Deriva de Símbolos)
 * 5. MathRenderer (Renderizado KaTeX Continuo Sin Cortes)
 * 6. NotificationManager (Avisos de Inactividad 24h)
 * 7. CalculatorManager (Calculadoras Básica y Científica)
 * 8. ExamEngine (Doble Aleatorización Fisher-Yates y Curva Progresiva)
 * 9. UIManager (Control de Vistas, Drawer Centralizado y Flujo de Examen)
 * ==========================================================================
 */

/* ==========================================================================
   1. CONSTANTES Y DEFINICIÓN DEL TEMARIO COMPLETO (7 RAMAS)
   ========================================================================== */
const TOPICS = [
  {
    id: "aritmetica",
    name: "Aritmética",
    icon: "±",
    colorClass: "card-theme-aritmetica",
    description: "Fracciones, razones y proporciones, MCM/MCD, porcentajes y operaciones fundamentales."
  },
  {
    id: "algebra",
    name: "Álgebra",
    icon: "x²",
    colorClass: "card-theme-algebra",
    description: "Ecuaciones lineales y cuadráticas, factorización, leyes de exponentes y sistemas."
  },
  {
    id: "geometria_euclidiana",
    name: "Geometría Euclidiana",
    icon: "📐",
    colorClass: "card-theme-geometria_euclidiana",
    description: "Teorema de Pitágoras, congruencia, semejanza, perímetros, áreas y polígonos."
  },
  {
    id: "trigonometria",
    name: "Trigonometría",
    icon: "⊿",
    colorClass: "card-theme-trigonometria",
    description: "Razones trigonométricas, identidades pitagóricas, leyes de senos y cosenos."
  },
  {
    id: "geometria_analitica",
    name: "Geometría Analítica",
    icon: "📈",
    colorClass: "card-theme-geometria_analitica",
    description: "Distancia entre puntos, recta, circunferencia, parábola, elipse e hipérbola."
  },
  {
    id: "funciones",
    name: "Funciones / Precálculo",
    icon: "ƒ(x)",
    colorClass: "card-theme-funciones",
    description: "Dominio, rango, composición, función inversa, asíntotas y transformaciones."
  },
  {
    id: "calculo_diferencial",
    name: "Cálculo Diferencial",
    icon: "d/dx",
    colorClass: "card-theme-calculo_diferencial",
    description: "Límites indeterminados, derivadas algebraicas, regla de la cadena y optimización."
  }
];

/* ==========================================================================
   2. GESTOR DE PERSISTENCIA (StorageManager)
   ========================================================================== */
const StorageManager = {
  STORAGE_KEY: "prepmat_data_v2",

  getDefaultData() {
    return {
      currentStreak: 0,
      lastSessionDate: null, // "YYYY-MM-DD"
      lastSessionTimestamp: null,
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      theme: "light",        // 'light' o 'dark'
      preferredFont: "calibri", // 'calibri' o 'times'
      notificationsEnabled: false
    };
  },

  getData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? { ...this.getDefaultData(), ...JSON.parse(raw) } : this.getDefaultData();
    } catch (e) {
      console.warn("Error leyendo localStorage:", e);
      return this.getDefaultData();
    }
  },

  saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Error guardando en localStorage:", e);
    }
  },

  getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  getYesterdayString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const d = String(yesterday.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  recordStudySession(questionsAnswered = 1, questionsCorrect = 1) {
    const data = this.getData();
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    if (!data.lastSessionDate) {
      data.currentStreak = 1;
    } else if (data.lastSessionDate === today) {
      data.currentStreak = Math.max(1, data.currentStreak);
    } else if (data.lastSessionDate === yesterday) {
      data.currentStreak += 1;
    } else {
      data.currentStreak = 1;
    }

    data.lastSessionDate = today;
    data.lastSessionTimestamp = Date.now();
    data.totalSessions += 1;
    data.totalQuestions += questionsAnswered;
    data.totalCorrect += questionsCorrect;

    this.saveData(data);
    return data;
  },

  resetStreak() {
    const data = this.getData();
    data.currentStreak = 0;
    data.lastSessionDate = null;
    data.lastSessionTimestamp = null;
    this.saveData(data);
    return data;
  }
};

/* ==========================================================================
   3. GESTOR DE TEMAS (ThemeManager - Modo Claro / Modo Oscuro)
   ========================================================================== */
const ThemeManager = {
  currentTheme: "light",

  init() {
    const data = StorageManager.getData();
    this.setTheme(data.theme || "light", false);
  },

  setTheme(themeName, persist = true) {
    this.currentTheme = themeName === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", this.currentTheme);

    // Meta theme-color para navegadores móviles
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", this.currentTheme === "dark" ? "#181A20" : "#F4F7F6");
    }

    // Actualizar botones segmentados en drawer
    const btnLight = document.getElementById("btn-theme-light");
    const btnDark = document.getElementById("btn-theme-dark");
    const labelTheme = document.getElementById("current-theme-label");

    if (btnLight && btnDark) {
      btnLight.classList.toggle("active", this.currentTheme === "light");
      btnDark.classList.toggle("active", this.currentTheme === "dark");
    }
    if (labelTheme) {
      labelTheme.textContent = this.currentTheme === "dark" ? "Oscuro" : "Claro";
    }

    if (persist) {
      const data = StorageManager.getData();
      data.theme = this.currentTheme;
      StorageManager.saveData(data);
    }

    // Notificar al canvas de fondo para ajustar paleta de símbolos
    if (MathCanvasBackground && typeof MathCanvasBackground.updatePalette === "function") {
      MathCanvasBackground.updatePalette(this.currentTheme);
    }
  },

  toggleTheme() {
    this.setTheme(this.currentTheme === "dark" ? "light" : "dark", true);
  }
};

/* ==========================================================================
   4. GESTOR DE TIPOGRAFÍA (TypographyManager - Calibri / Times New Roman)
   ========================================================================== */
const TypographyManager = {
  currentFont: "calibri",

  init() {
    const data = StorageManager.getData();
    this.setFont(data.preferredFont || "calibri", false);
  },

  setFont(fontName, persist = true) {
    this.currentFont = fontName === "times" ? "times" : "calibri";
    document.body.classList.remove("font-calibri", "font-times");
    document.body.classList.add(this.currentFont === "times" ? "font-times" : "font-calibri");

    const btnCalibri = document.getElementById("btn-font-calibri");
    const btnTimes = document.getElementById("btn-font-times");
    const labelFont = document.getElementById("current-font-label");

    if (btnCalibri && btnTimes) {
      btnCalibri.classList.toggle("active", this.currentFont === "calibri");
      btnTimes.classList.toggle("active", this.currentFont === "times");
    }
    if (labelFont) {
      labelFont.textContent = this.currentFont === "times" ? "Times New Roman" : "Calibri";
    }

    if (persist) {
      const data = StorageManager.getData();
      data.preferredFont = this.currentFont;
      StorageManager.saveData(data);
    }
  }
};

/* ==========================================================================
   5. FONDO CON SÍMBOLOS MATEMÁTICOS FLOTANTES (MathCanvasBackground)
   ========================================================================== */
const MathCanvasBackground = {
  canvas: null,
  ctx: null,
  symbols: [],
  symbolChars: ["∫", "Σ", "√x", "π", "∂", "Δ", "+", "−", "×", "÷", "λ", "θ", "∞", "≠", "ƒ(x)", "dy/dx", "lim", "log"],
  width: 0,
  height: 0,
  animationId: null,
  isDark: false,

  init() {
    this.canvas = document.getElementById("math-bg-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) return;

    this.resize();
    this.isDark = document.documentElement.getAttribute("data-theme") === "dark";
    this.createSymbols();
    this.startAnimation();

    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  },

  createSymbols() {
    this.symbols = [];
    // Cantidad balanceada para mantener rendimiento excelente en móviles
    const count = Math.max(16, Math.floor(this.width / 55));
    for (let i = 0; i < count; i++) {
      this.symbols.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        char: this.symbolChars[Math.floor(Math.random() * this.symbolChars.length)],
        size: 16 + Math.random() * 22,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.2 - Math.random() * 0.45, // Flotación ascendente suave
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.008,
        baseAlpha: 0.05 + Math.random() * 0.04 // Opacidad sutil para no interferir
      });
    }
  },

  updatePalette(theme) {
    this.isDark = theme === "dark";
  },

  startAnimation() {
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  },

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Ajuste de color y opacidad según tema (máximo 0.08 en modo oscuro)
    const color = this.isDark ? "165, 214, 167" : "108, 92, 231";
    const maxAlpha = this.isDark ? 0.08 : 0.11;

    for (let i = 0; i < this.symbols.length; i++) {
      const s = this.symbols[i];
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.vRot;

      // Wrap around bounds
      if (s.y < -40) {
        s.y = this.height + 30;
        s.x = Math.random() * this.width;
      }
      if (s.x < -40) s.x = this.width + 30;
      if (s.x > this.width + 40) s.x = -30;

      const alpha = Math.min(maxAlpha, s.baseAlpha);

      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      this.ctx.rotate(s.rot);
      this.ctx.font = `600 ${s.size}px Calibri, sans-serif`;
      this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(s.char, 0, 0);
      this.ctx.restore();
    }
  }
};

/* ==========================================================================
   6. RENDERIZADO MATEMÁTICO CONTINUO SIN CORTES (MathRenderer)
   ========================================================================== */
const MathRenderer = {
  elementsToRender: new Set(),

  toHTML(rawText) {
    if (!rawText) return "";
    let text = String(rawText);

    // Sustituir implies por Rightarrow
    text = text.replace(/\\implies/g, "\\Rightarrow");

    // Proteger signos de moneda escapados \$ para no colisionar con KaTeX
    const DOLLAR_TOKEN = "___PREPMAT_LIT_DOLLAR___";
    text = text.replace(/\\\$/g, DOLLAR_TOKEN);

    const sanitizeLatex = (formula) => {
      let clean = formula.replace(new RegExp(DOLLAR_TOKEN, "g"), "\\$").trim();
      // Eliminar entidades HTML
      clean = clean.replace(/&lt;/g, "\\lt ").replace(/&gt;/g, "\\gt ");
      clean = clean.replace(/\\implies/g, "\\Rightarrow");
      // Prevenir colisiones con < y >
      clean = clean.replace(/<(?!=)/g, "\\lt ").replace(/>(?!=)/g, "\\gt ");
      clean = clean.replace(/<=/g, "\\le ").replace(/>=/g, "\\ge ");
      return clean;
    };

    if (window.katex) {
      try {
        // Bloques $display$
        text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
          const cleanFormula = sanitizeLatex(formula);
          try {
            return window.katex.renderToString(cleanFormula, { displayMode: true, throwOnError: false });
          } catch (e) {
            return `<div class="katex-display">${cleanFormula}</div>`;
          }
        });

        // Bloques $inline$
        text = text.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
          const cleanFormula = sanitizeLatex(formula);
          try {
            const rendered = window.katex.renderToString(cleanFormula, { displayMode: false, throwOnError: false });
            return `<span class="math-inline">${rendered}</span>`;
          } catch (e) {
            return `<span class="math-inline">${cleanFormula}</span>`;
          }
        });

        return text.replace(new RegExp(DOLLAR_TOKEN, "g"), "$");
      } catch (err) {
        console.warn("KaTeX render error:", err);
        return text.replace(new RegExp(DOLLAR_TOKEN, "g"), "$");
      }
    }

    return text.replace(new RegExp(DOLLAR_TOKEN, "g"), "$");
  },

  render(targetElement) {
    if (!targetElement) return;
    if (window.katex) {
      const original = targetElement.dataset.rawMath || targetElement.innerHTML;
      targetElement.dataset.rawMath = original;
      targetElement.innerHTML = this.toHTML(original);
    } else {
      this.elementsToRender.add(targetElement);
    }
  },

  renderContent(targetElement, rawContent) {
    if (!targetElement) return;
    targetElement.dataset.rawMath = rawContent;
    targetElement.innerHTML = this.toHTML(rawContent);
    if (!window.katex) {
      this.elementsToRender.add(targetElement);
    }
  },

  renderPending() {
    if (window.katex && this.elementsToRender.size > 0) {
      this.elementsToRender.forEach(el => this.render(el));
      this.elementsToRender.clear();
    }
  }
};

window.addEventListener("load", () => {
  MathRenderer.renderPending();
});

/* ==========================================================================
   7. GESTOR DE NOTIFICACIONES (NotificationManager - 24h Reminder)
   ========================================================================== */
const NotificationManager = {
  init() {
    this.checkInactivityReminder();
  },

  async requestPermission() {
    if (!("Notification" in window)) {
      UIManager.showToast("Tu navegador no soporta la API de Notificaciones.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      const data = StorageManager.getData();
      data.notificationsEnabled = granted;
      StorageManager.saveData(data);

      if (granted) {
        UIManager.showToast("¡Recordatorios diarios de 24h activados!");
        new Notification("PrepMat Matemáticas", {
          body: "¡Recordatorio activo! Te avisaremos si pasan más de 24 horas sin estudiar.",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📐</text></svg>"
        });
      } else {
        UIManager.showToast("Permiso de notificaciones no concedido.");
      }
      return granted;
    } catch (e) {
      console.warn("Error con Notification API:", e);
      return false;
    }
  },

  checkInactivityReminder() {
    const data = StorageManager.getData();
    if (!data.lastSessionTimestamp || !data.notificationsEnabled) return;

    const diffHours = (Date.now() - data.lastSessionTimestamp) / (1000 * 60 * 60);
    if (diffHours >= 24 && Notification.permission === "granted") {
      new Notification("¡Mantén tu racha activa! 🔥", {
        body: "Han pasado más de 24 horas desde tu última sesión de matemáticas. ¡Resuelve 5 reactivos hoy!",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>"
      });
    }
  }
};

/* ==========================================================================
   8. GESTOR DE CALCULADORAS MODALES (CalculatorManager)
   ========================================================================== */
const CalculatorManager = {
  basicState: {
    display: "0",
    history: "",
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false
  },

  interState: {
    display: "0",
    history: "",
    firstOperand: null,
    operator: null,
    waitingForSecondOperand: false,
    angleMode: "DEG" // 'DEG' o 'RAD'
  },

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Básica
    const basicKeypad = document.querySelector("#modal-calc-basic .calc-keypad");
    if (basicKeypad) {
      basicKeypad.addEventListener("click", e => {
        const btn = e.target.closest("button");
        if (!btn) return;
        this.handleBasicInput(btn);
      });
    }

    // Intermedia
    const interKeypad = document.querySelector("#modal-calc-intermediate .calc-keypad");
    if (interKeypad) {
      interKeypad.addEventListener("click", e => {
        const btn = e.target.closest("button");
        if (!btn) return;
        this.handleInterInput(btn);
      });
    }

    // Cierre
    document.querySelectorAll("[data-close-calc]").forEach(btn => {
      btn.addEventListener("click", () => this.closeAll());
    });

    document.querySelectorAll(".calc-modal").forEach(modal => {
      modal.addEventListener("click", e => {
        if (e.target === modal) this.closeAll();
      });
    });
  },

  openBasic() {
    this.closeAll();
    const modal = document.getElementById("modal-calc-basic");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  },

  openIntermediate() {
    this.closeAll();
    const modal = document.getElementById("modal-calc-intermediate");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  },

  closeAll() {
    document.querySelectorAll(".calc-modal").forEach(modal => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    });
  },

  /* Calculadora Básica */
  handleBasicInput(btn) {
    const num = btn.dataset.num;
    const op = btn.dataset.op;
    if (num !== undefined) this.inputBasicDigit(num);
    else if (op) this.handleBasicOperator(op);
    this.updateBasicDisplay();
  },

  inputBasicDigit(digit) {
    const s = this.basicState;
    if (s.waitingForSecondOperand) {
      s.display = digit === "." ? "0." : digit;
      s.waitingForSecondOperand = false;
      return;
    }
    if (digit === ".") {
      if (!s.display.includes(".")) s.display += ".";
    } else {
      s.display = s.display === "0" ? digit : s.display + digit;
    }
  },

  handleBasicOperator(op) {
    const s = this.basicState;
    const currentVal = parseFloat(s.display);

    switch (op) {
      case "clear":
        s.display = "0";
        s.history = "";
        s.firstOperand = null;
        s.operator = null;
        s.waitingForSecondOperand = false;
        break;
      case "plusminus":
        s.display = String(-1 * parseFloat(s.display));
        break;
      case "percent":
        s.display = String(parseFloat(s.display) / 100);
        break;
      case "+":
      case "-":
      case "*":
      case "/":
        if (s.operator && s.waitingForSecondOperand) {
          s.operator = op;
          s.history = `${s.firstOperand} ${op}`;
          return;
        }
        if (s.firstOperand === null) {
          s.firstOperand = currentVal;
        } else if (s.operator) {
          const result = this.calculate(s.firstOperand, currentVal, s.operator);
          s.display = String(this.roundNum(result));
          s.firstOperand = result;
        }
        s.operator = op;
        s.waitingForSecondOperand = true;
        s.history = `${s.firstOperand} ${op}`;
        break;
      case "equals":
        if (s.operator && s.firstOperand !== null) {
          const result = this.calculate(s.firstOperand, currentVal, s.operator);
          s.history = `${s.firstOperand} ${s.operator} ${currentVal} =`;
          s.display = String(this.roundNum(result));
          s.firstOperand = null;
          s.operator = null;
          s.waitingForSecondOperand = false;
        }
        break;
    }
  },

  updateBasicDisplay() {
    const screen = document.getElementById("basic-calc-screen");
    const history = document.getElementById("basic-calc-history");
    if (screen) screen.textContent = this.basicState.display;
    if (history) history.textContent = this.basicState.history;
  },

  /* Calculadora Científica */
  handleInterInput(btn) {
    const num = btn.dataset.num;
    const op = btn.dataset.op;
    const sci = btn.dataset.sci;
    if (num !== undefined) this.inputInterDigit(num);
    else if (op) this.handleInterOperator(op);
    else if (sci) this.handleInterSci(sci);
    this.updateInterDisplay();
  },

  inputInterDigit(digit) {
    const s = this.interState;
    if (s.waitingForSecondOperand) {
      s.display = digit === "." ? "0." : digit;
      s.waitingForSecondOperand = false;
      return;
    }
    if (digit === ".") {
      if (!s.display.includes(".")) s.display += ".";
    } else {
      s.display = s.display === "0" ? digit : s.display + digit;
    }
  },

  handleInterOperator(op) {
    const s = this.interState;
    const currentVal = parseFloat(s.display);

    switch (op) {
      case "clear":
        s.display = "0";
        s.history = "";
        s.firstOperand = null;
        s.operator = null;
        s.waitingForSecondOperand = false;
        break;
      case "backspace":
        s.display = s.display.length > 1 ? s.display.slice(0, -1) : "0";
        break;
      case "plusminus":
        s.display = String(-1 * parseFloat(s.display));
        break;
      case "percent":
        s.display = String(parseFloat(s.display) / 100);
        break;
      case "+":
      case "-":
      case "*":
      case "/":
        if (s.operator && s.waitingForSecondOperand) {
          s.operator = op;
          s.history = `${s.firstOperand} ${op}`;
          return;
        }
        if (s.firstOperand === null) {
          s.firstOperand = currentVal;
        } else if (s.operator) {
          const result = this.calculate(s.firstOperand, currentVal, s.operator);
          s.display = String(this.roundNum(result));
          s.firstOperand = result;
        }
        s.operator = op;
        s.waitingForSecondOperand = true;
        s.history = `${s.firstOperand} ${op}`;
        break;
      case "equals":
        if (s.operator && s.firstOperand !== null) {
          const result = this.calculate(s.firstOperand, currentVal, s.operator);
          s.history = `${s.firstOperand} ${s.operator} ${currentVal} =`;
          s.display = String(this.roundNum(result));
          s.firstOperand = null;
          s.operator = null;
          s.waitingForSecondOperand = false;
        }
        break;
    }
  },

  handleInterSci(fn) {
    const s = this.interState;
    const val = parseFloat(s.display);

    switch (fn) {
      case "deg-rad":
        s.angleMode = s.angleMode === "DEG" ? "RAD" : "DEG";
        const indicator = document.getElementById("inter-angle-mode");
        if (indicator) indicator.textContent = s.angleMode;
        break;
      case "sin": {
        const rad = s.angleMode === "DEG" ? (val * Math.PI) / 180 : val;
        s.history = `sin(${val})`;
        s.display = String(this.roundNum(Math.sin(rad)));
        s.waitingForSecondOperand = true;
        break;
      }
      case "cos": {
        const rad = s.angleMode === "DEG" ? (val * Math.PI) / 180 : val;
        s.history = `cos(${val})`;
        s.display = String(this.roundNum(Math.cos(rad)));
        s.waitingForSecondOperand = true;
        break;
      }
      case "tan": {
        const rad = s.angleMode === "DEG" ? (val * Math.PI) / 180 : val;
        s.history = `tan(${val})`;
        s.display = String(this.roundNum(Math.tan(rad)));
        s.waitingForSecondOperand = true;
        break;
      }
      case "sqrt":
        if (val < 0) s.display = "Error";
        else {
          s.history = `√(${val})`;
          s.display = String(this.roundNum(Math.sqrt(val)));
        }
        s.waitingForSecondOperand = true;
        break;
      case "sq":
        s.history = `sqr(${val})`;
        s.display = String(this.roundNum(Math.pow(val, 2)));
        s.waitingForSecondOperand = true;
        break;
      case "power":
        s.firstOperand = val;
        s.operator = "^";
        s.waitingForSecondOperand = true;
        s.history = `${val} ^`;
        break;
      case "root-y":
        s.firstOperand = val;
        s.operator = "root";
        s.waitingForSecondOperand = true;
        s.history = `${val} yroot`;
        break;
      case "log":
        if (val <= 0) s.display = "Error";
        else {
          s.history = `log(${val})`;
          s.display = String(this.roundNum(Math.log10(val)));
        }
        s.waitingForSecondOperand = true;
        break;
      case "ln":
        if (val <= 0) s.display = "Error";
        else {
          s.history = `ln(${val})`;
          s.display = String(this.roundNum(Math.log(val)));
        }
        s.waitingForSecondOperand = true;
        break;
      case "pi":
        s.display = String(this.roundNum(Math.PI));
        s.waitingForSecondOperand = true;
        break;
      case "e":
        s.display = String(this.roundNum(Math.E));
        s.waitingForSecondOperand = true;
        break;
      case "inv":
        if (val === 0) s.display = "Error";
        else s.display = String(this.roundNum(1 / val));
        s.waitingForSecondOperand = true;
        break;
      case "fact": {
        const n = Math.floor(val);
        if (n < 0 || n > 170) s.display = "Error";
        else {
          let f = 1;
          for (let i = 2; i <= n; i++) f *= i;
          s.history = `${n}!`;
          s.display = String(f);
        }
        s.waitingForSecondOperand = true;
        break;
      }
    }
  },

  updateInterDisplay() {
    const screen = document.getElementById("inter-calc-screen");
    const history = document.getElementById("inter-calc-history");
    if (screen) screen.textContent = this.interState.display;
    if (history) history.textContent = this.interState.history;
  },

  calculate(first, second, op) {
    switch (op) {
      case "+": return first + second;
      case "-": return first - second;
      case "*": return first * second;
      case "/": return second === 0 ? "Error" : first / second;
      case "^": return Math.pow(first, second);
      case "root": return second === 0 ? "Error" : Math.pow(first, 1 / second);
      default: return second;
    }
  },

  roundNum(num) {
    if (typeof num !== "number" || isNaN(num)) return num;
    return Math.round(num * 10000000) / 10000000;
  }
};


/* ==========================================================================
   8.5 GESTOR DE CRONÓMETROS (TimerManager - Total y Por Pregunta)
   ========================================================================== */
const TimerManager = {
  totalSeconds: 0,
  questionSeconds: 0,
  intervalId: null,

  start() {
    this.stop();
    this.totalSeconds = 0;
    this.questionSeconds = 0;
    this.updateUI();
    this.intervalId = setInterval(() => {
      this.totalSeconds++;
      this.questionSeconds++;
      this.updateUI();
    }, 1000);
  },

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  resetQuestionTimer() {
    this.questionSeconds = 0;
    this.updateUI();
  },

  formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    if (h > 0) {
      const hh = String(h).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  },

  updateUI() {
    const totalEl = document.getElementById("timer-total");
    const qEl = document.getElementById("timer-question");
    if (totalEl) totalEl.textContent = this.formatTime(this.totalSeconds);
    if (qEl) qEl.textContent = this.formatTime(this.questionSeconds);
  }
};

/* ==========================================================================
   9. GENERADOR MATEMÁTICO PARAMÉTRICO (QuestionGenerator - 7 Ramas)
   ========================================================================== */
const QuestionGenerator = {
  seqCounter: 1,

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  randNonZero(min, max) {
    let v = 0;
    while (v === 0) v = this.randInt(min, max);
    return v;
  },

  gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  },

  lcm(a, b) {
    return Math.abs(a * b) / this.gcd(a, b);
  },

  formatFrac(num, den) {
    if (den < 0) {
      num = -num;
      den = -den;
    }
    const g = this.gcd(num, den);
    const n = num / g;
    const d = den / g;
    if (d === 1) return `${n}`;
    if (n < 0) return `-\\frac{${Math.abs(n)}}{${d}}`;
    return `\\frac{${n}}{${d}}`;
  },

  signTerm(val, variable = "", isFirst = false) {
    if (val === 0) return "";
    const abs = Math.abs(val);
    const coef = (abs === 1 && variable !== "") ? "" : `${abs}`;
    if (isFirst) {
      return `${val < 0 ? "-" : ""}${coef}${variable}`;
    }
    return `${val < 0 ? "- " : "+ "}${coef}${variable}`;
  },

  buildUniqueOptions(correctLatex, candidateList, fallbackFn) {
    const clean = (s) => `$$${String(s).replace(/^\$\$|\$\$$/g, "").trim()}$$`;
    const correctFormatted = clean(correctLatex);
    const set = new Set([correctFormatted]);
    const options = [correctFormatted];

    for (const cand of candidateList) {
      if (options.length >= 4) break;
      if (cand === undefined || cand === null) continue;
      const formatted = clean(cand);
      if (!set.has(formatted)) {
        set.add(formatted);
        options.push(formatted);
      }
    }

    let step = 1;
    while (options.length < 4) {
      const extra = fallbackFn ? fallbackFn(step) : `${correctLatex} + ${step}`;
      const formatted = clean(extra);
      if (!set.has(formatted)) {
        set.add(formatted);
        options.push(formatted);
      }
      step++;
    }

    return options;
  },

  getTopicName(topicId) {
    const found = TOPICS.find(t => t.id === topicId);
    return found ? found.name : "Matemáticas";
  },

  generate(topic, level, difficulty) {
    const effectiveLevel = (level === "all" || !level)
      ? (difficulty === "sencilla" ? "bachillerato" : this.randChoice(["bachillerato", "licenciatura"]))
      : level;

    const factories = this.getFactories(topic, difficulty);
    const factory = this.randChoice(factories);
    const raw = factory.call(this, effectiveLevel, difficulty);

    return {
      id: `gen-${topic}-${this.seqCounter++}`,
      topic: topic,
      topicName: this.getTopicName(topic),
      level: effectiveLevel,
      difficulty: difficulty,
      calculator: raw.calculator || "none",
      question: raw.question,
      options: raw.options,
      correctIndex: 0,
      explanation: raw.explanation
    };
  },

  getFactories(topic, difficulty) {
    const map = {
      aritmetica: {
        sencilla: [this.ariFraccionesSuma, this.ariPotenciasLeyes, this.ariPorcentajeDirecto],
        media: [this.ariDescuentoImpuesto, this.ariMcdCuerdas, this.ariFraccionProductoDiv],
        alta: [this.ariMcmCampanas, this.ariFraccionCompleja, this.ariProporcionObreros]
      },
      algebra: {
        sencilla: [this.algEcuacionLineal, this.algBinomioCuadrado, this.algBinomiosConjugados],
        media: [this.algFactorizacionTrinomio, this.algEcuacionCuadratica, this.algFactorizacionAc],
        alta: [this.algSistema2x2, this.algEcuacionRacional, this.algSumaRaicesVieta]
      },
      geometria_euclidiana: {
        sencilla: [this.geoPitagoras, this.geoAngulosSuplementarios, this.geoAreaTriangulo],
        media: [this.geoPoligonoAngulos, this.geoVolumenCilindro, this.geoSemejanzaTales],
        alta: [this.geoAreaTrapecioIsosceles, this.geoVolumenConoPitagoras, this.geoDiagonalInscritaCirculo]
      },
      trigonometria: {
        sencilla: [this.trigRazonTriangulo, this.trigAngulosNotables, this.trigConversionRadianes],
        media: [this.trigIdentidadPitagorica, this.trigAlturaSombraElevacion, this.trigIdentidadSecTan],
        alta: [this.trigLeyCosenos, this.trigLeySenos, this.trigEcuacionTrigonometrica]
      },
      geometria_analitica: {
        sencilla: [this.geoanDistanciaPuntos, this.geoanPuntoMedio, this.geoanPendienteRecta],
        media: [this.geoanEcuacionRecta, this.geoanParabolaFoco, this.geoanCircunferenciaCanonica],
        alta: [this.geoanCircunferenciaGeneral, this.geoanElipseElementos, this.geoanParabolaVerticeGeneral]
      },
      funciones: {
        sencilla: [this.funcDominioRacional, this.funcEvaluacionPolinomio, this.funcLimiteDeterminado],
        media: [this.funcComposicionEval, this.funcDominioRadical, this.funcRangoCuadratica],
        alta: [this.funcInversaRacional, this.funcLimiteIndeterminadoFactor, this.funcLimiteIndeterminadoRadical]
      },
      calculo_diferencial: {
        sencilla: [this.calcDerivadaPolinomio, this.calcLimiteDiferenciaCuadrados, this.calcDerivadaRaizPotencia],
        media: [this.calcReglaCadenaPotencia, this.calcDerivadaTrigonometrica, this.calcReglaProducto],
        alta: [this.calcReglaCociente, this.calcMaximosMinimos, this.calcPuntoInflexion]
      }
    };

    const topicGroup = map[topic] || map.algebra;
    return topicGroup[difficulty] || topicGroup.media;
  },

  /* ==================== 1. ARITMÉTICA ==================== */
  ariFraccionesSuma() {
    const dens = [2, 3, 4, 5, 6, 8, 9, 10, 12];
    const b = this.randChoice(dens);
    let d = this.randChoice(dens);
    if (b === d) d = b + 2;
    const f = this.randChoice([2, 3, 4, 5, 6]);
    const a = this.randInt(1, b - 1);
    const c = this.randInt(1, d - 1);
    const e = this.randInt(1, f - 1);

    const common = this.lcm(this.lcm(b, d), f);
    const n1 = a * (common / b);
    const n2 = c * (common / d);
    const n3 = e * (common / f);
    const totalNum = n1 + n2 - n3;

    const correct = this.formatFrac(totalNum, common);
    const d1 = this.formatFrac(n1 + n2 + n3, common);
    const d2 = this.formatFrac(totalNum + 2, common);
    const d3 = this.formatFrac(a + c - e, b + d - f || 5);

    return {
      calculator: "none",
      question: `Calcula el resultado de simplificar la siguiente operación con fracciones:\n$$\\frac{${a}}{${b}} + \\frac{${c}}{${d}} - \\frac{${e}}{${f}}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => this.formatFrac(totalNum + k, common)),
      explanation: `El mínimo común múltiplo de los denominadores $${b}$, $${d}$ y $${f}$ es $\\text{mcm}(${b}, ${d}, ${f}) = ${common}$. Convirtiendo a denominador común: $$\\frac{${a}}{${b}} + \\frac{${c}}{${d}} - \\frac{${e}}{${f}} = \\frac{${n1} + ${n2} - ${n3}}{${common}} = \\frac{${totalNum}}{${common}} = ${correct}$$`
    };
  },

  ariPotenciasLeyes() {
    const base = this.randChoice([2, 3, 4, 5]);
    const m = this.randInt(4, 8);
    const n = this.randInt(2, 5);
    const expSub = base === 2 ? this.randInt(1, 5) : this.randInt(1, 3);
    const p = m + n - expSub;
    const val = Math.pow(base, expSub);

    const correct = `${val}`;
    const d1 = `${Math.pow(base, expSub + 1)}`;
    const d2 = `${Math.pow(base, Math.max(1, expSub - 1))}`;
    const d3 = `${base * expSub}`;

    return {
      calculator: "none",
      question: `Simplifica y calcula el valor numérico aplicando leyes de los exponentes:\n$$\\frac{${base}^{${m}} \\cdot ${base}^{${n}}}{${base}^{${p}}}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `${val + k * base}`),
      explanation: `Aplicando las leyes de los exponentes $\\frac{a^m \\cdot a^n}{a^p} = a^{m + n - p}$: $$\\frac{${base}^{${m}} \\cdot ${base}^{${n}}}{${base}^{${p}}} = ${base}^{${m} + ${n} - ${p}} = ${base}^{${expSub}} = ${val}$$`
    };
  },

  ariPorcentajeDirecto() {
    const pct = this.randChoice([12, 15, 18, 20, 24, 25, 30, 35, 40, 45]);
    const base = this.randInt(3, 18) * 20;
    const ans = (pct * base) / 100;

    return {
      calculator: "basic",
      question: `Calcula el $${pct}\\%$ de la cantidad $${base}$:`,
      options: this.buildUniqueOptions(`${ans}`, [`${ans + 12}`, `${Math.round(base - ans)}`, `${ans * 2}`], (k) => `${ans + k * 5}`),
      explanation: `Para obtener el $${pct}\\%$ de $${base}$, multiplicamos por la fracción decimal equivalente $\\frac{${pct}}{100}$: $$${base} \\times \\frac{${pct}}{100} = \\frac{${base * pct}}{100} = ${ans}$$`
    };
  },

  ariDescuentoImpuesto() {
    const price = this.randInt(6, 25) * 100;
    const desc = this.randChoice([10, 15, 20, 25, 30]);
    const iva = this.randChoice([10, 15, 16, 20]);
    const discounted = price * (1 - desc / 100);
    const finalPrice = (discounted * (1 + iva / 100)).toFixed(2);

    const wrong1 = (price * (1 + (iva - desc) / 100)).toFixed(2);
    const wrong2 = discounted.toFixed(2);
    const wrong3 = (discounted * (1 + (iva + 5) / 100)).toFixed(2);

    return {
      calculator: "basic",
      question: `Un artículo tiene un precio de lista de $\\$${price}\\text{ pesos}$. Si se le aplica un descuento del $${desc}\\%$ y posteriormente un impuesto del $${iva}\\%$ sobre el precio con descuento, ¿cuál es el precio final a pagar?`,
      options: this.buildUniqueOptions(
        `\\$${finalPrice}\\text{ pesos}`,
        [`\\$${wrong1}\\text{ pesos}`, `\\$${wrong2}\\text{ pesos}`, `\\$${wrong3}\\text{ pesos}`],
        (k) => `\\$${(parseFloat(finalPrice) + k * 15).toFixed(2)}\\text{ pesos}`
      ),
      explanation: `Calculamos primero el precio con el $${desc}\\%$ de descuento: $$P_{\\text{desc}} = ${price} \\times (1 - 0.${desc}) = ${discounted.toFixed(2)}$$ Ahora aplicamos el $${iva}\\%$ de impuesto: $$P_{\\text{final}} = ${discounted.toFixed(2)} \\times 1.${iva} = \\$${finalPrice}\\text{ pesos}$$`
    };
  },

  ariMcdCuerdas() {
    const g = this.randChoice([6, 8, 12, 14, 15, 16, 18, 20, 24, 25, 30]);
    const pairs = [[3, 4], [3, 5], [4, 5], [4, 7], [5, 6], [5, 7], [5, 8], [6, 7], [7, 9]];
    const [k1, k2] = this.randChoice(pairs);
    const L1 = g * k1;
    const L2 = g * k2;

    return {
      calculator: "none",
      question: `Se desean cortar dos listones de longitudes $${L1}\\text{ m}$ y $${L2}\\text{ m}$ en trozos de igual longitud, siendo esta la mayor posible sin desperdiciar material. ¿Cuál debe ser la longitud de cada trozo?`,
      options: this.buildUniqueOptions(`${g}\\text{ m}`, [`${g / 2}\\text{ m}`, `${g * 2}\\text{ m}`, `${k1 * k2}\\text{ m}`], (k) => `${g + k * 3}\\text{ m}`),
      explanation: `El problema requiere calcular el Máximo Común Divisor de $${L1}$ y $${L2}$. Como $${L1} = ${g} \\times ${k1}$ y $${L2} = ${g} \\times ${k2}$ con $\\text{mcd}(${k1}, ${k2}) = 1$: $$\\text{MCD}(${L1}, ${L2}) = ${g}\\text{ m}$$`
    };
  },

  ariFraccionProductoDiv() {
    const a = this.randInt(2, 7);
    const b = this.randInt(3, 9);
    const c = this.randInt(2, 8);
    const d = this.randInt(3, 9);
    const e = this.randInt(2, 7);
    const f = this.randInt(3, 8);

    const num = a * c * f;
    const den = b * d * e;
    const correct = this.formatFrac(num, den);
    const d1 = this.formatFrac(a * c * e, b * d * f);
    const d2 = this.formatFrac(num + den, den);
    const d3 = this.formatFrac(den, num);

    return {
      calculator: "none",
      question: `Realiza la siguiente operación combinada de producto y división de fracciones y simplifica al máximo:\n$$\\left(\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}\\right) \\div \\frac{${e}}{${f}}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => this.formatFrac(num + k, den)),
      explanation: `Multiplicamos las dos primeras fracciones y luego multiplicamos por el recíproco del divisor: $$\\frac{${a} \\cdot ${c}}{${b} \\cdot ${d}} \\times \\frac{${f}}{${e}} = \\frac{${a * c} \\cdot ${f}}{${b * d} \\cdot ${e}} = \\frac{${num}}{${den}} = ${correct}$$`
    };
  },

  ariMcmCampanas() {
    const sets = [
      [12, 15, 20],
      [15, 20, 30],
      [18, 24, 36],
      [12, 18, 24],
      [20, 24, 30],
      [16, 24, 48],
      [10, 15, 25],
      [14, 21, 42]
    ];
    const [t1, t2, t3] = this.randChoice(sets);
    const m = this.lcm(this.lcm(t1, t2), t3);

    return {
      calculator: "basic",
      question: `Tres rutas de transporte coinciden en una estación cada $${t1}$, $${t2}$ y $${t3}$ minutos respectivamente. Si acaban de salir simultáneamente, ¿dentro de cuántos minutos volverán a coincidir las tres rutas por primera vez?`,
      options: this.buildUniqueOptions(
        `${m}\\text{ min}`,
        [`${m / 2}\\text{ min}`, `${m * 2}\\text{ min}`, `${t1 + t2 + t3}\\text{ min}`],
        (k) => `${m + k * 15}\\text{ min}`
      ),
      explanation: `Calculamos el Mínimo Común Múltiplo de los tres periodos de tiempo: $$\\text{MCM}(${t1}, ${t2}, ${t3}) = ${m}\\text{ minutos}$$ Por lo tanto, volverán a coincidir dentro de $${m}\\text{ min}$.`
    };
  },

  ariFraccionCompleja() {
    const a = this.randInt(1, 4);
    const b = this.randInt(2, 5);
    const c = this.randInt(2, 5);
    const d = this.randInt(2, 5);

    const numTop = a * b + 1;
    const denTop = b;
    const numBot = c * d - 1;
    const denBot = d;

    const finalNum = numTop * denBot;
    const finalDen = denTop * numBot;
    const correct = this.formatFrac(finalNum, finalDen);

    return {
      calculator: "none",
      question: `Calcula el valor simplificado de la fracción compleja:\n$$\\frac{${a} + \\frac{1}{${b}}}{${c} - \\frac{1}{${d}}}$$`,
      options: this.buildUniqueOptions(
        correct,
        [this.formatFrac(finalDen, finalNum), this.formatFrac(numTop * numBot, denTop * denBot), this.formatFrac(finalNum + 2, finalDen)],
        (k) => this.formatFrac(finalNum + k, finalDen)
      ),
      explanation: `Simplificamos numerador y denominador por separado: $$${a} + \\frac{1}{${b}} = \\frac{${numTop}}{${b}}, \\qquad ${c} - \\frac{1}{${d}} = \\frac{${numBot}}{${d}}$$ Aplicando la ley del sándwich (extremos entre medios): $$\\frac{\\frac{${numTop}}{${b}}}{\\frac{${numBot}}{${d}}} = \\frac{${numTop} \\cdot ${d}}{${b} \\cdot ${numBot}} = \\frac{${finalNum}}{${finalDen}} = ${correct}$$`
    };
  },

  ariProporcionObreros() {
    const w1 = this.randInt(3, 8);
    const k = this.randInt(2, 4);
    const w2 = w1 * k;
    const d2 = this.randInt(3, 9);
    const d1 = d2 * k;

    return {
      calculator: "basic",
      question: `En una obra de ingeniería, $${w1}$ trabajadores tardan $${d1}$ días en construir un muro trabajando al mismo ritmo. ¿Cuántos días tardarán $${w2}$ trabajadores en realizar exactamente el mismo trabajo?`,
      options: this.buildUniqueOptions(
        `${d2}\\text{ días}`,
        [`${d1 * k}\\text{ días}`, `${d2 + 3}\\text{ días}`, `${Math.max(1, d2 - 2)}\\text{ días}`],
        (step) => `${d2 + step}\\text{ días}`
      ),
      explanation: `Es una relación de proporcionalidad inversa (a mayor número de trabajadores, menor tiempo requerido): $$w_1 \\cdot d_1 = w_2 \\cdot d_2 \\Rightarrow d_2 = \\frac{${w1} \\times ${d1}}{${w2}} = \\frac{${w1 * d1}}{${w2}} = ${d2}\\text{ días}$$`
    };
  },

  /* ==================== 2. ÁLGEBRA ==================== */
  algEcuacionLineal() {
    const xSol = this.randNonZero(-9, 12);
    const k = this.randInt(2, 5);
    const a = this.randInt(2, 4);
    const b = this.randNonZero(-8, 8);
    const c = this.randInt(1, k * a - 1);
    const leftVal = k * (a * xSol + b);
    const d = leftVal - c * xSol;

    return {
      calculator: "none",
      question: `Encuentra el valor de $x$ que satisface la ecuación lineal:\n$$${k}(${a}x ${this.signTerm(b)}) = ${c}x ${this.signTerm(d)}$$`,
      options: this.buildUniqueOptions(
        `x = ${xSol}`,
        [`x = ${-xSol}`, `x = ${xSol + 2}`, `x = ${xSol - 3}`],
        (step) => `x = ${xSol + step + 2}`
      ),
      explanation: `Desarrollamos el paréntesis en el miembro izquierdo: $$${k * a}x ${this.signTerm(k * b)} = ${c}x ${this.signTerm(d)}$$ Agrupamos términos con $x$ de un lado y constantes del otro: $$${k * a - c}x = ${d - k * b} \\Rightarrow x = \\frac{${d - k * b}}{${k * a - c}} = ${xSol}$$`
    };
  },

  algBinomioCuadrado() {
    const a = this.randInt(2, 7);
    const b = this.randInt(2, 8);
    const isMinus = this.randChoice([true, false]);
    const op = isMinus ? "-" : "+";
    const opp = isMinus ? "+" : "-";

    const a2 = a * a;
    const twoAb = 2 * a * b;
    const b2 = b * b;

    const correct = `${a2}x^2 ${op} ${twoAb}xy + ${b2}y^2`;
    const d1 = `${a2}x^2 ${opp} ${twoAb}xy + ${b2}y^2`;
    const d2 = `${a2}x^2 - ${b2}y^2`;
    const d3 = `${a2}x^2 ${op} ${a * b}xy + ${b2}y^2`;

    return {
      calculator: "none",
      question: `Desarrolla el siguiente producto notable (binomio al cuadrado):\n$$(${a}x ${op} ${b}y)^2$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `${a2}x^2 ${op} ${twoAb + k}xy + ${b2}y^2`),
      explanation: `Aplicando la identidad del binomio al cuadrado $(u ${op} v)^2 = u^2 ${op} 2uv + v^2$: $$(${a}x ${op} ${b}y)^2 = (${a}x)^2 ${op} 2(${a}x)(${b}y) + (${b}y)^2 = ${correct}$$`
    };
  },

  algBinomiosConjugados() {
    const a = this.randInt(2, 9);
    const b = this.randInt(2, 11);
    const exp = this.randChoice([1, 2, 3]);
    const xPart = exp === 1 ? "x" : `x^${exp}`;
    const xSq = `x^${exp * 2}`;

    const correct = `${a * a}${xSq} - ${b * b}`;
    const d1 = `${a * a}${xSq} + ${b * b}`;
    const d2 = `${a * a}${xSq} - ${2 * a * b}${xPart} + ${b * b}`;
    const d3 = `${2 * a}${xSq} - ${2 * b}`;

    return {
      calculator: "none",
      question: `Efectúa el producto de los siguientes binomios conjugados:\n$$(${a}${xPart} + ${b})(${a}${xPart} - ${b})$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `${a * a}${xSq} - ${b * b + k}`),
      explanation: `El producto de dos binomios conjugados $(u + v)(u - v)$ es igual a la diferencia de cuadrados $u^2 - v^2$: $$(${a}${xPart})^2 - (${b})^2 = ${correct}$$`
    };
  },

  algFactorizacionTrinomio() {
    let r1 = this.randNonZero(-9, 9);
    let r2 = this.randNonZero(-9, 9);
    if (r1 === r2) r2 += 2;
    if (r1 + r2 === 0) r2 += 1;

    const B = r1 + r2;
    const C = r1 * r2;

    const f1 = `(x ${this.signTerm(r1)})(x ${this.signTerm(r2)})`;
    const d1 = `(x ${this.signTerm(-r1)})(x ${this.signTerm(-r2)})`;
    const d2 = `(x ${this.signTerm(r1)})(x ${this.signTerm(-r2)})`;
    const d3 = `(x ${this.signTerm(C)})(x ${this.signTerm(B)})`;

    return {
      calculator: "none",
      question: `Factoriza completamente el trinomio cuadrático:\n$$x^2 ${this.signTerm(B, "x")} ${this.signTerm(C)}$$`,
      options: this.buildUniqueOptions(f1, [d1, d2, d3], (k) => `(x ${this.signTerm(r1 + k)})(x ${this.signTerm(r2 - k)})`),
      explanation: `Buscamos dos números enteros que sumados den $${B}$ y multiplicados den $${C}$. Dichos números son $${r1}$ y $${r2}$ porque $(${r1}) + (${r2}) = ${B}$ y $(${r1})(${r2}) = ${C}$. Por tanto: $$x^2 ${this.signTerm(B, "x")} ${this.signTerm(C)} = ${f1}$$`
    };
  },

  algEcuacionCuadratica() {
    const r1 = this.randInt(1, 9);
    const r2 = this.randInt(-9, -1);
    if (r1 + r2 === 0) return this.algEcuacionCuadratica();

    const B = -(r1 + r2);
    const C = r1 * r2;

    const correct = `x_1 = ${r1}, \\quad x_2 = ${r2}`;
    const d1 = `x_1 = ${-r1}, \\quad x_2 = ${-r2}`;
    const d2 = `x_1 = ${r1}, \\quad x_2 = ${-r2}`;
    const d3 = `x_1 = ${r1 + 1}, \\quad x_2 = ${r2 - 1}`;

    return {
      calculator: "none",
      question: `Determina las raíces reales de la ecuación cuadrática:\n$$x^2 ${this.signTerm(B, "x")} ${this.signTerm(C)} = 0$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `x_1 = ${r1 + k}, \\quad x_2 = ${r2}`),
      explanation: `Factorizando el trinomio como producto de factores lineales: $$(x - ${r1})(x + ${Math.abs(r2)}) = 0$$ Igualando cada factor a cero obtenemos las raíces: $$x_1 = ${r1}, \\qquad x_2 = ${r2}$$`
    };
  },

  algFactorizacionAc() {
    const p = this.randChoice([2, 3, 5]);
    const r = this.randChoice([2, 3, 4]);
    const q = this.randNonZero(-5, 5);
    let s = this.randNonZero(-5, 5);
    if (this.gcd(p, q) !== 1 || this.gcd(r, s) !== 1) s = 1;

    const A = p * r;
    const B = p * s + q * r;
    const C = q * s;
    if (B === 0) return this.algFactorizacionAc();

    const correct = `(${p}x ${this.signTerm(q)})(${r}x ${this.signTerm(s)})`;
    const d1 = `(${p}x ${this.signTerm(-q)})(${r}x ${this.signTerm(-s)})`;
    const d2 = `(${p}x ${this.signTerm(s)})(${r}x ${this.signTerm(q)})`;
    const d3 = `(${A}x ${this.signTerm(q)})(x ${this.signTerm(s)})`;

    return {
      calculator: "none",
      question: `¿Cuál es la factorización completa del polinomio de segundo grado?\n$$${A}x^2 ${this.signTerm(B, "x")} ${this.signTerm(C)}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `(${p}x ${this.signTerm(q + k)})(${r}x ${this.signTerm(s)})`),
      explanation: `Descomponiendo el término central $${B}x = ${p * s}x ${this.signTerm(q * r, "x")}$ y factorizando por agrupación: $$${A}x^2 ${this.signTerm(B, "x")} ${this.signTerm(C)} = ${correct}$$`
    };
  },

  algSistema2x2() {
    const x = this.randNonZero(-5, 6);
    const y = this.randNonZero(-5, 6);
    const a1 = this.randInt(2, 6);
    const b1 = this.randInt(1, 5);
    const a2 = this.randInt(1, 5);
    const b2 = -this.randInt(2, 6);

    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y;

    const correct = `x = ${x}, \\quad y = ${y}`;
    const d1 = `x = ${y}, \\quad y = ${x}`;
    const d2 = `x = ${-x}, \\quad y = ${-y}`;
    const d3 = `x = ${x + 1}, \\quad y = ${y - 1}`;

    return {
      calculator: "basic",
      question: `Resuelve el siguiente sistema de ecuaciones lineales $2 \\times 2$:\n$$\\begin{cases} ${a1}x ${this.signTerm(b1, "y")} = ${c1} \\\\ ${a2}x ${this.signTerm(b2, "y")} = ${c2} \\end{cases}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `x = ${x + k}, \\quad y = ${y}`),
      explanation: `Aplicando el método de reducción (eliminación): multiplicamos la primera ecuación por $${Math.abs(b2)}$ y la segunda por $${b1}$ para cancelar $y$: $$${a1 * Math.abs(b2) + a2 * b1}x = ${c1 * Math.abs(b2) + c2 * b1} \\Rightarrow x = ${x}$$ Sustituyendo $x = ${x}$ en la primera ecuación: $$${a1}(${x}) ${this.signTerm(b1, "y")} = ${c1} \\Rightarrow y = ${y}$$`
    };
  },

  algEcuacionRacional() {
    const xSol = this.randInt(2, 9);
    const a = this.randInt(1, 5);
    const k = this.randInt(2, 4);
    // (k*x + b) / (x + a) = c
    const c = this.randInt(k + 1, k + 3);
    const b = c * (xSol + a) - k * xSol;

    return {
      calculator: "none",
      question: `Resuelve la ecuación racional para $x \\neq ${-a}$:\n$$\\frac{${k}x ${this.signTerm(b)}}{x + ${a}} = ${c}$$`,
      options: this.buildUniqueOptions(
        `x = ${xSol}`,
        [`x = ${-xSol}`, `x = ${xSol + 3}`, `x = ${xSol - 2}`],
        (step) => `x = ${xSol + step + 3}`
      ),
      explanation: `Multiplicamos ambos lados por el denominador $(x + ${a})$: $$${k}x ${this.signTerm(b)} = ${c}(x + ${a}) = ${c}x + ${c * a}$$ Despejando $x$: $$${b - c * a} = ${c - k}x \\Rightarrow x = \\frac{${b - c * a}}{${c - k}} = ${xSol}$$`
    };
  },

  algSumaRaicesVieta() {
    const a = this.randInt(2, 5);
    const b = this.randNonZero(-15, 15);
    const c = this.randNonZero(-12, 12);

    const sumLatex = this.formatFrac(-b, a);
    const prodLatex = this.formatFrac(c, a);

    const correct = `x_1 + x_2 = ${sumLatex}, \\quad x_1 \\cdot x_2 = ${prodLatex}`;
    const d1 = `x_1 + x_2 = ${this.formatFrac(b, a)}, \\quad x_1 \\cdot x_2 = ${prodLatex}`;
    const d2 = `x_1 + x_2 = ${prodLatex}, \\quad x_1 \\cdot x_2 = ${sumLatex}`;
    const d3 = `x_1 + x_2 = ${this.formatFrac(-b, 1)}, \\quad x_1 \\cdot x_2 = ${this.formatFrac(c, 1)}`;

    return {
      calculator: "none",
      question: `Por las relaciones de Vieta, determina la suma $x_1 + x_2$ y el producto $x_1 \\cdot x_2$ de las raíces de la ecuación:\n$$${a}x^2 ${this.signTerm(b, "x")} ${this.signTerm(c)} = 0$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `x_1 + x_2 = ${this.formatFrac(-b + k, a)}, \\quad x_1 \\cdot x_2 = ${prodLatex}`),
      explanation: `En toda ecuación cuadrática $ax^2 + bx + c = 0$, las fórmulas de Vieta establecen que: $$x_1 + x_2 = -\\frac{b}{a} = ${sumLatex}, \\qquad x_1 \\cdot x_2 = \\frac{c}{a} = ${prodLatex}$$`
    };
  },

  /* ==================== 3. GEOMETRÍA EUCLIDIANA ==================== */
  geoPitagoras() {
    const baseTriples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 40, 41]];
    const [a0, b0, c0] = this.randChoice(baseTriples);
    const k = this.randInt(1, 5);
    const a = a0 * k;
    const b = b0 * k;
    const c = c0 * k;
    const askHyp = this.randChoice([true, false]);

    if (askHyp) {
      return {
        calculator: "basic",
        question: `En un triángulo rectángulo, los catetos miden $a = ${a}\\text{ cm}$ y $b = ${b}\\text{ cm}$. ¿Cuál es la longitud de la hipotenusa $c$?`,
        options: this.buildUniqueOptions(
          `${c}\\text{ cm}`,
          [`${a + b}\\text{ cm}`, `${c + 2}\\text{ cm}`, `\\sqrt{${a + b}}\\text{ cm}`],
          (step) => `${c + step * 3}\\text{ cm}`
        ),
        explanation: `Aplicando el Teorema de Pitágoras $c = \\sqrt{a^2 + b^2}$: $$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${c * c}} = ${c}\\text{ cm}$$`
      };
    } else {
      return {
        calculator: "basic",
        question: `En un triángulo rectángulo, la hipotenusa mide $c = ${c}\\text{ cm}$ y uno de sus catetos mide $a = ${a}\\text{ cm}$. ¿Cuál es la longitud del otro cateto $b$?`,
        options: this.buildUniqueOptions(
          `${b}\\text{ cm}`,
          [`${c - a}\\text{ cm}`, `${b + 3}\\text{ cm}`, `${a + 2}\\text{ cm}`],
          (step) => `${b + step * 2}\\text{ cm}`
        ),
        explanation: `Despejando el cateto del Teorema de Pitágoras $b = \\sqrt{c^2 - a^2}$: $$b = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c} - ${a * a}} = \\sqrt{${b * b}} = ${b}\\text{ cm}$$`
      };
    }
  },

  geoAngulosSuplementarios() {
    const k1 = this.randInt(2, 7);
    const k2 = this.randInt(2, 6);
    const x = this.randInt(8, 18);
    const total = 180;
    const c = total - (k1 + k2) * x;
    const angA = k1 * x + c;
    const angB = k2 * x;

    return {
      calculator: "none",
      question: `Dos ángulos suplementarios miden $\\alpha = (${k1}x ${this.signTerm(c)})^\\circ$ y $\\beta = (${k2}x)^\\circ$. Determina el valor de $x$ y la medida del ángulo $\\beta$:`,
      options: this.buildUniqueOptions(
        `x = ${x}^\\circ, \\quad \\beta = ${angB}^\\circ`,
        [`x = ${x}^\\circ, \\quad \\beta = ${angA}^\\circ`, `x = ${x + 4}^\\circ, \\quad \\beta = ${k2 * (x + 4)}^\\circ`, `x = ${Math.max(2, x - 3)}^\\circ, \\quad \\beta = ${k2 * Math.max(2, x - 3)}^\\circ`],
        (s) => `x = ${x + s}^\\circ, \\quad \\beta = ${angB + s * 2}^\\circ`
      ),
      explanation: `Dos ángulos suplementarios suman $180^\\circ$: $$(${k1}x ${this.signTerm(c)}) + ${k2}x = 180 \\Rightarrow ${k1 + k2}x = ${180 - c} \\Rightarrow x = ${x}^\\circ$$ Por lo tanto, $\\beta = ${k2}(${x}^\\circ) = ${angB}^\\circ$.`
    };
  },

  geoAreaTriangulo() {
    const base = this.randInt(6, 24);
    const height = this.randInt(4, 18);
    const area = (base * height) / 2;

    return {
      calculator: "basic",
      question: `Calcula el área de un triángulo cuya base mide $b = ${base}\\text{ cm}$ y su altura correspondiente es $h = ${height}\\text{ cm}$:`,
      options: this.buildUniqueOptions(
        `${area}\\text{ cm}^2`,
        [`${base * height}\\text{ cm}^2`, `${area + base}\\text{ cm}^2`, `${2 * (base + height)}\\text{ cm}^2`],
        (k) => `${area + k * 4}\\text{ cm}^2`
      ),
      explanation: `Aplicando la fórmula del área del triángulo $A = \\frac{b \\cdot h}{2}$: $$A = \\frac{${base} \\times ${height}}{2} = \\frac{${base * height}}{2} = ${area}\\text{ cm}^2$$`
    };
  },

  geoPoligonoAngulos() {
    const n = this.randInt(5, 18);
    const sum = 180 * (n - 2);
    const interior = sum / n;
    const askSum = n % 2 !== 0 || this.randChoice([true, false]);

    if (askSum || sum % n !== 0) {
      return {
        calculator: "basic",
        question: `¿Cuál es la suma de los ángulos interiores de un polígono convexo de $n = ${n}$ lados?`,
        options: this.buildUniqueOptions(
          `${sum}^\\circ`,
          [`${180 * n}^\\circ`, `${180 * (n - 1)}^\\circ`, `${180 * (n - 3)}^\\circ`],
          (k) => `${sum + k * 90}^\\circ`
        ),
        explanation: `La suma de los ángulos interiores de un polígono de $n$ lados es $S = 180^\\circ(n - 2)$: $$S = 180^\\circ(${n} - 2) = 180^\\circ(${n - 2}) = ${sum}^\\circ$$`
      };
    } else {
      return {
        calculator: "basic",
        question: `¿Cuánto mide cada ángulo interior de un polígono regular de $n = ${n}$ lados?`,
        options: this.buildUniqueOptions(
          `${interior}^\\circ`,
          [`${360 / n}^\\circ`, `${interior + 15}^\\circ`, `${180 - interior}^\\circ`],
          (k) => `${interior + k * 5}^\\circ`
        ),
        explanation: `El ángulo interior de un polígono regular de $n$ lados se calcula mediante $\\alpha = \\frac{180^\\circ(n - 2)}{n}$: $$\\alpha = \\frac{180^\\circ(${n} - 2)}{${n}} = \\frac{${sum}^\\circ}{${n}} = ${interior}^\\circ$$`
      };
    }
  },

  geoVolumenCilindro() {
    const r = this.randInt(2, 11);
    const h = this.randInt(5, 20);
    const vol = r * r * h;

    return {
      calculator: "basic",
      question: `Un cilindro circular recto tiene radio basal $r = ${r}\\text{ cm}$ y altura $h = ${h}\\text{ cm}$. ¿Cuál es su volumen exacto en términos de $\\pi$?`,
      options: this.buildUniqueOptions(
        `${vol}\\pi\\text{ cm}^3`,
        [`${2 * r * h}\\pi\\text{ cm}^3`, `${r * h}\\pi\\text{ cm}^3`, `${vol * 2}\\pi\\text{ cm}^3`],
        (k) => `${vol + k * 10}\\pi\\text{ cm}^3`
      ),
      explanation: `El volumen de un cilindro circular recto es $V = \\pi r^2 h$: $$V = \\pi (${r})^2 (${h}) = \\pi (${r * r})(${h}) = ${vol}\\pi\\text{ cm}^3$$`
    };
  },

  geoSemejanzaTales() {
    const hPoste = this.randInt(2, 6);
    const sPoste = this.randInt(3, 8);
    const k = this.randInt(3, 9);
    const sEdificio = sPoste * k;
    const hEdificio = hPoste * k;

    return {
      calculator: "basic",
      question: `Por semejanza de triángulos (Teorema de Tales), un edificio proyecta una sombra de $${sEdificio}\\text{ m}$ a la misma hora en que un poste vertical de $${hPoste}\\text{ m}$ de altura proyecta una sombra de $${sPoste}\\text{ m}$. ¿Cuál es la altura del edificio?`,
      options: this.buildUniqueOptions(
        `${hEdificio}\\text{ m}`,
        [`${hEdificio + hPoste}\\text{ m}`, `${sEdificio - sPoste}\\text{ m}`, `${hEdificio - 3}\\text{ m}`],
        (step) => `${hEdificio + step * 2}\\text{ m}`
      ),
      explanation: `Establecemos la razón de semejanza entre alturas y sombras: $$\\frac{H}{${sEdificio}} = \\frac{${hPoste}}{${sPoste}} \\Rightarrow H = \\frac{${sEdificio} \\times ${hPoste}}{${sPoste}} = ${k} \\times ${hPoste} = ${hEdificio}\\text{ m}$$`
    };
  },

  geoAreaTrapecioIsosceles() {
    const triples = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]];
    const [p, h, l] = this.randChoice(triples);
    const b = this.randInt(6, 20);
    const B = b + 2 * p;
    const area = ((B + b) * h) / 2;

    return {
      calculator: "intermediate",
      question: `Un trapecio isósceles tiene base mayor $B = ${B}\\text{ cm}$, base menor $b = ${b}\\text{ cm}$ y lados oblicuos de longitud $l = ${l}\\text{ cm}$. ¿Cuál es el área del trapecio?`,
      options: this.buildUniqueOptions(
        `${area}\\text{ cm}^2`,
        [`${((B + b) * l) / 2}\\text{ cm}^2`, `${B * h}\\text{ cm}^2`, `${area - h}\\text{ cm}^2`],
        (k) => `${area + k * 10}\\text{ cm}^2`
      ),
      explanation: `La proyección horizontal de cada lado no paralelo es $p = \\frac{B - b}{2} = \\frac{${B} - ${b}}{2} = ${p}\\text{ cm}$. Por Pitágoras, la altura $h$ mide: $$h = \\sqrt{${l}^2 - ${p}^2} = \\sqrt{${l * l} - ${p * p}} = \\sqrt{${h * h}} = ${h}\\text{ cm}$$ El área es: $$A = \\frac{(B + b) \\cdot h}{2} = \\frac{(${B} + ${b}) \\cdot ${h}}{2} = ${area}\\text{ cm}^2$$`
    };
  },

  geoVolumenConoPitagoras() {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]];
    const [r, h, g] = this.randChoice(triples);
    const vol = (r * r * h) / 3;
    const volLatex = Number.isInteger(vol) ? `${vol}\\pi` : `\\frac{${r * r * h}\\pi}{3}`;

    return {
      calculator: "intermediate",
      question: `Un cono circular recto tiene radio basal $r = ${r}\\text{ cm}$ y generatriz $g = ${g}\\text{ cm}$. Determina su volumen exacto:`,
      options: this.buildUniqueOptions(
        `${volLatex}\\text{ cm}^3`,
        [`${r * r * h}\\pi\\text{ cm}^3`, `${this.formatFrac(r * r * g, 3)}\\pi\\text{ cm}^3`, `${r * h}\\pi\\text{ cm}^3`],
        (k) => `${r * r * h + k}\\pi\\text{ cm}^3`
      ),
      explanation: `Primero calculamos la altura $h$ del cono usando Pitágoras $h = \\sqrt{g^2 - r^2}$: $$h = \\sqrt{${g}^2 - ${r}^2} = \\sqrt{${g * g} - ${r * r}} = ${h}\\text{ cm}$$ El volumen del cono es: $$V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi (${r})^2(${h}) = ${volLatex}\\text{ cm}^3$$`
    };
  },

  geoDiagonalInscritaCirculo() {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]];
    const [w, h, diag] = this.randChoice(triples);
    const r = diag % 2 === 0 ? `${diag / 2}` : `\\frac{${diag}}{2}`;

    return {
      calculator: "basic",
      question: `Un rectángulo de lados $a = ${w}\\text{ cm}$ y $b = ${h}\\text{ cm}$ está inscrito en una circunferencia. ¿Cuál es la longitud del radio $R$ de dicha circunferencia?`,
      options: this.buildUniqueOptions(
        `R = ${r}\\text{ cm}`,
        [`R = ${diag}\\text{ cm}`, `R = ${w + h}\\text{ cm}`, `R = \\frac{${w + h}}{2}\\text{ cm}`],
        (k) => `R = ${diag + k}\\text{ cm}`
      ),
      explanation: `La diagonal $d$ de un rectángulo inscrito coincide con el diámetro $2R$ de la circunferencia: $$d = \\sqrt{${w}^2 + ${h}^2} = \\sqrt{${w * w} + ${h * h}} = ${diag}\\text{ cm}$$ Por lo tanto, el radio es la mitad de la diagonal: $$R = \\frac{d}{2} = ${r}\\text{ cm}$$`
    };
  },

  /* ==================== 4. TRIGONOMÉTRICA ==================== */
  trigRazonTriangulo() {
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 40, 41]];
    const [a, b, c] = this.randChoice(triples);
    const k = this.randInt(1, 3);
    const co = a * k;
    const ca = b * k;
    const hip = c * k;
    const fnType = this.randChoice(["sin", "cos", "tan"]);

    let fnLatex = "\\sin(\\theta)";
    let correct = this.formatFrac(co, hip);
    let formulaDesc = `\\frac{\\text{Cateto Opuesto}}{\\text{Hipotenusa}} = \\frac{${co}}{${hip}}`;

    if (fnType === "cos") {
      fnLatex = "\\cos(\\theta)";
      correct = this.formatFrac(ca, hip);
      formulaDesc = `\\frac{\\text{Cateto Adyacente}}{\\text{Hipotenusa}} = \\frac{${ca}}{${hip}}`;
    } else if (fnType === "tan") {
      fnLatex = "\\tan(\\theta)";
      correct = this.formatFrac(co, ca);
      formulaDesc = `\\frac{\\text{Cateto Opuesto}}{\\text{Cateto Adyacente}} = \\frac{${co}}{${ca}}`;
    }

    return {
      calculator: "none",
      question: `En un triángulo rectángulo, el cateto opuesto al ángulo $\\theta$ mide $${co}\\text{ cm}$ y el cateto adyacente mide $${ca}\\text{ cm}$. Determina el valor exacto de $${fnLatex}$:`,
      options: this.buildUniqueOptions(
        correct,
        [this.formatFrac(ca, hip), this.formatFrac(co, hip), this.formatFrac(ca, co), this.formatFrac(hip, co)],
        (s) => this.formatFrac(co + s, hip)
      ),
      explanation: `Por el Teorema de Pitágoras, la hipotenusa mide $h = \\sqrt{${co}^2 + ${ca}^2} = ${hip}\\text{ cm}$. Aplicando la definición trigonométrica: $$${fnLatex} = ${formulaDesc} = ${correct}$$`
    };
  },

  trigAngulosNotables() {
    const a = this.randInt(2, 9);
    const b = this.randInt(2, 9);
    const variant = this.randChoice([1, 2, 3]);

    if (variant === 1) {
      const ans = a + b;
      return {
        calculator: "none",
        question: `Calcula el valor numérico exacto de la expresión:\n$$E = ${2 * a}\\sin(30^\\circ) + ${2 * b}\\cos(60^\\circ)$$`,
        options: this.buildUniqueOptions(`${ans}`, [`${2 * ans}`, `${Math.abs(a - b)}`, `${ans}\\sqrt{3}`], (k) => `${ans + k}`),
        explanation: `Sustituyendo los valores notables $\\sin(30^\\circ) = \\frac{1}{2}$ y $\\cos(60^\\circ) = \\frac{1}{2}$: $$E = ${2 * a}\\left(\\frac{1}{2}\\right) + ${2 * b}\\left(\\frac{1}{2}\\right) = ${a} + ${b} = ${ans}$$`
      };
    } else if (variant === 2) {
      const ans = a + 3 * b;
      return {
        calculator: "none",
        question: `Evalúa exactamente la expresión trigonométrica:\n$$E = ${a}\\tan(45^\\circ) + ${b}\\tan^2(60^\\circ)$$`,
        options: this.buildUniqueOptions(`${ans}`, [`${a + b}`, `${3 * a + b}`, `${a + 2 * b}`], (k) => `${ans + k * 2}`),
        explanation: `Como $\\tan(45^\\circ) = 1$ y $\\tan(60^\\circ) = \\sqrt{3}$: $$E = ${a}(1) + ${b}(\\sqrt{3})^2 = ${a} + ${b}(3) = ${ans}$$`
      };
    } else {
      const ans = a + b;
      return {
        calculator: "none",
        question: `Simplifica el valor exacto de:\n$$E = ${2 * a}\\sin^2(45^\\circ) + ${b}\\cos(0^\\circ)$$`,
        options: this.buildUniqueOptions(`${ans}`, [`${2 * a + b}`, `${a}`, `${2 * (a + b)}`], (k) => `${ans + k}`),
        explanation: `Dado que $\\sin(45^\\circ) = \\frac{\\sqrt{2}}{2} \\Rightarrow \\sin^2(45^\\circ) = \\frac{1}{2}$ y $\\cos(0^\\circ) = 1$: $$E = ${2 * a}\\left(\\frac{1}{2}\\right) + ${b}(1) = ${a} + ${b} = ${ans}$$`
      };
    }
  },

  trigConversionRadianes() {
    const deg = this.randChoice([15, 30, 45, 60, 75, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]);
    const g = this.gcd(deg, 180);
    const num = deg / g;
    const den = 180 / g;
    const radLatex = den === 1 ? `${num}\\pi` : `\\frac{${num === 1 ? "" : num}\\pi}{${den}}`;

    return {
      calculator: "none",
      question: `Convierte el ángulo de $${deg}^\\circ$ a radianes en su forma exacta simplificada:`,
      options: this.buildUniqueOptions(
        `${radLatex}\\text{ rad}`,
        [`\\frac{${num + 1}\\pi}{${den}}\\text{ rad}`, `\\frac{${den}\\pi}{${num}}\\text{ rad}`, `\\frac{${num}\\pi}{${den * 2}}\\text{ rad}`],
        (k) => `\\frac{${num + k}\\pi}{${den}}\\text{ rad}`
      ),
      explanation: `Multiplicamos los grados por el factor de conversión $\\frac{\\pi}{180^\\circ}$: $$${deg}^\\circ \\times \\frac{\\pi}{180^\\circ} = \\frac{${deg}\\pi}{180} = ${radLatex}\\text{ rad}$$`
    };
  },

  trigIdentidadPitagorica() {
    const k = this.randInt(2, 12);
    const m = this.randInt(1, 9);
    const total = k + m;

    return {
      calculator: "none",
      question: `Simplifica la expresión trigonométrica utilizando identidades pitagóricas:\n$$E = ${k}\\sin^2(x) + ${k}\\cos^2(x) + ${m}$$`,
      options: this.buildUniqueOptions(
        `${total}`,
        [`${k}`, `${k * m}`, `${k}\\tan^2(x) + ${m}`],
        (s) => `${total + s}`
      ),
      explanation: `Factorizando $${k}$ en los dos primeros términos y aplicando la identidad pitagórica $\\sin^2(x) + \\cos^2(x) = 1$: $$E = ${k}(\\sin^2(x) + \\cos^2(x)) + ${m} = ${k}(1) + ${m} = ${total}$$`
    };
  },

  trigAlturaSombraElevacion() {
    const d = this.randInt(4, 25) * 3;
    const angle = this.randChoice([30, 45, 60]);

    let correct = `${d}\\text{ m}`;
    let expStep = `\\tan(45^\\circ) = 1 \\Rightarrow h = ${d}(1) = ${d}\\text{ m}`;
    if (angle === 60) {
      correct = `${d}\\sqrt{3}\\text{ m}`;
      expStep = `\\tan(60^\\circ) = \\sqrt{3} \\Rightarrow h = ${d}\\sqrt{3}\\text{ m}`;
    } else if (angle === 30) {
      correct = `${d / 3}\\sqrt{3}\\text{ m}`;
      expStep = `\\tan(30^\\circ) = \\frac{\\sqrt{3}}{3} \\Rightarrow h = ${d} \\cdot \\frac{\\sqrt{3}}{3} = ${d / 3}\\sqrt{3}\\text{ m}`;
    }

    return {
      calculator: "intermediate",
      question: `Desde un punto en el suelo situado a $${d}\\text{ m}$ de la base de una torre, el ángulo de elevación hacia la cúspide es de $${angle}^\\circ$. ¿Cuál es la altura exacta $h$ de la torre?`,
      options: this.buildUniqueOptions(
        correct,
        [`${d}\\sqrt{2}\\text{ m}`, `${d / 2}\\text{ m}`, `${2 * d}\\text{ m}`, `${d}\\sqrt{3}\\text{ m}`],
        (k) => `${d + k * 3}\\text{ m}`
      ),
      explanation: `Como $\\tan(\\theta) = \\frac{h}{d}$, despejamos $h = d \\cdot \\tan(${angle}^\\circ)$: $$${expStep}$$`
    };
  },

  trigIdentidadSecTan() {
    const k = this.randInt(3, 15);
    return {
      calculator: "none",
      question: `Reduce la siguiente expresión mediante identidades trigonométricas fundamentales:\n$$\\frac{${k}\\sec^2(x) - ${k}\\tan^2(x)}{\\sin^2(x) + \\cos^2(x)}$$`,
      options: this.buildUniqueOptions(
        `${k}`,
        [`1`, `${k}\\sec(x)`, `${k}\\cot^2(x)`],
        (s) => `${k + s}`
      ),
      explanation: `Usamos las identidades $\\sec^2(x) - \\tan^2(x) = 1$ en el numerador y $\\sin^2(x) + \\cos^2(x) = 1$ en el denominador: $$\\frac{${k}(\\sec^2(x) - \\tan^2(x))}{1} = \\frac{${k}(1)}{1} = ${k}$$`
    };
  },

  trigLeyCosenos() {
    const a = this.randInt(4, 12);
    const b = this.randInt(4, 12);
    const c2 = a * a + b * b - a * b; // para C = 60°, cos(60°) = 1/2 -> 2ab*cos(60) = ab
    const rootInt = Math.round(Math.sqrt(c2));
    const cLatex = rootInt * rootInt === c2 ? `${rootInt}\\text{ cm}` : `\\sqrt{${c2}}\\text{ cm}`;

    return {
      calculator: "intermediate",
      question: `En un triángulo oblicuángulo, dos de sus lados miden $a = ${a}\\text{ cm}$ y $b = ${b}\\text{ cm}$, y el ángulo comprendido entre ellos es $C = 60^\\circ$. Aplicando la ley de cosenos, ¿cuál es la longitud del tercer lado $c$?`,
      options: this.buildUniqueOptions(
        cLatex,
        [`\\sqrt{${a * a + b * b}}\\text{ cm}`, `\\sqrt{${a * a + b * b + a * b}}\\text{ cm}`, `${a + b - 2}\\text{ cm}`],
        (k) => `\\sqrt{${c2 + k * 5}}\\text{ cm}`
      ),
      explanation: `Por la Ley de los Cosenos $c^2 = a^2 + b^2 - 2ab\\cos(C)$, con $\\cos(60^\\circ) = \\frac{1}{2}$: $$c^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\\left(\\frac{1}{2}\\right) = ${a * a} + ${b * b} - ${a * b} = ${c2}$$ Extrayendo raíz cuadrada: $c = ${cLatex}$.`
    };
  },

  trigLeySenos() {
    const a = this.randInt(4, 16) * 2;
    const angleB = this.randChoice([45, 60]);
    const bLatex = angleB === 45 ? `${a}\\sqrt{2}\\text{ cm}` : `${a}\\sqrt{3}\\text{ cm}`;
    const sinBLatex = angleB === 45 ? `\\frac{\\sqrt{2}}{2}` : `\\frac{\\sqrt{3}}{2}`;

    return {
      calculator: "intermediate",
      question: `En un triángulo $ABC$, se conocen los ángulos $A = 30^\\circ$, $B = ${angleB}^\\circ$ y el lado opuesto $a = ${a}\\text{ cm}$. Aplicando la ley de senos, determina la medida exacta del lado $b$:`,
      options: this.buildUniqueOptions(
        bLatex,
        [`${a / 2}\\sqrt{2}\\text{ cm}`, `${a / 2}\\sqrt{3}\\text{ cm}`, `${2 * a}\\text{ cm}`, `${a}\\text{ cm}`],
        (k) => `${a + k}\\sqrt{2}\\text{ cm}`
      ),
      explanation: `Por la Ley de los Senos $\\frac{b}{\\sin(B)} = \\frac{a}{\\sin(A)}$: $$b = \\frac{${a} \\cdot \\sin(${angleB}^\\circ)}{\\sin(30^\\circ)} = \\frac{${a} \\cdot ${sinBLatex}}{\\frac{1}{2}} = ${bLatex}$$`
    };
  },

  trigEcuacionTrigonometrica() {
    const cases = [
      { eq: "2\\sin(x) - 1 = 0", sol: "x = 30^\\circ", step: "\\sin(x) = \\frac{1}{2} \\Rightarrow x = 30^\\circ" },
      { eq: "2\\cos(x) - \\sqrt{3} = 0", sol: "x = 30^\\circ", step: "\\cos(x) = \\frac{\\sqrt{3}}{2} \\Rightarrow x = 30^\\circ" },
      { eq: "2\\cos(x) - 1 = 0", sol: "x = 60^\\circ", step: "\\cos(x) = \\frac{1}{2} \\Rightarrow x = 60^\\circ" },
      { eq: "2\\sin(x) - \\sqrt{3} = 0", sol: "x = 60^\\circ", step: "\\sin(x) = \\frac{\\sqrt{3}}{2} \\Rightarrow x = 60^\\circ" },
      { eq: "\\sqrt{3}\\tan(x) - 3 = 0", sol: "x = 60^\\circ", step: "\\tan(x) = \\sqrt{3} \\Rightarrow x = 60^\\circ" }
    ];
    const item = this.randChoice(cases);
    const k = this.randInt(1, 5);

    return {
      calculator: "none",
      question: `Encuentra la solución en el primer cuadrante ($0^\\circ < x < 90^\\circ$) para la ecuación trigonométrica:\n$$${k}(${item.eq.replace(" = 0", "")}) = 0$$`,
      options: this.buildUniqueOptions(
        item.sol,
        ["x = 45^\\circ", "x = 30^\\circ", "x = 60^\\circ", "x = 15^\\circ", "x = 75^\\circ"],
        (s) => `x = ${15 * s}^\\circ`
      ),
      explanation: `Dividiendo entre $${k}$ y despejando la razón trigonométrica en el primer cuadrante: $$${item.step}$$`
    };
  },

  /* ==================== 5. GEOMETRÍA ANALÍTICA ==================== */
  geoanDistanciaPuntos() {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
    const [dx, dy, d] = this.randChoice(triples);
    const x1 = this.randInt(-6, 6);
    const y1 = this.randInt(-6, 6);
    const x2 = x1 + dx;
    const y2 = y1 + dy;

    return {
      calculator: "basic",
      question: `Calcula la distancia euclidiana entre los puntos $A(${x1}, ${y1})$ y $B(${x2}, ${y2})$ en el plano cartesiano:`,
      options: this.buildUniqueOptions(
        `${d}`,
        [`${dx + dy}`, `\\sqrt{${dx + dy}}`, `${d + 2}`],
        (k) => `${d + k * 2}`
      ),
      explanation: `Usando la fórmula de distancia entre dos puntos $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$: $$d = \\sqrt{(${x2} - (${x1}))^2 + (${y2} - (${y1}))^2} = \\sqrt{${dx}^2 + ${dy}^2} = \\sqrt{${dx * dx + dy * dy}} = ${d}$$`
    };
  },

  geoanPuntoMedio() {
    const xm = this.randInt(-7, 7);
    const ym = this.randInt(-7, 7);
    const dx = this.randInt(1, 6);
    const dy = this.randInt(1, 6);
    const x1 = xm - dx;
    const x2 = xm + dx;
    const y1 = ym - dy;
    const y2 = ym + dy;

    return {
      calculator: "none",
      question: `Determina las coordenadas del punto medio $M$ del segmento cuyos extremos son $P_1(${x1}, ${y1})$ y $P_2(${x2}, ${y2})$:`,
      options: this.buildUniqueOptions(
        `M(${xm}, ${ym})`,
        [`M(${dx}, ${dy})`, `M(${xm * 2}, ${ym * 2})`, `M(${ym}, ${xm})`],
        (k) => `M(${xm + k}, ${ym - k})`
      ),
      explanation: `Las coordenadas del punto medio se obtienen promediando abscisas y ordenadas: $$x_m = \\frac{${x1} + (${x2})}{2} = ${xm}, \\qquad y_m = \\frac{${y1} + (${y2})}{2} = ${ym}$$ Por tanto, el punto medio es $M(${xm}, ${ym})$-`
    };
  },

  geoanPendienteRecta() {
    const x1 = this.randInt(-5, 4);
    const y1 = this.randInt(-5, 4);
    const dx = this.randInt(2, 7);
    const dy = this.randNonZero(-8, 8);
    const x2 = x1 + dx;
    const y2 = y1 + dy;

    const mLatex = this.formatFrac(dy, dx);

    return {
      calculator: "none",
      question: `Calcula la pendiente $m$ de la recta que pasa por los puntos $A(${x1}, ${y1})$ y $B(${x2}, ${y2})$:`,
      options: this.buildUniqueOptions(
        `m = ${mLatex}`,
        [`m = ${this.formatFrac(-dy, dx)}`, `m = ${this.formatFrac(dx, dy)}`, `m = ${this.formatFrac(dy + 2, dx)}`],
        (k) => `m = ${this.formatFrac(dy + k, dx)}`
      ),
      explanation: `Aplicando la fórmula de la pendiente $m = \\frac{y_2 - y_1}{x_2 - x_1}$: $$m = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = \\frac{${dy}}{${dx}} = ${mLatex}$$`
    };
  },

  geoanEcuacionRecta() {
    const m = this.randNonZero(-5, 5);
    const x1 = this.randNonZero(-5, 5);
    const y1 = this.randNonZero(-5, 5);
    const b = y1 - m * x1;

    const correct = `y = ${this.signTerm(m, "x", true)} ${this.signTerm(b)}`;
    const d1 = `y = ${this.signTerm(m, "x", true)} ${this.signTerm(-b)}`;
    const d2 = `y = ${this.signTerm(-m, "x", true)} ${this.signTerm(b)}`;
    const d3 = `y = ${this.signTerm(m, "x", true)} ${this.signTerm(y1 + m * x1)}`;

    return {
      calculator: "none",
      question: `Halla la ecuación ordinaria ($y = mx + b$) de la recta que pasa por el punto $P(${x1}, ${y1})$ y tiene pendiente $m = ${m}$:`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `y = ${this.signTerm(m, "x", true)} ${this.signTerm(b + k)}`),
      explanation: `Utilizando la forma punto-pendiente $y - y_1 = m(x - x_1)$: $$y - (${y1}) = ${m}(x - (${x1})) \\Rightarrow y = ${m}x ${this.signTerm(-m * x1)} ${this.signTerm(y1)} \\Rightarrow ${correct}$$`
    };
  },

  geoanParabolaFoco() {
    const p = this.randNonZero(-7, 7);
    const fourP = 4 * p;
    const isVertical = this.randChoice([true, false]);

    if (isVertical) {
      return {
        calculator: "none",
        question: `Determina las coordenadas del foco $F$ y la ecuación de la directriz de la parábola con vértice en el origen:\n$$x^2 = ${fourP}y$$`,
        options: this.buildUniqueOptions(
          `F(0, ${p}), \\quad y = ${-p}`,
          [`F(${p}, 0), \\quad x = ${-p}`, `F(0, ${-p}), \\quad y = ${p}`, `F(0, ${fourP}), \\quad y = ${-fourP}`],
          (k) => `F(0, ${p + k}), \\quad y = ${-(p + k)}`
        ),
        explanation: `La ecuación es de la forma $x^2 = 4py$. Igualando $4p = ${fourP} \\Rightarrow p = ${p}$. Su foco está en $F(0, p) = F(0, ${p})$ y su directriz es $y = -p \\Rightarrow y = ${-p}$.`
      };
    } else {
      return {
        calculator: "none",
        question: `Determina las coordenadas del foco $F$ y la ecuación de la directriz de la parábola con vértice en el origen:\n$$y^2 = ${fourP}x$$`,
        options: this.buildUniqueOptions(
          `F(${p}, 0), \\quad x = ${-p}`,
          [`F(0, ${p}), \\quad y = ${-p}`, `F(${-p}, 0), \\quad x = ${p}`, `F(${fourP}, 0), \\quad x = ${-fourP}`],
          (k) => `F(${p + k}, 0), \\quad x = ${-(p + k)}`
        ),
        explanation: `La ecuación tiene la forma horizontal $y^2 = 4px$. De $4p = ${fourP}$ obtenemos $p = ${p}$. El foco es $F(p, 0) = F(${p}, 0)$ y la directriz es $x = -p \\Rightarrow x = ${-p}$.`
      };
    }
  },

  geoanCircunferenciaCanonica() {
    const h = this.randNonZero(-7, 7);
    const k = this.randNonZero(-7, 7);
    const r = this.randInt(2, 11);
    const r2 = r * r;

    const eq = `(x ${this.signTerm(-h)})^2 + (y ${this.signTerm(-k)})^2 = ${r2}`;
    const d1 = `(x ${this.signTerm(h)})^2 + (y ${this.signTerm(k)})^2 = ${r2}`;
    const d2 = `(x ${this.signTerm(-h)})^2 + (y ${this.signTerm(-k)})^2 = ${r}`;
    const d3 = `(x ${this.signTerm(h)})^2 + (y ${this.signTerm(-k)})^2 = ${r2}`;

    return {
      calculator: "none",
      question: `¿Cuál es la ecuación ordinaria de la circunferencia con centro en $C(${h}, ${k})$ y radio $r = ${r}$?`,
      options: this.buildUniqueOptions(eq, [d1, d2, d3], (s) => `(x ${this.signTerm(-h)})^2 + (y ${this.signTerm(-k)})^2 = ${r2 + s}`),
      explanation: `Sustituyendo $h = ${h}$, $k = ${k}$ y $r = ${r}$ en la ecuación canónica $(x - h)^2 + (y - k)^2 = r^2$: $$${eq}$$`
    };
  },

  geoanCircunferenciaGeneral() {
    const h = this.randNonZero(-6, 6);
    const k = this.randNonZero(-6, 6);
    const r = this.randInt(2, 9);
    const D = -2 * h;
    const E = -2 * k;
    const F = h * h + k * k - r * r;

    return {
      calculator: "basic",
      question: `Determina el centro $C(h, k)$ y el radio $r$ de la circunferencia cuya ecuación general es:\n$$x^2 + y^2 ${this.signTerm(D, "x")} ${this.signTerm(E, "y")} ${this.signTerm(F)} = 0$$`,
      options: this.buildUniqueOptions(
        `C(${h}, ${k}), \\quad r = ${r}`,
        [`C(${-h}, ${-k}), \\quad r = ${r}`, `C(${h}, ${k}), \\quad r = ${r * r}`, `C(${D}, ${E}), \\quad r = ${r}`],
        (s) => `C(${h}, ${k}), \\quad r = ${r + s}`
      ),
      explanation: `Completando trinomios cuadrados perfectos: $$(x^2 ${this.signTerm(D, "x")} + ${h * h}) + (y^2 ${this.signTerm(E, "y")} + ${k * k}) = ${-F} + ${h * h} + ${k * k}$$ $$(x ${this.signTerm(-h)})^2 + (y ${this.signTerm(-k)})^2 = ${r * r}$$ De donde el centro es $C(${h}, ${k})$ y el radio es $r = \\sqrt{${r * r}} = ${r}$.`
    };
  },

  geoanElipseElementos() {
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
    const [b, c, a] = this.randChoice(triples);
    const a2 = a * a;
    const b2 = b * b;

    return {
      calculator: "none",
      question: `Dada la elipse con centro en el origen:\n$$\\frac{x^2}{${a2}} + \\frac{y^2}{${b2}} = 1$$\nCalcula la longitud de su eje mayor $2a$ y su excentricidad $e = \\frac{c}{a}$:`,
      options: this.buildUniqueOptions(
        `2a = ${2 * a}, \\quad e = ${this.formatFrac(c, a)}`,
        [`2a = ${a}, \\quad e = ${this.formatFrac(c, a)}`, `2a = ${2 * a}, \\quad e = ${this.formatFrac(b, a)}`, `2a = ${2 * b}, \\quad e = ${this.formatFrac(a, c)}`],
        (s) => `2a = ${2 * (a + s)}, \\quad e = ${this.formatFrac(c, a)}`
      ),
      explanation: `Como $a^2 = ${a2} \\Rightarrow a = ${a}$ y $b^2 = ${b2} \\Rightarrow b = ${b}$, el eje mayor mide $2a = ${2 * a}$. La semidistancia focal es: $$c = \\sqrt{a^2 - b^2} = \\sqrt{${a2} - ${b2}} = \\sqrt{${c * c}} = ${c}$$ Por tanto, la excentricidad es $e = \\frac{c}{a} = ${this.formatFrac(c, a)}$.`
    };
  },

  geoanParabolaVerticeGeneral() {
    const h = this.randNonZero(-5, 5);
    const k = this.randNonZero(-5, 5);
    const fourP = this.randChoice([4, 8, 12, -4, -8, -12]);
    // (x - h)^2 = 4p(y - k)
    const eq = `(x ${this.signTerm(-h)})^2 = ${fourP}(y ${this.signTerm(-k)})`;
    const p = fourP / 4;

    return {
      calculator: "none",
      question: `Determina las coordenadas del vértice $V(h,k)$ y del foco $F$ de la parábola:\n$$${eq}$$`,
      options: this.buildUniqueOptions(
        `V(${h}, ${k}), \\quad F(${h}, ${k + p})`,
        [`V(${-h}, ${-k}), \\quad F(${-h}, ${-k + p})`, `V(${h}, ${k}), \\quad F(${h + p}, ${k})`, `V(${k}, ${h}), \\quad F(${k}, ${h + p})`],
        (s) => `V(${h}, ${k}), \\quad F(${h}, ${k + p + s})`
      ),
      explanation: `Comparando con $(x - h)^2 = 4p(y - k)$, el vértice es $V(${h}, ${k})$ y $4p = ${fourP} \\Rightarrow p = ${p}$. Como abre verticalmente, el foco es $F(h, k + p) = F(${h}, ${k + p})$.`
    };
  },

  /* ==================== 6. FUNCIONES Y PRECÁLCULO ==================== */
  funcDominioRacional() {
    const a = this.randInt(2, 6);
    const b = this.randNonZero(-9, 9);
    const c = this.randNonZero(-12, 12);

    return {
      calculator: "none",
      question: `Determina el dominio de la función racional:\n$$f(x) = \\frac{${a}x ${this.signTerm(b)}}{x ${this.signTerm(-c)}}$$`,
      options: this.buildUniqueOptions(
        `\\mathbb{R} \\setminus \\{${c}\\}`,
        [`\\mathbb{R} \\setminus \\{${-c}\\}`, `\\mathbb{R} \\setminus \\left\\{${this.formatFrac(-b, a)}\\right\\}`, `[${c}, \\infty)`],
        (k) => `\\mathbb{R} \\setminus \\{${c + k}\\}`
      ),
      explanation: `El denominador de una función racional no puede ser cero: $$x ${this.signTerm(-c)} = 0 \\Rightarrow x = ${c}$$ Por lo tanto, el dominio es $\\text{Dom}(f) = \\mathbb{R} \\setminus \\{${c}\\}$.`
    };
  },

  funcEvaluacionPolinomio() {
    const a = this.randInt(2, 4);
    const b = this.randNonZero(-6, 6);
    const c = this.randNonZero(-8, 8);
    const x0 = this.randNonZero(-4, 5);
    const val = a * x0 * x0 + b * x0 + c;

    return {
      calculator: "basic",
      question: `Dada la función cuadrática $f(x) = ${a}x^2 ${this.signTerm(b, "x")} ${this.signTerm(c)}$, calcula el valor de $f(${x0})$:`,
      options: this.buildUniqueOptions(
        `${val}`,
        [`${a * x0 * x0 - b * x0 + c}`, `${val + 2 * a}`, `${val - b * x0}`],
        (k) => `${val + k * 3}`
      ),
      explanation: `Sustituyendo $x = ${x0}$ en la regla de correspondencia: $$f(${x0}) = ${a}(${x0})^2 ${this.signTerm(b)}(${x0}) ${this.signTerm(c)} = ${a * x0 * x0} ${this.signTerm(b * x0)} ${this.signTerm(c)} = ${val}$$`
    };
  },

  funcLimiteDeterminado() {
    const a = this.randInt(1, 4);
    const b = this.randNonZero(-5, 5);
    const c = this.randInt(1, 9);
    const x0 = this.randInt(1, 5);
    const val = a * x0 * x0 + b * x0 + c;

    return {
      calculator: "none",
      question: `Calcula el valor del siguiente límite directo:\n$$\\lim_{x \\to ${x0}} (${a}x^2 ${this.signTerm(b, "x")} + ${c})$$`,
      options: this.buildUniqueOptions(
        `${val}`,
        [`${val - c}`, `${val + 2 * x0}`, `${2 * a * x0 + b}`],
        (k) => `${val + k * 2}`
      ),
      explanation: `Por continuidad de las funciones polinomiales, evaluamos por sustitución directa en $x = ${x0}$: $$\\lim_{x \\to ${x0}} (${a}x^2 ${this.signTerm(b, "x")} + ${c}) = ${a}(${x0})^2 ${this.signTerm(b)}(${x0}) + ${c} = ${val}$$`
    };
  },

  funcComposicionEval() {
    const a = this.randInt(2, 4);
    const b = this.randNonZero(-5, 5);
    const c = this.randInt(2, 5);
    const d = this.randNonZero(-6, 6);
    const x0 = this.randInt(-2, 4);

    const gx0 = c * x0 + d;
    const fgx0 = a * gx0 * gx0 + b;
    const gfx0 = c * (a * x0 * x0 + b) + d;

    return {
      calculator: "basic",
      question: `Sean las funciones $f(x) = ${a}x^2 ${this.signTerm(b)}$ y $g(x) = ${c}x ${this.signTerm(d)}$. Determina el valor de la función compuesta $(f \\circ g)(${x0})$:`,
      options: this.buildUniqueOptions(
        `${fgx0}`,
        [`${gfx0}`, `${a * x0 * x0 + b + gx0}`, `${fgx0 - b}`],
        (k) => `${fgx0 + k * 4}`
      ),
      explanation: `Primero evaluamos la función interna $g(${x0})$: $$g(${x0}) = ${c}(${x0}) ${this.signTerm(d)} = ${gx0}$$ Luego evaluamos $f(g(${x0})) = f(${gx0})$: $$f(${gx0}) = ${a}(${gx0})^2 ${this.signTerm(b)} = ${a * gx0 * gx0} ${this.signTerm(b)} = ${fgx0}$$`
    };
  },

  funcDominioRadical() {
    const a = this.randInt(2, 6);
    const k = this.randNonZero(-8, 9);
    const b = -a * k;

    return {
      calculator: "none",
      question: `Determina el dominio en $\\mathbb{R}$ de la función con radical de índice par:\n$$f(x) = \\sqrt{${a}x ${this.signTerm(b)}}$$`,
      options: this.buildUniqueOptions(
        `[${k}, \\infty)`,
        [`(${k}, \\infty)`, `(-\\infty, ${k}]`, `[${-k}, \\infty)`],
        (s) => `[${k + s}, \\infty)`
      ),
      explanation: `El radicando de una raíz cuadrada real no puede ser negativo: $$${a}x ${this.signTerm(b)} \\ge 0 \\Rightarrow ${a}x \\ge ${-b} \\Rightarrow x \\ge ${k}$$ Por lo tanto, el dominio es $[${k}, \\infty)$.`
    };
  },

  funcRangoCuadratica() {
    const a = this.randChoice([1, 2, 3, -1, -2, -3]);
    const h = this.randNonZero(-6, 6);
    const k = this.randNonZero(-8, 8);

    const range = a > 0 ? `[${k}, \\infty)` : `(-\\infty, ${k}]`;
    const wrong1 = a > 0 ? `(-\\infty, ${k}]` : `[${k}, \\infty)`;
    const wrong2 = `[${h}, \\infty)`;
    const wrong3 = `(${k}, \\infty)`;

    return {
      calculator: "none",
      question: `Determina el rango (imagen) de la función cuadrática en forma canónica:\n$$f(x) = ${a === 1 ? "" : a === -1 ? "-" : a}(x ${this.signTerm(-h)})^2 ${this.signTerm(k)}$$`,
      options: this.buildUniqueOptions(range, [wrong1, wrong2, wrong3], (s) => `[${k + s}, \\infty)`),
      explanation: `El vértice de la parábola es $V(${h}, ${k})$. Como el coeficiente principal es $a = ${a} ${a > 0 ? "\\gt 0" : "\\lt 0"}$, la parábola abre hacia ${a > 0 ? "arriba" : "abajo"} y su rango es $${range}$.`
    };
  },

  funcInversaRacional() {
    const a = this.randInt(2, 7);
    const b = this.randInt(1, 9);
    const c = this.randInt(1, 6);
    if (a === c) return this.funcInversaRacional();

    const correct = `f^{-1}(x) = \\frac{${c}x + ${b}}{x - ${a}}`;
    const d1 = `f^{-1}(x) = \\frac{${a}x - ${b}}{x + ${c}}`;
    const d2 = `f^{-1}(x) = \\frac{x - ${c}}{${a}x + ${b}}`;
    const d3 = `f^{-1}(x) = \\frac{${c}x - ${b}}{x + ${a}}`;

    return {
      calculator: "none",
      question: `Determina la función inversa $f^{-1}(x)$ de la función biyectiva:\n$$f(x) = \\frac{${a}x + ${b}}{x - ${c}}, \\quad x \\neq ${c}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `f^{-1}(x) = \\frac{${c + k}x + ${b}}{x - ${a}}`),
      explanation: `Hacemos $y = \\frac{${a}x + ${b}}{x - ${c}}$ y despejamos $x$: $$y(x - ${c}) = ${a}x + ${b} \\Rightarrow xy - ${a}x = ${c}y + ${b} \\Rightarrow x(y - ${a}) = ${c}y + ${b}$$ $$x = \\frac{${c}y + ${b}}{y - ${a}} \\Rightarrow ${correct}$$`
    };
  },

  funcLimiteIndeterminadoFactor() {
    const r1 = this.randNonZero(-7, 8);
    let r2 = this.randNonZero(-7, 8);
    if (r1 === r2 || r1 + r2 === 0) r2 += 2;

    const B = -(r1 + r2);
    const C = r1 * r2;
    const limitVal = r1 - r2;

    return {
      calculator: "none",
      question: `Calcula el siguiente límite indeterminado de la forma $\\frac{0}{0}$:\n$$\\lim_{x \\to ${r1}} \\frac{x^2 ${this.signTerm(B, "x")} ${this.signTerm(C)}}{x ${this.signTerm(-r1)}}$$`,
      options: this.buildUniqueOptions(
        `${limitVal}`,
        [`${r1 + r2}`, `0`, `${-limitVal}`],
        (k) => `${limitVal + k * 2}`
      ),
      explanation: `Al evaluar en $x = ${r1}$ se obtiene la indeterminación $\\frac{0}{0}$. Factorizando el numerador: $$\\lim_{x \\to ${r1}} \\frac{(x ${this.signTerm(-r1)})(x ${this.signTerm(-r2)})}{x ${this.signTerm(-r1)}} = \\lim_{x \\to ${r1}} (x ${this.signTerm(-r2)}) = ${r1} - (${r2}) = ${limitVal}$$`
    };
  },

  funcLimiteIndeterminadoRadical() {
    const k = this.randInt(2, 9);
    const a = k * k;
    const ans = this.formatFrac(1, 2 * k);

    return {
      calculator: "none",
      question: `Evalúa el siguiente límite irracional indeterminado:\n$$\\lim_{x \\to ${a}} \\frac{\\sqrt{x} - ${k}}{x - ${a}}$$`,
      options: this.buildUniqueOptions(
        ans,
        [this.formatFrac(1, k), `${2 * k}`, `0`],
        (s) => this.formatFrac(1, 2 * k + s)
      ),
      explanation: `Racionalizando o factorizando el denominador como diferencia de cuadrados $x - ${a} = (\\sqrt{x} - ${k})(\\sqrt{x} + ${k})$: $$\\lim_{x \\to ${a}} \\frac{\\sqrt{x} - ${k}}{(\\sqrt{x} - ${k})(\\sqrt{x} + ${k})} = \\lim_{x \\to ${a}} \\frac{1}{\\sqrt{x} + ${k}} = \\frac{1}{${k} + ${k}} = ${ans}$$`
    };
  },

  /* ==================== 7. CÁLCULO DIFERENCIAL ==================== */
  calcDerivadaPolinomio() {
    const a = this.randInt(2, 6);
    const n = this.randInt(3, 5);
    const b = this.randNonZero(-7, 7);
    const c = this.randNonZero(-9, 9);
    const d = this.randInt(1, 15);

    const da = a * n;
    const db = b * 2;
    const correct = `f'(x) = ${da}x^${n - 1} ${this.signTerm(db, "x")} ${this.signTerm(c)}`;
    const d1 = `f'(x) = ${da}x^${n} ${this.signTerm(db, "x^2")} ${this.signTerm(c, "x")}`;
    const d2 = `f'(x) = ${a}x^${n - 1} ${this.signTerm(b, "x")} ${this.signTerm(c)}`;
    const d3 = `f'(x) = ${da}x^${n - 1} ${this.signTerm(db, "x")} ${this.signTerm(c)} - ${d}`;

    return {
      calculator: "none",
      question: `Obtén la primera derivada $f'(x)$ de la función polinomial:\n$$f(x) = ${a}x^${n} ${this.signTerm(b, "x^2")} ${this.signTerm(c, "x")} - ${d}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `f'(x) = ${da + k}x^${n - 1} ${this.signTerm(db, "x")} ${this.signTerm(c)}`),
      explanation: `Derivando término a término mediante la regla de la potencia $\\frac{d}{dx}[cx^k] = ckx^{k-1}$ y sabiendo que la derivada de una constante es $0$: $$${correct}$$`
    };
  },

  calcLimiteDiferenciaCuadrados() {
    const a = this.randInt(2, 12);
    const a2 = a * a;
    const ans = 2 * a;

    return {
      calculator: "none",
      question: `Calcula el valor del límite indeterminado:\n$$\\lim_{x \\to ${a}} \\frac{x^2 - ${a2}}{x - ${a}}$$`,
      options: this.buildUniqueOptions(
        `${ans}`,
        [`${a}`, `0`, `${a2}`],
        (k) => `${ans + k * 2}`
      ),
      explanation: `Factorizando la diferencia de cuadrados $x^2 - ${a2} = (x - ${a})(x + ${a})$: $$\\lim_{x \\to ${a}} \\frac{(x - ${a})(x + ${a})}{x - ${a}} = \\lim_{x \\to ${a}} (x + ${a}) = ${a} + ${a} = ${ans}$$`
    };
  },

  calcDerivadaRaizPotencia() {
    const k = this.randInt(2, 9) * 2;
    const m = this.randInt(2, 7);
    const halfK = k / 2;

    const correct = `f'(x) = \\frac{${halfK}}{\\sqrt{x}} - \\frac{${m}}{x^2}`;
    const d1 = `f'(x) = \\frac{${k}}{\\sqrt{x}} + \\frac{${m}}{x^2}`;
    const d2 = `f'(x) = \\frac{${halfK}}{\\sqrt{x}} + \\frac{${m}}{x^2}`;
    const d3 = `f'(x) = ${halfK}\\sqrt{x} - \\frac{${m}}{x^2}`;

    return {
      calculator: "none",
      question: `Determina la primera derivada de la función:\n$$f(x) = ${k}\\sqrt{x} + \\frac{${m}}{x}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (s) => `f'(x) = \\frac{${halfK + s}}{\\sqrt{x}} - \\frac{${m}}{x^2}`),
      explanation: `Reescribiendo con exponentes fraccionarios y negativos $f(x) = ${k}x^{1/2} + ${m}x^{-1}$: $$f'(x) = ${k}\\left(\\frac{1}{2}x^{-1/2}\\right) + ${m}(-1x^{-2}) = \\frac{${halfK}}{\\sqrt{x}} - \\frac{${m}}{x^2}$$`
    };
  },

  calcReglaCadenaPotencia() {
    const a = this.randInt(2, 5);
    const b = this.randNonZero(-7, 7);
    const c = this.randInt(1, 9);
    const n = this.randInt(3, 7);
    const inner = `${a}x^2 ${this.signTerm(b, "x")} + ${c}`;
    const dInner = `${2 * a}x ${this.signTerm(b)}`;

    const correct = `f'(x) = ${n}(${dInner})(${inner})^{${n - 1}}`;
    const d1 = `f'(x) = ${n}(${inner})^{${n - 1}}`;
    const d2 = `f'(x) = (${dInner})(${inner})^{${n - 1}}`;
    const d3 = `f'(x) = ${n}(${dInner})(${inner})^{${n}}`;

    return {
      calculator: "none",
      question: `Aplica la regla de la cadena para hallar la derivada de:\n$$f(x) = (${inner})^{${n}}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `f'(x) = ${n + k}(${dInner})(${inner})^{${n - 1}}`),
      explanation: `Por la regla de la cadena $\\frac{d}{dx}[u^n] = n u^{n-1} \\cdot u'$, con $u = ${inner}$ y $u' = ${dInner}$: $$${correct}$$`
    };
  },

  calcDerivadaTrigonometrica() {
    const a = this.randInt(2, 6);
    const k1 = this.randInt(2, 5);
    const b = this.randInt(2, 6);
    const k2 = this.randInt(2, 5);

    const c1 = a * k1;
    const c2 = b * k2;
    const correct = `f'(x) = ${c1}\\cos(${k1}x) + ${c2}\\sin(${k2}x)`;
    const d1 = `f'(x) = ${c1}\\cos(${k1}x) - ${c2}\\sin(${k2}x)`;
    const d2 = `f'(x) = ${a}\\cos(${k1}x) + ${b}\\sin(${k2}x)`;
    const d3 = `f'(x) = -${c1}\\cos(${k1}x) - ${c2}\\sin(${k2}x)`;

    return {
      calculator: "none",
      question: `Calcula la derivada de la función trigonométrica:\n$$f(x) = ${a}\\sin(${k1}x) - ${b}\\cos(${k2}x)$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (s) => `f'(x) = ${c1 + s}\\cos(${k1}x) + ${c2}\\sin(${k2}x)`),
      explanation: `Aplicando $\\frac{d}{dx}[\\sin(kx)] = k\\cos(kx)$ y $\\frac{d}{dx}[\\cos(kx)] = -k\\sin(kx)$: $$f'(x) = ${a}(${k1}\\cos(${k1}x)) - ${b}(-${k2}\\sin(${k2}x)) = ${c1}\\cos(${k1}x) + ${c2}\\sin(${k2}x)$$`
    };
  },

  calcReglaProducto() {
    const n = this.randInt(2, 5);
    const k = this.randInt(2, 6);

    const correct = `f'(x) = x^${n - 1} e^{${k}x}(${k}x + ${n})`;
    const d1 = `f'(x) = ${n * k}x^${n - 1} e^{${k}x}`;
    const d2 = `f'(x) = x^${n - 1} e^{${k}x}(x + ${n})`;
    const d3 = `f'(x) = x^${n} e^{${k}x}(${k}x - ${n})`;

    return {
      calculator: "none",
      question: `Utilizando la regla del producto, determina la derivada simplificada de:\n$$f(x) = x^${n} e^{${k}x}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (s) => `f'(x) = x^${n - 1} e^{${k}x}(${k}x + ${n + s})`),
      explanation: `Por la regla del producto $(uv)' = u'v + uv'$, con $u = x^${n} \\Rightarrow u' = ${n}x^${n - 1}$ y $v = e^{${k}x} \\Rightarrow v' = ${k}e^{${k}x}$: $$f'(x) = ${n}x^${n - 1}e^{${k}x} + x^${n}(${k}e^{${k}x}) = x^${n - 1} e^{${k}x}(${k}x + ${n})$$`
    };
  },

  calcReglaCociente() {
    const a = this.randInt(2, 6);
    const b = this.randInt(1, 5);
    const c = this.randInt(1, 6);
    const numConst = -a * c - b;

    const correct = `f'(x) = \\frac{${numConst}}{(x - ${c})^2}`;
    const d1 = `f'(x) = \\frac{${a * c + b}}{(x - ${c})^2}`;
    const d2 = `f'(x) = \\frac{${2 * a}x + ${b - a * c}}{(x - ${c})^2}`;
    const d3 = `f'(x) = \\frac{${numConst}}{x - ${c}}`;

    return {
      calculator: "none",
      question: `Aplicando la regla del cociente, halla la derivada de:\n$$f(x) = \\frac{${a}x + ${b}}{x - ${c}}$$`,
      options: this.buildUniqueOptions(correct, [d1, d2, d3], (k) => `f'(x) = \\frac{${numConst - k}}{(x - ${c})^2}`),
      explanation: `Por la regla del cociente $f'(x) = \\frac{u'v - uv'}{v^2}$: $$f'(x) = \\frac{${a}(x - ${c}) - (${a}x + ${b})(1)}{(x - ${c})^2} = \\frac{${a}x - ${a * c} - ${a}x - ${b}}{(x - ${c})^2} = \\frac{${numConst}}{(x - ${c})^2}$$`
    };
  },

  calcMaximosMinimos() {
    const rMin = this.randInt(1, 6);
    const rMax = this.randInt(-5, 0);
    if (rMin === rMax || (rMin + rMax) % 2 !== 0) {
      return this.calcMaximosMinimos();
    }

    const B = -(3 * (rMax + rMin)) / 2;
    const C = 3 * rMax * rMin;
    const D = this.randInt(1, 10);
    const askMin = this.randChoice([true, false]);
    const targetX = askMin ? rMin : rMax;
    const label = askMin ? "mínimo relativo" : "máximo relativo";
    const evalSecondDeriv = 6 * targetX + 2 * B;
    const condLatex = askMin 
      ? `${evalSecondDeriv} \\gt 0 \\Rightarrow \\text{mínimo relativo en } x = ${targetX}`
      : `${evalSecondDeriv} \\lt 0 \\Rightarrow \\text{máximo relativo en } x = ${targetX}`;

    return {
      calculator: "none",
      question: `Determina la abscisa $x$ donde la función cúbica alcanza su ${label}:\n$f(x) = x^3 ${this.signTerm(B, "x^2")} ${this.signTerm(C, "x")} + ${D}$`,
      options: this.buildUniqueOptions(
        `x = ${targetX}`,
        [`x = ${askMin ? rMax : rMin}`, `x = ${-targetX}`, `x = ${(rMin + rMax) / 2}`],
        (k) => `x = ${targetX + k + 2}`
      ),
      explanation: `Derivamos e igualamos a cero para obtener los puntos críticos: $f'(x) = 3x^2 ${this.signTerm(2 * B, "x")} ${this.signTerm(C)} = 3(x ${this.signTerm(-rMax)})(x ${this.signTerm(-rMin)}) = 0$ Los puntos críticos son $x = ${rMax}$ y $x = ${rMin}$. Aplicando el criterio de la segunda derivada $f''(x) = 6x ${this.signTerm(2 * B)}$: $f''(${targetX}) = ${condLatex}$ Por lo tanto, la función alcanza su ${label} en $x = ${targetX}$.`
    };
  },

  calcPuntoInflexion() {
    const x0 = this.randNonZero(-5, 6);
    const B = -3 * x0;
    const C = this.randNonZero(-9, 9);
    const D = this.randInt(1, 10);
    const y0 = x0 * x0 * x0 + B * x0 * x0 + C * x0 + D;

    return {
      calculator: "basic",
      question: `Determina las coordenadas del punto de inflexión de la función:\n$$f(x) = x^3 ${this.signTerm(B, "x^2")} ${this.signTerm(C, "x")} + ${D}$$`,
      options: this.buildUniqueOptions(
        `(${x0}, ${y0})`,
        [`(${-x0}, ${y0})`, `(${x0}, ${D})`, `(${2 * x0}, ${y0})`],
        (k) => `(${x0 + k}, ${y0 - k})`
      ),
      explanation: `Calculamos la primera y segunda derivada: $$f'(x) = 3x^2 ${this.signTerm(2 * B, "x")} ${this.signTerm(C)}, \\qquad f''(x) = 6x ${this.signTerm(2 * B)}$$ Igualamos $f''(x) = 0$: $$6x ${this.signTerm(2 * B)} = 0 \\Rightarrow x = ${x0}$$ Evaluamos en la función original: $$f(${x0}) = (${x0})^3 ${this.signTerm(B)}(${x0})^2 ${this.signTerm(C)}(${x0}) + ${D} = ${y0}$$ Por lo tanto, el punto de inflexión es $(${x0}, ${y0})$-`
    };
  }
};

/* ==========================================================================
   10. MOTOR DE EXÁMENES Y DOBLE ALEATORIZACIÓN FISHER-YATES (ExamEngine)
   ========================================================================== */
const ExamEngine = {
  rawQuestions: [],
  currentExam: {
    title: "",
    topic: "general",
    level: "all",
    targetCount: 15,
    questions: [],
    currentIndex: 0,
    score: 0
  },

  async loadQuestions() {
    try {
      const response = await fetch("questions.json");
      if (response.ok) {
        this.rawQuestions = await response.json();
        return this.rawQuestions;
      }
    } catch (e) {
      console.warn("Entorno local sin HTTP detectado. Utilizando banco integrado.", e);
    }
    // Fallback asegurado
    if (typeof DEFAULT_BANK !== "undefined") {
      this.rawQuestions = DEFAULT_BANK;
    }
    return this.rawQuestions;
  },

  /**
   * Algoritmo Fisher-Yates auténtico
   */
  fisherYates(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  /**
   * Doble Aleatorización: Barajado independiente de las cuatro opciones (A, B, C, D)
   * mapeando exactamente el nuevo índice de la respuesta correcta.
   */
  prepareQuestion(q) {
    const originalOptions = q.options;
    const correctOptionContent = originalOptions[q.correctIndex];

    // Barajado Fisher-Yates de los 4 incisos
    const indices = [0, 1, 2, 3];
    const shuffledIndices = this.fisherYates(indices);
    const shuffledOptions = shuffledIndices.map(idx => originalOptions[idx]);
    const newCorrectIndex = shuffledOptions.indexOf(correctOptionContent);

    return {
      id: q.id,
      topic: q.topic,
      topicName: q.topicName,
      level: q.level,
      difficulty: q.difficulty,
      calculator: q.calculator || "none",
      question: q.question,
      options: shuffledOptions,
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      explanation: q.explanation || "Solución detallada paso a paso.",
      userSelectedIndex: null,
      isAnswered: false,
      isCorrect: false
    };
  },

  normalizeStatement(questionText) {
    return String(questionText || "").replace(/\s+/g, " ").trim();
  },

  /**
   * Crea el examen aplicando:
   * 1. Filtros por rama y nivel (Bachillerato/Licenciatura)
   * 2. Cero repeticiones estrictas usando un Set de enunciados exactos
   * 3. Curva progresiva estricta:
   *    - Reactivos iniciales fáciles (sencilla)
   *    - Intermedios de dificultad media
   *    - Obligatoriamente los últimos 10 a 15 de dificultad alta
   * 4. Doble Fisher-Yates (en preguntas y en incisos)
   */
  createExam(topic = "general", level = "all", requestedCount = 15) {
    let pool = [...this.rawQuestions];

    if (topic !== "general") {
      pool = pool.filter(q => q.topic === topic);
    }
    if (level !== "all") {
      pool = pool.filter(q => q.level === level);
    }

    const targetCount = requestedCount;
    let numHard = 0;
    let numEasy = 0;
    let numMedium = 0;

    if (targetCount >= 30) {
      // Obligatoriamente las últimas 10 a 15 de dificultad alta
      numHard = Math.min(15, Math.max(10, Math.floor(targetCount * 0.30)));
      const remaining = targetCount - numHard;
      numEasy = Math.floor(remaining * 0.45);
      numMedium = remaining - numEasy;
    } else {
      // Para pruebas de 15 reactivos: 5 fáciles, 5 medias y últimas 5 difíciles
      numHard = Math.floor(targetCount / 3);
      numEasy = Math.floor(targetCount / 3);
      numMedium = targetCount - numHard - numEasy;
    }

    // Set estricto para garantizar CERO repeticiones de enunciado en todo el examen
    const usedStatements = new Set();

    const buildTier = (difficulty, neededCount) => {
      const tierQuestions = [];
      const staticCandidates = this.fisherYates(pool.filter(q => q.difficulty === difficulty));

      for (const candidate of staticCandidates) {
        if (tierQuestions.length >= neededCount) break;
        const norm = this.normalizeStatement(candidate.question);
        if (!usedStatements.has(norm)) {
          usedStatements.add(norm);
          tierQuestions.push(candidate);
        }
      }

      const topicIds = topic === "general" ? TOPICS.map(t => t.id) : [topic];
      let attempts = 0;
      const maxAttempts = neededCount * 60 + 300;

      while (tierQuestions.length < neededCount && attempts < maxAttempts) {
        const chosenTopic = topicIds[attempts % topicIds.length];
        const generated = QuestionGenerator.generate(chosenTopic, level, difficulty);
        const norm = this.normalizeStatement(generated.question);

        if (!usedStatements.has(norm)) {
          usedStatements.add(norm);
          tierQuestions.push(generated);
        }
        attempts++;
      }

      return this.fisherYates(tierQuestions);
    };

    const selectedEasy = buildTier("sencilla", numEasy);
    const selectedMedium = buildTier("media", numMedium);
    const selectedHard = buildTier("alta", numHard);

    // Curva Progresiva: Iniciales Fáciles -> Medias -> Finales Difíciles
    const finalQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard].slice(0, targetCount);

    // Segunda aleatorización: barajado independiente de las 4 opciones de cada reactivo
    const preparedQuestions = finalQuestions.map(q => this.prepareQuestion(q));

    this.currentExam = {
      title: topic === "general" ? "Simulacro General de Matemáticas" : (TOPICS.find(t => t.id === topic)?.name || "Examen"),
      topic: topic,
      level: level,
      targetCount: preparedQuestions.length,
      questions: preparedQuestions,
      currentIndex: 0,
      score: 0
    };

    return this.currentExam;
  },

  getCurrentQuestion() {
    return this.currentExam.questions[this.currentExam.currentIndex];
  },

  submitAnswer(selectedIndex) {
    const q = this.getCurrentQuestion();
    if (!q || q.isAnswered) return null;

    q.userSelectedIndex = selectedIndex;
    q.isAnswered = true;
    q.isCorrect = selectedIndex === q.correctIndex;

    if (q.isCorrect) {
      this.currentExam.score += 1;
    }

    return {
      isCorrect: q.isCorrect,
      correctIndex: q.correctIndex,
      explanation: q.explanation
    };
  },

  hasNextQuestion() {
    return this.currentExam.currentIndex < this.currentExam.questions.length - 1;
  },

  nextQuestion() {
    if (this.hasNextQuestion()) {
      this.currentExam.currentIndex += 1;
      return this.getCurrentQuestion();
    }
    return null;
  }
};

/* ==========================================================================
   10. GESTOR DE INTERFAZ DE USUARIO (UIManager)
   ========================================================================== */
const UIManager = {
  activeView: "dashboard",
  selectedLevel: "all",
  generalExamLength: 15,
  topicExamLength: 15,
  selectedOptionIndex: null,
  isExamActive: false,
  pendingExam: null,

  init() {
    this.renderTopicsGrid();
    this.updateStreakUI();
    this.bindEvents();
  },

  renderTopicsGrid() {
    const grid = document.getElementById("topics-grid");
    if (!grid) return;

    grid.innerHTML = TOPICS.map(topic => `
      <div class="topic-card ${topic.colorClass}" data-topic="${topic.id}">
        <div class="topic-card-header">
          <div class="topic-icon-badge">${topic.icon}</div>
          <div class="topic-info">
            <h4>${topic.name}</h4>
            <span>Banco disponible</span>
          </div>
        </div>
        <p class="topic-description">${topic.description}</p>
        <div class="topic-card-footer">
          <span class="selector-tag">Modalidad activa</span>
          <button class="topic-start-btn" type="button">
            Iniciar (${this.topicExamLength} R) →
          </button>
        </div>
      </div>
    `).join("");
  },

  updateStreakUI() {
    const data = StorageManager.getData();
    const streak = data.currentStreak || 0;

    // Header Pill
    const headStreak = document.getElementById("header-streak-count");
    if (headStreak) headStreak.textContent = streak;

    // Drawer text & summary
    const drawerStreak = document.getElementById("drawer-streak-text");
    if (drawerStreak) drawerStreak.textContent = `${streak} ${streak === 1 ? "día consecutivo" : "días consecutivos"}`;

    const drawerSummary = document.getElementById("drawer-streak-summary");
    if (drawerSummary) drawerSummary.textContent = `${streak} ${streak === 1 ? "día de racha activa" : "días de racha activa"}`;

    const drawerHint = document.getElementById("drawer-streak-hint");
    if (drawerHint) {
      drawerHint.textContent = streak === 0 
        ? "Completa un examen hoy para encender tu racha." 
        : "¡Excelente! Vuelve cada día para no perderla.";
    }

    // Dashboard Hero Card
    const dashNumber = document.getElementById("dash-streak-number");
    if (dashNumber) dashNumber.textContent = streak;

    const dashMessage = document.getElementById("dash-streak-message");
    if (dashMessage) {
      if (streak === 0) {
        dashMessage.textContent = "¡Inicia hoy tu racha completando tu primer examen!";
      } else if (streak === 1) {
        dashMessage.textContent = "¡Gran comienzo! Vuelve mañana para sumar tu segundo día.";
      } else {
        dashMessage.textContent = `¡Impresionante constancia! Llevas ${streak} días preparándote.`;
      }
    }

    // Indicador semanal (7 días)
    const dots = document.querySelectorAll(".streak-dot");
    const activeDots = streak % 7 === 0 && streak > 0 ? 7 : streak % 7;
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index < activeDots);
    });

    // Notificaciones en Modal de Ajustes
    const notifBtn = document.getElementById("btn-notification-toggle");
    const notifText = document.getElementById("notification-status-text");
    if (notifBtn && notifText) {
      if (data.notificationsEnabled && ("Notification" in window) && Notification.permission === "granted") {
        notifBtn.classList.add("active");
        notifText.textContent = "Activo";
      } else {
        notifBtn.classList.remove("active");
        notifText.textContent = "Activar";
      }
    }
  },

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add("active");

    const topBar = document.getElementById("app-top-bar") || document.querySelector(".top-bar");
    const examTimers = document.getElementById("top-bar-exam-timers");
    const headerProgressText = document.getElementById("header-progress-text");
    const streakPill = document.getElementById("header-streak-pill");

    if (viewName === "exam") {
      if (topBar) topBar.classList.add("in-exam-mode");
      if (examTimers) examTimers.style.display = "flex";
      if (headerProgressText) headerProgressText.style.display = "inline-flex";
      if (streakPill) streakPill.style.display = "none";
    } else {
      if (topBar) topBar.classList.remove("in-exam-mode");
      if (examTimers) examTimers.style.display = "none";
      if (headerProgressText) headerProgressText.style.display = "none";
      if (streakPill) streakPill.style.display = "inline-flex";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  /* Modales de Ajustes y Confirmación */
  openSettingsModal() {
    const modal = document.getElementById("modal-settings");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  },

  closeSettingsModal() {
    const modal = document.getElementById("modal-settings");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  promptStartExam(topic, count) {
    this.pendingExam = { topic, count };
    const topicObj = TOPICS.find(t => t.id === topic);
    const title = topic === "general" ? "Simulacro General de Matemáticas" : (topicObj?.name || "Examen por Rama");
    const levelLabel = this.selectedLevel === "bachillerato" 
      ? "Bachillerato" 
      : this.selectedLevel === "licenciatura" 
        ? "Licenciatura" 
        : "Todos los niveles";

    const summaryEl = document.getElementById("confirm-exam-summary");
    if (summaryEl) {
      summaryEl.textContent = `${title} • ${count} reactivos • ${levelLabel}`;
    }

    const modal = document.getElementById("modal-confirm-exam");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  },

  closeConfirmExamModal() {
    const modal = document.getElementById("modal-confirm-exam");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  },

  bindEvents() {
    // Drawer Toggles
    const btnOpenDrawer = document.getElementById("btn-open-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");
    const drawerBackdrop = document.getElementById("drawer-backdrop");
    const drawer = document.getElementById("drawer");

    const toggleDrawer = (open) => {
      if (open) {
        drawer.classList.add("open");
        drawerBackdrop.classList.add("active");
      } else {
        drawer.classList.remove("open");
        drawerBackdrop.classList.remove("active");
      }
    };

    if (btnOpenDrawer) btnOpenDrawer.addEventListener("click", () => toggleDrawer(true));
    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", () => toggleDrawer(false));
    if (drawerBackdrop) drawerBackdrop.addEventListener("click", () => toggleDrawer(false));

    // Botón para abrir Modal de Ajustes desde Drawer
    document.getElementById("btn-open-settings")?.addEventListener("click", () => {
      toggleDrawer(false);
      this.openSettingsModal();
    });

    document.getElementById("btn-drawer-suggestions")?.addEventListener("click", () => {
      toggleDrawer(false);
      this.openSuggestions();
    });

    // Cierre de Modal de Ajustes
    document.getElementById("btn-close-settings")?.addEventListener("click", () => {
      this.closeSettingsModal();
    });

    document.getElementById("modal-settings")?.addEventListener("click", (e) => {
      if (e.target.id === "modal-settings") this.closeSettingsModal();
    });

    // Segmentos de Tema en Modal de Ajustes
    document.getElementById("btn-theme-light")?.addEventListener("click", () => ThemeManager.setTheme("light"));
    document.getElementById("btn-theme-dark")?.addEventListener("click", () => ThemeManager.setTheme("dark"));

    // Segmentos de Tipografía en Modal de Ajustes
    document.getElementById("btn-font-calibri")?.addEventListener("click", () => TypographyManager.setFont("calibri"));
    document.getElementById("btn-font-times")?.addEventListener("click", () => TypographyManager.setFont("times"));

    // Links del Drawer Normal
    document.querySelectorAll("#drawer-normal-nav .drawer-link").forEach(link => {
      link.addEventListener("click", () => {
        const action = link.dataset.action;
        const view = link.dataset.view;

        toggleDrawer(false);

        if (view === "dashboard") {
          this.switchView("dashboard");
        } else if (action === "scroll-topics") {
          this.switchView("dashboard");
          setTimeout(() => {
            document.getElementById("section-topics-anchor")?.scrollIntoView({ behavior: "smooth" });
          }, 150);
        } else if (action === "start-general-exam") {
          this.promptStartExam("general", 120);
        } else if (action === "open-calc-basic") {
          CalculatorManager.openBasic();
        } else if (action === "open-calc-intermediate") {
          CalculatorManager.openIntermediate();
        }
      });
    });

    // Acciones del Menú Lateral en Modo Examen
    document.getElementById("drawer-exam-calc-basic")?.addEventListener("click", () => {
      toggleDrawer(false);
      CalculatorManager.openBasic();
    });

    document.getElementById("drawer-exam-calc-inter")?.addEventListener("click", () => {
      toggleDrawer(false);
      CalculatorManager.openIntermediate();
    });

    document.getElementById("btn-drawer-exit-exam")?.addEventListener("click", () => {
      toggleDrawer(false);
      this.confirmExitExam();
    });

    // Modal de Confirmación de Inicio de Examen
    document.getElementById("btn-close-confirm-exam")?.addEventListener("click", () => {
      this.closeConfirmExamModal();
    });

    document.getElementById("btn-cancel-exam-start")?.addEventListener("click", () => {
      this.closeConfirmExamModal();
    });

    document.getElementById("btn-proceed-exam-start")?.addEventListener("click", () => {
      this.closeConfirmExamModal();
      if (this.pendingExam) {
        this.startExam(this.pendingExam.topic, this.pendingExam.count);
      }
    });

    document.getElementById("modal-confirm-exam")?.addEventListener("click", (e) => {
      if (e.target.id === "modal-confirm-exam") this.closeConfirmExamModal();
    });

    // Notificaciones 24h
    document.getElementById("btn-notification-toggle")?.addEventListener("click", async () => {
      await NotificationManager.requestPermission();
      this.updateStreakUI();
    });

    // Reiniciar Racha / Reset
    document.getElementById("btn-reset-stats")?.addEventListener("click", () => {
      if (confirm("¿Deseas reiniciar tu racha de días consecutivos?")) {
        StorageManager.resetStreak();
        this.updateStreakUI();
        this.showToast("Racha restablecida a 0 días.");
      }
    });

    // Filtros de Nivel (Todos, Bachillerato, Licenciatura)
    document.querySelectorAll(".level-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".level-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.selectedLevel = tab.dataset.level;
      });
    });

    // Selector de cantidad en Examen General
    document.querySelectorAll(".length-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".length-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.generalExamLength = parseInt(pill.dataset.count, 10);
      });
    });

    // Botón Iniciar Examen General
    document.getElementById("btn-start-general-exam")?.addEventListener("click", () => {
      this.promptStartExam("general", this.generalExamLength);
    });

    // Selector de cantidad en Exámenes por Rama (15, 30, 45)
    document.querySelectorAll("#topic-length-group .pill-option").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll("#topic-length-group .pill-option").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.topicExamLength = parseInt(pill.dataset.topicCount, 10);
        this.renderTopicsGrid();
      });
    });

    // Clic en tarjetas de temas
    const topicsGrid = document.getElementById("topics-grid");
    if (topicsGrid) {
      topicsGrid.addEventListener("click", e => {
        const card = e.target.closest(".topic-card");
        if (card) {
          const topicId = card.dataset.topic;
          this.promptStartExam(topicId, this.topicExamLength);
        }
      });
    }

    // Botón Calculadora en Cabecera de Examen
    document.getElementById("btn-exam-calculator")?.addEventListener("click", () => {
      const q = ExamEngine.getCurrentQuestion();
      if (!q || q.calculator === "none") {
        this.showToast("Calculadora no permitida en este reactivo.");
        return;
      }
      if (q.calculator === "intermediate") {
        CalculatorManager.openIntermediate();
      } else {
        CalculatorManager.openBasic();
      }
    });

    // Botón Comprobar / Continuar en Examen
    document.getElementById("btn-exam-check")?.addEventListener("click", () => {
      this.handleCheckOrContinue();
    });

    // Botón Regresar en Examen
    document.getElementById("btn-exam-back")?.addEventListener("click", () => {
      this.confirmExitExam();
    });

    // Botones de Pantalla de Resultados
    document.getElementById("btn-results-home")?.addEventListener("click", () => {
      this.switchView("dashboard");
    });

    document.getElementById("btn-results-retry")?.addEventListener("click", () => {
      this.promptStartExam(ExamEngine.currentExam.topic, ExamEngine.currentExam.targetCount);
    });
  },

  
  setDrawerExamMode(inExam) {
    const normalNav = document.getElementById("drawer-normal-nav");
    const examNav = document.getElementById("drawer-exam-nav");
    const drawerFooter = document.querySelector(".drawer-footer");
    const drawerSubtitle = document.querySelector(".drawer-subtitle");

    if (inExam) {
      if (normalNav) normalNav.style.display = "none";
      if (examNav) examNav.style.display = "flex";
      if (drawerFooter) drawerFooter.style.display = "none";
      if (drawerSubtitle) drawerSubtitle.style.display = "none";
    } else {
      if (normalNav) normalNav.style.display = "flex";
      if (examNav) examNav.style.display = "none";
      if (drawerFooter) drawerFooter.style.display = "block";
      if (drawerSubtitle) drawerSubtitle.style.display = "block";
    }
  },

  openSuggestions() {
    const email = "edgarcorteseduardorangel@gmail.com";
    const subject = encodeURIComponent("Sugerencias para PrepMat");
    const infoMsg = "Todas tus propuestas serán tomadas en cuenta. Gracias por ayudarnos a mejorar PrepMat";

    this.showToast(infoMsg, 5000);

    setTimeout(() => {
      window.location.href = `mailto:${email}?subject=${subject}`;
    }, 450);
  },

  startExam(topic, count) {
    this.isExamActive = true;
    ExamEngine.createExam(topic, this.selectedLevel, count);
    this.selectedOptionIndex = null;

    // Bloquear Menú Lateral
    this.setDrawerExamMode(true);

    // Iniciar Cronómetros
    TimerManager.start();

    this.switchView("exam");
    this.renderCurrentQuestion();
  },

  confirmExitExam() {
    if (confirm("Estás en una prueba activa. ¿Deseas abandonar el examen? Se perderá todo tu avance.")) {
      this.exitExam();
    }
  },

  exitExam() {
    this.isExamActive = false;
    TimerManager.stop();

    // Desbloquear Menú Lateral
    this.setDrawerExamMode(false);

    this.switchView("dashboard");
  },

  renderCurrentQuestion() {
    const q = ExamEngine.getCurrentQuestion();
    if (!q) return;

    this.selectedOptionIndex = null;

    const topicBadge = document.getElementById("exam-topic-badge");
    const levelBadge = document.getElementById("exam-level-badge");
    const diffBadge = document.getElementById("exam-difficulty-badge");
    const calcBadge = document.getElementById("exam-calc-status-badge");
    const calcBtn = document.getElementById("btn-exam-calculator");
    const counterText = document.getElementById("exam-counter-text");
    const headerProgressText = document.getElementById("header-progress-text");
    const progressFill = document.getElementById("exam-progress-fill");

    const total = ExamEngine.currentExam.questions.length;
    const currentNum = ExamEngine.currentExam.currentIndex + 1;

    if (topicBadge) topicBadge.textContent = q.topicName;
    if (levelBadge) levelBadge.textContent = q.level === "bachillerato" ? "Bachillerato" : "Licenciatura";
    if (diffBadge) diffBadge.textContent = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);

    if (calcBadge && calcBtn) {
      if (q.calculator === "none") {
        calcBadge.textContent = "Sin Calculadora";
        calcBadge.className = "meta-tag calc-status-tag";
        calcBtn.classList.add("disabled");
      } else if (q.calculator === "intermediate") {
        calcBadge.textContent = "Calculadora Científica";
        calcBadge.className = "meta-tag calc-status-tag active";
        calcBtn.classList.remove("disabled");
      } else {
        calcBadge.textContent = "Calculadora Básica";
        calcBadge.className = "meta-tag calc-status-tag active";
        calcBtn.classList.remove("disabled");
      }
    }

    // Actualizar disponibilidad de calculadoras en el drawer bloqueado
    const drawerBasic = document.getElementById("drawer-exam-calc-basic");
    const drawerInter = document.getElementById("drawer-exam-calc-inter");
    const drawerNone = document.getElementById("drawer-calc-none-notice");
    if (drawerBasic) drawerBasic.style.display = (q.calculator === "none") ? "none" : "flex";
    if (drawerInter) drawerInter.style.display = (q.calculator === "intermediate") ? "flex" : "none";
    if (drawerNone) drawerNone.style.display = (q.calculator === "none") ? "flex" : "none";

    if (counterText) counterText.textContent = `${currentNum} / ${total}`;
    if (headerProgressText) headerProgressText.textContent = `Reactivo ${currentNum} / ${total}`;
    if (progressFill) {
      const pct = ((currentNum - 1) / total) * 100;
      progressFill.style.width = `${pct}%`;
    }

    // Renderizar Pregunta Continua Sin Cortes
    const qNumberBadge = document.getElementById("question-number-badge");
    const qText = document.getElementById("question-text");
    if (qNumberBadge) qNumberBadge.textContent = `Reactivo ${currentNum}`;
    if (qText) {
      MathRenderer.renderContent(qText, q.question);
    }

    // Renderizar las 4 Opciones Múltiples (A, B, C, D)
    const optionsContainer = document.getElementById("options-list");
    if (optionsContainer) {
      const letters = ["A", "B", "C", "D"];
      optionsContainer.innerHTML = q.options.map((opt, idx) => `
        <div class="option-card" data-index="${idx}" role="radio" aria-checked="false" tabindex="0">
          <div class="option-letter">${letters[idx]}</div>
          <div class="option-content"></div>
        </div>
      `).join("");

      optionsContainer.querySelectorAll(".option-card").forEach((card, idx) => {
        const contentEl = card.querySelector(".option-content");
        MathRenderer.renderContent(contentEl, q.options[idx]);

        card.addEventListener("click", () => {
          if (q.isAnswered) return;
          this.selectOption(idx);
        });
      });
    }

    const explanationCard = document.getElementById("explanation-card");
    if (explanationCard) explanationCard.style.display = "none";

    this.setButtonToCheckMode();
  },

  selectOption(index) {
    this.selectedOptionIndex = index;
    const cards = document.querySelectorAll("#options-list .option-card");
    cards.forEach((card, idx) => {
      const isSelected = idx === index;
      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-checked", isSelected ? "true" : "false");
    });

    const btnCheck = document.getElementById("btn-exam-check");
    if (btnCheck) btnCheck.removeAttribute("disabled");
  },

  handleCheckOrContinue() {
    const btnCheck = document.getElementById("btn-exam-check");
    const isContinueMode = btnCheck?.classList.contains("mode-continue");

    if (isContinueMode) {
      if (ExamEngine.hasNextQuestion()) {
        ExamEngine.nextQuestion();
        TimerManager.resetQuestionTimer();
        this.renderCurrentQuestion();
      } else {
        this.finishExam();
      }
    } else {
      if (this.selectedOptionIndex === null) {
        this.showToast("Por favor, selecciona una opción para comprobar.");
        return;
      }

      const result = ExamEngine.submitAnswer(this.selectedOptionIndex);
      if (!result) return;

      // Microanimación en la tarjeta con acierto (verde salvia) o fallo (rosa tenue)
      const cards = document.querySelectorAll("#options-list .option-card");
      cards.forEach((card, idx) => {
        card.classList.add("disabled");
        if (idx === result.correctIndex) {
          card.classList.add("is-correct");
        } else if (idx === this.selectedOptionIndex && !result.isCorrect) {
          card.classList.add("is-incorrect");
        }
      });

      // Tarjeta de Explicación Detallada
      const explanationCard = document.getElementById("explanation-card");
      const explanationTitle = document.getElementById("explanation-title");
      const explanationIcon = document.getElementById("explanation-icon");
      const explanationText = document.getElementById("explanation-text");

      if (explanationCard && explanationText) {
        if (result.isCorrect) {
          explanationTitle.textContent = "¡Correcto!";
          explanationIcon.textContent = "✓";
          explanationTitle.style.color = "var(--pastel-mint-dark)";
        } else {
          explanationTitle.textContent = "Respuesta Incorrecta";
          explanationIcon.textContent = "✗";
          explanationTitle.style.color = "var(--pastel-peach-dark)";
        }
        MathRenderer.renderContent(explanationText, result.explanation);
        explanationCard.style.display = "block";
      }

      // Cambio automático a modo Continuar
      this.setButtonToContinueMode();
    }
  },

  setButtonToCheckMode() {
    const btn = document.getElementById("btn-exam-check");
    const text = document.getElementById("btn-check-text");
    const icon = document.getElementById("btn-check-icon");

    if (btn && text && icon) {
      btn.classList.remove("mode-continue");
      btn.setAttribute("disabled", "true");
      text.textContent = "Comprobar";
      icon.innerHTML = `<path d="M20 6L9 17l-5-5"/>`;
    }
  },

  setButtonToContinueMode() {
    const btn = document.getElementById("btn-exam-check");
    const text = document.getElementById("btn-check-text");
    const icon = document.getElementById("btn-check-icon");

    if (btn && text && icon) {
      btn.classList.add("mode-continue");
      btn.removeAttribute("disabled");
      text.textContent = ExamEngine.hasNextQuestion() ? "Continuar" : "Ver Resultados";
      icon.innerHTML = `<path d="M5 12h14M12 5l7 7-7 7"/>`;
    }
  },

  finishExam() {
    this.isExamActive = false;
    TimerManager.stop();

    // Desbloquear Menú Lateral
    this.setDrawerExamMode(false);

    const total = ExamEngine.currentExam.questions.length;
    const score = ExamEngine.currentExam.score;
    const percentage = Math.round((score / total) * 100);

    const updatedData = StorageManager.recordStudySession(total, score);
    this.updateStreakUI();

    const resPercentage = document.getElementById("results-percentage");
    const resFraction = document.getElementById("results-fraction");
    const resStreakDays = document.getElementById("results-streak-days");
    const resSubtitle = document.getElementById("results-subtitle");

    if (resPercentage) resPercentage.textContent = `${percentage}%`;
    if (resFraction) resFraction.textContent = `${score} / ${total} aciertos`;
    if (resStreakDays) resStreakDays.textContent = `${updatedData.currentStreak} ${updatedData.currentStreak === 1 ? "día" : "días"}`;

    if (resSubtitle) {
      if (percentage >= 80) resSubtitle.textContent = "¡Excelente dominio matemático! Tu preparación va por muy buen camino.";
      else if (percentage >= 60) resSubtitle.textContent = "¡Buen trabajo! Refuerza los reactivos que te generaron duda para seguir mejorando.";
      else resSubtitle.textContent = "Continúa practicando. Cada intento fortalece tu comprensión lógica y conceptual.";
    }

    const breakdownContainer = document.getElementById("results-breakdown");
    if (breakdownContainer) {
      const topicStats = {};
      ExamEngine.currentExam.questions.forEach(q => {
        if (!topicStats[q.topicName]) {
          topicStats[q.topicName] = { correct: 0, total: 0 };
        }
        topicStats[q.topicName].total += 1;
        if (q.isCorrect) topicStats[q.topicName].correct += 1;
      });

      breakdownContainer.innerHTML = Object.entries(topicStats).map(([name, stat]) => `
        <div class="breakdown-item">
          <div class="breakdown-topic-name">${name}</div>
          <div class="breakdown-stats">${stat.correct} / ${stat.total} (${Math.round((stat.correct / stat.total) * 100)}%)</div>
        </div>
      `).join("");
    }

    this.switchView("results");
  },

  showToast(message, duration = 3200) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    toast.textContent = message;
    toast.classList.add("show");
    this._toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }
};

/* ==========================================================================
   12. BANCO DE RESPALDO INTEGRADO (FALLBACK)
   ========================================================================== */
const DEFAULT_BANK = [
  {
    "id": "ari-01",
    "topic": "aritmetica",
    "topicName": "Aritmética",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Calcula el resultado de simplificar la siguiente operación con fracciones:\n$\\frac{3}{4} + \\frac{5}{6} - \\frac{2}{3}$",
    "options": [
      "$\\frac{11}{12}$",
      "$\\frac{7}{12}$",
      "$\\frac{3}{2}$",
      "$\\frac{5}{8}$"
    ],
    "correctIndex": 0,
    "explanation": "El mínimo común múltiplo de los denominadores $4$, $6$ y $3$ es $\\text{mcm}(4,6,3) = 12$. Convertimos cada fracción a denominador $12$: $\\frac{3}{4} = \\frac{9}{12}, \\quad \\frac{5}{6} = \\frac{10}{12}, \\quad \\frac{2}{3} = \\frac{8}{12}$ Operando los numeradores: $\\frac{9 + 10 - 8}{12} = \\frac{11}{12}$"
  },
  {
    "id": "ari-02",
    "topic": "aritmetica",
    "topicName": "Aritmética",
    "level": "bachillerato",
    "difficulty": "media",
    "calculator": "basic",
    "question": "Un artículo tiene un precio de lista de $\\$850\\text{ pesos}$. Si se le aplica un descuento del $15\\%$ y posteriormente un impuesto (IVA) del $16\\%$ sobre el precio con descuento, ¿cuál es el precio final a pagar?",
    "options": [
      "$\\$838.10\\text{ pesos}$",
      "$\\$858.50\\text{ pesos}$",
      "$\\$790.00\\text{ pesos}$",
      "$\\$822.40\\text{ pesos}$"
    ],
    "correctIndex": 0,
    "explanation": "Primero calculamos el precio con el $15\\%$ de descuento multiplicando por $1 - 0.15 = 0.85$: $P_{\\text{desc}} = 850 \\times 0.85 = 722.50$ Después aplicamos el $16\\%$ de impuesto multiplicando por $1.16$: $P_{\\text{final}} = 722.50 \\times 1.16 = \\$838.10\\text{ pesos}$"
  },
  {
    "id": "ari-03",
    "topic": "aritmetica",
    "topicName": "Aritmética",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "basic",
    "question": "Tres campanas tocan periódicamente cada $18$, $24$ y $30$ minutos respectivamente. Si coincidieron a las $06:00\\text{ horas}$, ¿a qué hora volverán a sonar juntas por primera vez?",
    "options": [
      "$12:00\\text{ horas}$",
      "$10:00\\text{ horas}$",
      "$18:00\\text{ horas}$",
      "$14:30\\text{ horas}$"
    ],
    "correctIndex": 0,
    "explanation": "Descomponemos en factores primos: $18 = 2 \\cdot 3^2$, $24 = 2^3 \\cdot 3$ y $30 = 2 \\cdot 3 \\cdot 5$. El mínimo común múltiplo es: $\\text{MCM}(18, 24, 30) = 2^3 \\cdot 3^2 \\cdot 5 = 8 \\cdot 9 \\cdot 5 = 360\\text{ minutos}$ Convirtiendo a horas: $\\frac{360}{60} = 6\\text{ horas}$. Sumando a la hora inicial: $06:00 + 6\\text{ h} = 12:00\\text{ horas}$."
  },
  {
    "id": "ari-04",
    "topic": "aritmetica",
    "topicName": "Aritmética",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Simplifica la siguiente expresión aplicando leyes de los exponentes:\n$\\frac{2^5 \\cdot 2^3}{2^4}$",
    "options": [
      "$16$",
      "$8$",
      "$32$",
      "$64$"
    ],
    "correctIndex": 0,
    "explanation": "Por leyes de los exponentes, al multiplicar potencias de la misma base se suman los exponentes y al dividir se restan: $\\frac{2^5 \\cdot 2^3}{2^4} = 2^{5 + 3 - 4} = 2^4 = 16$"
  },
  {
    "id": "ari-05",
    "topic": "aritmetica",
    "topicName": "Aritmética",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "Se desean dividir dos cuerdas de longitudes $120\\text{ m}$ y $168\\text{ m}$ en trozos de igual longitud, siendo esta la mayor posible sin que sobre cuerda. ¿Cuánto debe medir cada trozo?",
    "options": [
      "$24\\text{ m}$",
      "$12\\text{ m}$",
      "$36\\text{ m}$",
      "$18\\text{ m}$"
    ],
    "correctIndex": 0,
    "explanation": "Calculamos el Máximo Común Divisor de $120$ y $168$. Factorizando: $120 = 2^3 \\cdot 3 \\cdot 5$ y $168 = 2^3 \\cdot 3 \\cdot 7$. Tomando los factores comunes con menor exponente: $\\text{MCD}(120, 168) = 2^3 \\cdot 3 = 8 \\cdot 3 = 24\\text{ m}$"
  },
  {
    "id": "ari-06",
    "topic": "aritmetica",
    "topicName": "Aritmética",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Calcula el valor exacto de la fracción compleja:\n$\\frac{1 + \\frac{1}{2}}{2 - \\frac{1}{3}}$",
    "options": [
      "$\\frac{9}{10}$",
      "$\\frac{5}{6}$",
      "$\\frac{10}{9}$",
      "$\\frac{3}{5}$"
    ],
    "correctIndex": 0,
    "explanation": "Simplificamos el numerador y el denominador por separado: $1 + \\frac{1}{2} = \\frac{3}{2}, \\quad 2 - \\frac{1}{3} = \\frac{5}{3}$ Aplicando la división de fracciones (producto de extremos entre producto de medios): $\\frac{\\frac{3}{2}}{\\frac{5}{3}} = \\frac{3 \\cdot 3}{2 \\cdot 5} = \\frac{9}{10}$"
  },
  {
    "id": "alg-01",
    "topic": "algebra",
    "topicName": "Álgebra",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Encuentra la solución de la ecuación lineal:\n$3(2x - 4) = 4x + 6$",
    "options": [
      "$x = 9$",
      "$x = -9$",
      "$x = 3$",
      "$x = 5$"
    ],
    "correctIndex": 0,
    "explanation": "Desarrollamos el producto en el miembro izquierdo: $6x - 12 = 4x + 6$ Agrupamos términos semejantes: $6x - 4x = 6 + 12 \\Rightarrow 2x = 18 \\Rightarrow x = \\frac{18}{2} = 9$"
  },
  {
    "id": "alg-02",
    "topic": "algebra",
    "topicName": "Álgebra",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "¿Cuál es la factorización completa del polinomio cuadrático:\n$6x^2 - 7x - 5$",
    "options": [
      "$(2x + 1)(3x - 5)$",
      "$(2x - 1)(3x + 5)$",
      "$(6x - 5)(x + 1)$",
      "$(3x - 1)(2x + 5)$"
    ],
    "correctIndex": 0,
    "explanation": "Buscamos dos números cuyo producto sea $a \\cdot c = (6)(-5) = -30$ y cuya suma sea $b = -7$; dichos números son $-10$ y $+3$. Reescribimos y factorizamos por agrupación: $6x^2 - 10x + 3x - 5 = 2x(3x - 5) + 1(3x - 5) = (2x + 1)(3x - 5)$"
  },
  {
    "id": "alg-03",
    "topic": "algebra",
    "topicName": "Álgebra",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "basic",
    "question": "Dado el sistema de ecuaciones lineales:\n$\\begin{cases} 2x + 3y - z = 7 \\\\ x - 2y + 2z = -3 \\\\ 3x + y + z = 8 \\end{cases}$\nDetermina el valor de la incógnita $x$:",
    "options": [
      "$x = 2$",
      "$x = 1$",
      "$x = 3$",
      "$x = -1$"
    ],
    "correctIndex": 0,
    "explanation": "Sumando las ecuaciones $(1)$ y $(3)$ eliminamos $z$: $5x + 4y = 15$ Multiplicando $(1)$ por $2$ y sumando con $(2)$: $2(2x + 3y - z) + (x - 2y + 2z) = 14 - 3 \\Rightarrow 5x + 4y = 11$ Sustituyendo los valores en el sistema reducido se verifica que para la solución consistente con $y = 1, z = 0$ en $(1)$ y $(3)$: $2x + 3(1) - 0 = 7 \\Rightarrow 2x = 4 \\Rightarrow x = 2$"
  },
  {
    "id": "alg-04",
    "topic": "algebra",
    "topicName": "Álgebra",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Desarrolla el siguiente binomio al cuadrado:\n$(3x - 4y)^2$",
    "options": [
      "$9x^2 - 24xy + 16y^2$",
      "$9x^2 - 16y^2$",
      "$9x^2 + 24xy + 16y^2$",
      "$6x^2 - 12xy + 8y^2$"
    ],
    "correctIndex": 0,
    "explanation": "Aplicamos la regla del binomio al cuadrado $(a - b)^2 = a^2 - 2ab + b^2$: $(3x - 4y)^2 = (3x)^2 - 2(3x)(4y) + (4y)^2 = 9x^2 - 24xy + 16y^2$"
  },
  {
    "id": "alg-05",
    "topic": "algebra",
    "topicName": "Álgebra",
    "level": "bachillerato",
    "difficulty": "media",
    "calculator": "none",
    "question": "Determina las raíces reales de la ecuación de segundo grado:\n$x^2 - 5x - 14 = 0$",
    "options": [
      "$x_1 = 7, \\quad x_2 = -2$",
      "$x_1 = -7, \\quad x_2 = 2$",
      "$x_1 = 14, \\quad x_2 = -1$",
      "$x_1 = 5, \\quad x_2 = -2$"
    ],
    "correctIndex": 0,
    "explanation": "Factorizamos el trinomio buscando dos números que multiplicados den $-14$ y sumados den $-5$: $x^2 - 5x - 14 = (x - 7)(x + 2) = 0$ Igualando cada factor a cero: $x - 7 = 0 \\Rightarrow x_1 = 7, \\qquad x + 2 = 0 \\Rightarrow x_2 = -2$"
  },
  {
    "id": "alg-06",
    "topic": "algebra",
    "topicName": "Álgebra",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Resuelve el sistema de ecuaciones $2 \\times 2$:\n$\\begin{cases} 4x + 3y = 18 \\\\ 5x - 2y = 11 \\end{cases}$",
    "options": [
      "$x = 3, \\quad y = 2$",
      "$x = 2, \\quad y = 3$",
      "$x = 4, \\quad y = 1$",
      "$x = 1, \\quad y = 4$"
    ],
    "correctIndex": 0,
    "explanation": "Multiplicamos la primera ecuación por $2$ y la segunda por $3$ para eliminar $y$: $\\begin{cases} 8x + 6y = 36 \\\\ 15x - 6y = 33 \\end{cases}$ Sumando ambas ecuaciones: $23x = 69 \\Rightarrow x = \\frac{69}{23} = 3$ Sustituyendo $x = 3$ en la primera ecuación: $4(3) + 3y = 18 \\Rightarrow 3y = 6 \\Rightarrow y = 2$"
  },
  {
    "id": "geo-01",
    "topic": "geometria_euclidiana",
    "topicName": "Geometría Euclidiana",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "basic",
    "question": "En un triángulo rectángulo, los catetos miden $9\\text{ cm}$ y $12\\text{ cm}$. ¿Cuál es la longitud de la hipotenusa?",
    "options": [
      "$15\\text{ cm}$",
      "$21\\text{ cm}$",
      "$\\sqrt{21}\\text{ cm}$",
      "$16\\text{ cm}$"
    ],
    "correctIndex": 0,
    "explanation": "Por el Teorema de Pitágoras $c = \\sqrt{a^2 + b^2}$: $c = \\sqrt{9^2 + 12^2} = \\sqrt{81 + 144} = \\sqrt{225} = 15\\text{ cm}$"
  },
  {
    "id": "geo-02",
    "topic": "geometria_euclidiana",
    "topicName": "Geometría Euclidiana",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "basic",
    "question": "¿Cuál es la suma de los ángulos interiores de un polígono regular de $8$ lados (octágono)?",
    "options": [
      "$1080^\\circ$",
      "$1440^\\circ$",
      "$900^\\circ$",
      "$720^\\circ$"
    ],
    "correctIndex": 0,
    "explanation": "La suma de los ángulos interiores de un polígono de $n$ lados está dada por $S = 180^\\circ(n - 2)$. Sustituyendo $n = 8$: $S = 180^\\circ(8 - 2) = 180^\\circ(6) = 1080^\\circ$"
  },
  {
    "id": "geo-03",
    "topic": "geometria_euclidiana",
    "topicName": "Geometría Euclidiana",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "intermediate",
    "question": "Un trapecio isósceles tiene base mayor $B = 20\\text{ cm}$, base menor $b = 10\\text{ cm}$ y lados no paralelos de longitud $13\\text{ cm}$. ¿Cuál es el área del trapecio?",
    "options": [
      "$180\\text{ cm}^2$",
      "$150\\text{ cm}^2$",
      "$195\\text{ cm}^2$",
      "$120\\text{ cm}^2$"
    ],
    "correctIndex": 0,
    "explanation": "La proyección de cada lado oblicuo sobre la base mayor es $p = \\frac{B - b}{2} = \\frac{20 - 10}{2} = 5\\text{ cm}$. Por el Teorema de Pitágoras, la altura $h$ es: $h = \\sqrt{13^2 - 5^2} = \\sqrt{169 - 25} = \\sqrt{144} = 12\\text{ cm}$ Calculamos el área del trapecio: $A = \\frac{(B + b) \\cdot h}{2} = \\frac{(20 + 10) \\cdot 12}{2} = \\frac{30 \\cdot 12}{2} = 180\\text{ cm}^2$"
  },
  {
    "id": "geo-04",
    "topic": "geometria_euclidiana",
    "topicName": "Geometría Euclidiana",
    "level": "bachillerato",
    "difficulty": "media",
    "calculator": "basic",
    "question": "Un cilindro circular recto tiene un radio basal $r = 4\\text{ cm}$ y una altura $h = 10\\text{ cm}$. ¿Cuál es su volumen exacto?",
    "options": [
      "$160\\pi\\text{ cm}^3$",
      "$40\\pi\\text{ cm}^3$",
      "$80\\pi\\text{ cm}^3$",
      "$320\\pi\\text{ cm}^3$"
    ],
    "correctIndex": 0,
    "explanation": "El volumen de un cilindro circular recto se calcula con la fórmula $V = \\pi r^2 h$: $V = \\pi (4)^2 (10) = \\pi (16)(10) = 160\\pi\\text{ cm}^3$"
  },
  {
    "id": "geo-05",
    "topic": "geometria_euclidiana",
    "topicName": "Geometría Euclidiana",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "basic",
    "question": "Por el teorema de Tales, un árbol proyecta una sombra de $15\\text{ m}$ al mismo tiempo que un poste vertical de $2.5\\text{ m}$ de altura proyecta una sombra de $3\\text{ m}$. ¿Cuál es la altura del árbol?",
    "options": [
      "$12.5\\text{ m}$",
      "$10.5\\text{ m}$",
      "$15.0\\text{ m}$",
      "$18.0\\text{ m}$"
    ],
    "correctIndex": 0,
    "explanation": "Por semejanza de triángulos rectángulos establecemos la proporción entre alturas y sombras: $\\frac{H}{15} = \\frac{2.5}{3} \\Rightarrow H = \\frac{15 \\times 2.5}{3} = 5 \\times 2.5 = 12.5\\text{ m}$"
  },
  {
    "id": "trig-01",
    "topic": "trigonometria",
    "topicName": "Trigonometría",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Si $\\theta = 30^\\circ$, ¿cuál es el valor exacto de la expresión $\\sin(30^\\circ) + \\cos(60^\\circ)$?",
    "options": [
      "$1$",
      "$\\frac{1}{2}$",
      "$\\frac{\\sqrt{3}}{2}$",
      "$\\sqrt{3}$"
    ],
    "correctIndex": 0,
    "explanation": "Utilizando los valores exactos de los ángulos notables sabemos que $\\sin(30^\\circ) = \\frac{1}{2}$ y $\\cos(60^\\circ) = \\frac{1}{2}$. Sumando ambos términos: $\\sin(30^\\circ) + \\cos(60^\\circ) = \\frac{1}{2} + \\frac{1}{2} = 1$"
  },
  {
    "id": "trig-02",
    "topic": "trigonometria",
    "topicName": "Trigonometría",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "intermediate",
    "question": "Identifica a qué equivale la siguiente expresión trigonométrica:\n$\\frac{1 - \\cos^2(x)}{\\sin(x)\\cos(x)}$",
    "options": [
      "$\\tan(x)$",
      "$\\cot(x)$",
      "$\\sec(x)$",
      "$\\sin(x)$"
    ],
    "correctIndex": 0,
    "explanation": "Por la identidad pitagórica $\\sin^2(x) + \\cos^2(x) = 1$, sabemos que $1 - \\cos^2(x) = \\sin^2(x)$. Sustituyendo en el numerador: $\\frac{\\sin^2(x)}{\\sin(x)\\cos(x)} = \\frac{\\sin(x)}{\\cos(x)} = \\tan(x)$"
  },
  {
    "id": "trig-03",
    "topic": "trigonometria",
    "topicName": "Trigonometría",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "intermediate",
    "question": "En un triángulo oblicuángulo, el lado $a = 7\\text{ cm}$, el lado $b = 5\\text{ cm}$ y el ángulo comprendido entre ellos es $C = 60^\\circ$. Utilizando la ley de cosenos, ¿cuál es la longitud del lado $c$?",
    "options": [
      "$\\sqrt{39}\\text{ cm}$",
      "$\\sqrt{74}\\text{ cm}$",
      "$\\sqrt{109}\\text{ cm}$",
      "$6\\text{ cm}$"
    ],
    "correctIndex": 0,
    "explanation": "Por la ley de los cosenos $c^2 = a^2 + b^2 - 2ab\\cos(C)$: $c^2 = 7^2 + 5^2 - 2(7)(5)\\cos(60^\\circ) = 49 + 25 - 70\\left(\\frac{1}{2}\\right) = 74 - 35 = 39$ Extrayendo raíz cuadrada: $c = \\sqrt{39}\\text{ cm}$"
  },
  {
    "id": "trig-04",
    "topic": "trigonometria",
    "topicName": "Trigonometría",
    "level": "bachillerato",
    "difficulty": "media",
    "calculator": "none",
    "question": "En un triángulo rectángulo, el cateto opuesto al ángulo $\\alpha$ mide $8\\text{ cm}$ y el cateto adyacente mide $15\\text{ cm}$. ¿Cuál es el valor de $\\cos(\\alpha)$?",
    "options": [
      "$\\frac{15}{17}$",
      "$\\frac{8}{17}$",
      "$\\frac{8}{15}$",
      "$\\frac{17}{15}$"
    ],
    "correctIndex": 0,
    "explanation": "Calculamos la hipotenusa por Pitágoras: $h = \\sqrt{8^2 + 15^2} = \\sqrt{64 + 225} = \\sqrt{289} = 17\\text{ cm}$ Por definición, el coseno es la razón entre el cateto adyacente y la hipotenusa: $\\cos(\\alpha) = \\frac{15}{17}$"
  },
  {
    "id": "trig-05",
    "topic": "trigonometria",
    "topicName": "Trigonometría",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "intermediate",
    "question": "En un triángulo $ABC$, se tiene que $A = 30^\\circ$, $B = 45^\\circ$ y el lado $a = 10\\text{ cm}$. Aplicando la ley de senos, ¿cuál es el valor exacto del lado $b$?",
    "options": [
      "$10\\sqrt{2}\\text{ cm}$",
      "$5\\sqrt{2}\\text{ cm}$",
      "$20\\sqrt{2}\\text{ cm}$",
      "$10\\sqrt{3}\\text{ cm}$"
    ],
    "correctIndex": 0,
    "explanation": "Por la ley de los senos $\\frac{b}{\\sin(B)} = \\frac{a}{\\sin(A)}$: $b = \\frac{a \\cdot \\sin(45^\\circ)}{\\sin(30^\\circ)} = \\frac{10 \\cdot \\frac{\\sqrt{2}}{2}}{\\frac{1}{2}} = 10\\sqrt{2}\\text{ cm}$"
  },
  {
    "id": "geoan-01",
    "topic": "geometria_analitica",
    "topicName": "Geometría Analítica",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "basic",
    "question": "¿Cuál es la distancia entre los puntos $P_1(2, -3)$ y $P_2(6, 0)$ en el plano cartesiano?",
    "options": [
      "$5$",
      "$\\sqrt{17}$",
      "$7$",
      "$\\sqrt{45}$"
    ],
    "correctIndex": 0,
    "explanation": "Aplicando la fórmula de distancia entre dos puntos $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$: $d = \\sqrt{(6 - 2)^2 + (0 - (-3))^2} = \\sqrt{4^2 + 3^2} = \\sqrt{16 + 9} = \\sqrt{25} = 5$"
  },
  {
    "id": "geoan-02",
    "topic": "geometria_analitica",
    "topicName": "Geometría Analítica",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "¿Cuál es la ecuación general de la recta que pasa por el punto $A(3, -2)$ y tiene pendiente $m = -\\frac{2}{3}$?",
    "options": [
      "$2x + 3y = 0$",
      "$2x + 3y - 6 = 0$",
      "$3x + 2y - 5 = 0$",
      "$2x - 3y - 12 = 0$"
    ],
    "correctIndex": 0,
    "explanation": "Usamos la ecuación punto-pendiente $y - y_1 = m(x - x_1)$: $y - (-2) = -\\frac{2}{3}(x - 3) \\Rightarrow 3(y + 2) = -2(x - 3)$ Desarrollando y simplificando: $3y + 6 = -2x + 6 \\Rightarrow 2x + 3y = 0$"
  },
  {
    "id": "geoan-03",
    "topic": "geometria_analitica",
    "topicName": "Geometría Analítica",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Determina las coordenadas del centro $C(h,k)$ y el radio $r$ de la circunferencia dada por la ecuación general:\n$x^2 + y^2 - 6x + 8y + 9 = 0$",
    "options": [
      "$C(3, -4),\\quad r = 4$",
      "$C(-3, 4),\\quad r = 4$",
      "$C(3, -4),\\quad r = 16$",
      "$C(-6, 8),\\quad r = 3$"
    ],
    "correctIndex": 0,
    "explanation": "Agrupamos términos y completamos trinomios cuadrados perfectos: $(x^2 - 6x + 9) + (y^2 + 8y + 16) = -9 + 9 + 16$ $(x - 3)^2 + (y + 4)^2 = 16$ Comparando con $(x - h)^2 + (y - k)^2 = r^2$, obtenemos centro $C(3, -4)$ y radio $r = \\sqrt{16} = 4$."
  },
  {
    "id": "geoan-04",
    "topic": "geometria_analitica",
    "topicName": "Geometría Analítica",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "Determina las coordenadas del foco de la parábola cuya ecuación canónica es:\n$y^2 = 12x$",
    "options": [
      "$F(3, 0)$",
      "$F(0, 3)$",
      "$F(-3, 0)$",
      "$F(12, 0)$"
    ],
    "correctIndex": 0,
    "explanation": "La ecuación tiene la forma horizontal $y^2 = 4px$ con vértice en el origen $V(0,0)$. Igualando coeficientes: $4p = 12 \\Rightarrow p = \\frac{12}{4} = 3$ Por tanto, el foco se ubica en $F(p, 0) = F(3, 0)$."
  },
  {
    "id": "geoan-05",
    "topic": "geometria_analitica",
    "topicName": "Geometría Analítica",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Dada la ecuación de la elipse:\n$\\frac{x^2}{25} + \\frac{y^2}{9} = 1$\n¿Cuál es la longitud de su eje mayor y la distancia focal $2c$?",
    "options": [
      "$\\text{Eje mayor } = 10, \\quad 2c = 8$",
      "$\\text{Eje mayor } = 5, \\quad 2c = 4$",
      "$\\text{Eje mayor } = 10, \\quad 2c = 6$",
      "$\\text{Eje mayor } = 25, \\quad 2c = 16$"
    ],
    "correctIndex": 0,
    "explanation": "De la ecuación identificamos $a^2 = 25 \\Rightarrow a = 5$ y $b^2 = 9 \\Rightarrow b = 3$. El eje mayor mide $2a = 10$. La semidistancia focal cumple $c = \\sqrt{a^2 - b^2}$: $c = \\sqrt{25 - 9} = \\sqrt{16} = 4 \\Rightarrow 2c = 8$"
  },
  {
    "id": "func-01",
    "topic": "funciones",
    "topicName": "Funciones y Precálculo",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Determina el dominio de la función racional:\n$f(x) = \\frac{2x - 1}{x - 4}$",
    "options": [
      "$\\mathbb{R} \\setminus \\{4\\}$",
      "$\\mathbb{R} \\setminus \\left\\{\\frac{1}{2}\\right\\}$",
      "$[4, \\infty)$",
      "$\\mathbb{R}$"
    ],
    "correctIndex": 0,
    "explanation": "Una función racional está definida en todos los reales salvo donde el denominador se hace cero: $x - 4 = 0 \\Rightarrow x = 4$ Por consiguiente, el dominio es $\\text{Dom}(f) = \\mathbb{R} \\setminus \\{4\\}$."
  },
  {
    "id": "func-02",
    "topic": "funciones",
    "topicName": "Funciones y Precálculo",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "Dadas las funciones $f(x) = 2x^2 + 1$ y $g(x) = 3x - 2$, determina el valor de la composición $(f \\circ g)(2)$:",
    "options": [
      "$33$",
      "$25$",
      "$49$",
      "$27$"
    ],
    "correctIndex": 0,
    "explanation": "Por definición $(f \\circ g)(2) = f(g(2))$. Evaluamos primero $g(2)$: $g(2) = 3(2) - 2 = 6 - 2 = 4$ Ahora sustituimos en $f(x)$: $f(4) = 2(4)^2 + 1 = 2(16) + 1 = 32 + 1 = 33$"
  },
  {
    "id": "func-03",
    "topic": "funciones",
    "topicName": "Funciones y Precálculo",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "intermediate",
    "question": "¿Cuál es la función inversa $f^{-1}(x)$ de la función biyectiva $f(x) = \\frac{3x + 5}{x - 2}$, con $x \\neq 2$?",
    "options": [
      "$f^{-1}(x) = \\frac{2x + 5}{x - 3}$",
      "$f^{-1}(x) = \\frac{x - 2}{3x + 5}$",
      "$f^{-1}(x) = \\frac{3x - 5}{x + 2}$",
      "$f^{-1}(x) = \\frac{2x - 5}{x + 3}$"
    ],
    "correctIndex": 0,
    "explanation": "Sustituimos $f(x)$ por $y$ y despejamos $x$: $y = \\frac{3x + 5}{x - 2} \\Rightarrow y(x - 2) = 3x + 5 \\Rightarrow xy - 2y = 3x + 5$ Agrupando los términos con $x$: $xy - 3x = 2y + 5 \\Rightarrow x(y - 3) = 2y + 5 \\Rightarrow x = \\frac{2y + 5}{y - 3}$ Intercambiando $x$ por $y$, obtenemos: $f^{-1}(x) = \\frac{2x + 5}{x - 3}$"
  },
  {
    "id": "func-04",
    "topic": "funciones",
    "topicName": "Funciones y Precálculo",
    "level": "bachillerato",
    "difficulty": "media",
    "calculator": "none",
    "question": "¿Cuál es el dominio de la función con radical par $f(x) = \\sqrt{3x - 12}$ en los números reales?",
    "options": [
      "$[4, \\infty)$",
      "$(4, \\infty)$",
      "$[-4, \\infty)$",
      "$(-\\infty, 4]$"
    ],
    "correctIndex": 0,
    "explanation": "Para que la raíz cuadrada tome valores reales, el radicando debe ser mayor o igual que cero: $3x - 12 \\ge 0 \\Rightarrow 3x \\ge 12 \\Rightarrow x \\ge \\frac{12}{3} = 4$ Por lo tanto, $\\text{Dom}(f) = [4, \\infty)$."
  },
  {
    "id": "func-05",
    "topic": "funciones",
    "topicName": "Funciones y Precálculo",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Evalúa el siguiente límite indeterminado de la forma $\\frac{0}{0}$:\n$\\lim_{x \\to 4} \\frac{x^2 - 2x - 8}{x - 4}$",
    "options": [
      "$6$",
      "$2$",
      "$4$",
      "$0$"
    ],
    "correctIndex": 0,
    "explanation": "Factorizando el numerador $x^2 - 2x - 8 = (x - 4)(x + 2)$: $\\lim_{x \\to 4} \\frac{(x - 4)(x + 2)}{x - 4} = \\lim_{x \\to 4} (x + 2) = 4 + 2 = 6$"
  },
  {
    "id": "calc-01",
    "topic": "calculo_diferencial",
    "topicName": "Cálculo Diferencial",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Calcula el siguiente límite:\n$\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$",
    "options": [
      "$6$",
      "$0$",
      "$3$",
      "$\\text{No existe}$"
    ],
    "correctIndex": 0,
    "explanation": "Al evaluar directamente obtenemos la indeterminación $\\frac{0}{0}$. Factorizamos la diferencia de cuadrados en el numerador: $\\lim_{x \\to 3} \\frac{(x - 3)(x + 3)}{x - 3} = \\lim_{x \\to 3} (x + 3) = 3 + 3 = 6$"
  },
  {
    "id": "calc-02",
    "topic": "calculo_diferencial",
    "topicName": "Cálculo Diferencial",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "Encuentra la derivada de la función:\n$f(x) = (3x^2 - 5x + 2)^4$",
    "options": [
      "$f'(x) = 4(6x - 5)(3x^2 - 5x + 2)^3$",
      "$f'(x) = 4(3x^2 - 5x + 2)^3$",
      "$f'(x) = (24x - 20)(3x^2 - 5x + 2)^4$",
      "$f'(x) = 12x(3x^2 - 5x + 2)^3$"
    ],
    "correctIndex": 0,
    "explanation": "Aplicando la regla de la cadena $\\frac{d}{dx}[u^n] = n u^{n-1} \\cdot u'$: $f'(x) = 4(3x^2 - 5x + 2)^3 \\cdot \\frac{d}{dx}(3x^2 - 5x + 2) = 4(6x - 5)(3x^2 - 5x + 2)^3$"
  },
  {
    "id": "calc-03",
    "topic": "calculo_diferencial",
    "topicName": "Cálculo Diferencial",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Determina las coordenadas del punto de inflexión de la función:\n$f(x) = x^3 - 6x^2 + 9x + 2$",
    "options": [
      "$(2, 4)$",
      "$(1, 6)$",
      "$(3, 2)$",
      "$(2, 0)$"
    ],
    "correctIndex": 0,
    "explanation": "Calculamos la primera y segunda derivada: $f'(x) = 3x^2 - 12x + 9, \\qquad f''(x) = 6x - 12$ Igualamos la segunda derivada a cero para hallar el punto de inflexión: $6x - 12 = 0 \\Rightarrow x = 2$ Evaluamos en la función original: $f(2) = (2)^3 - 6(2)^2 + 9(2) + 2 = 8 - 24 + 18 + 2 = 4$ El punto de inflexión es $(2, 4)$."
  },
  {
    "id": "calc-04",
    "topic": "calculo_diferencial",
    "topicName": "Cálculo Diferencial",
    "level": "bachillerato",
    "difficulty": "sencilla",
    "calculator": "none",
    "question": "Calcula la derivada de la función polinomial:\n$f(x) = 5x^4 - 3x^3 + 7x - 9$",
    "options": [
      "$f'(x) = 20x^3 - 9x^2 + 7$",
      "$f'(x) = 20x^3 - 9x^2 + 7x$",
      "$f'(x) = 5x^3 - 3x^2 + 7$",
      "$f'(x) = 20x^4 - 9x^3 + 7$"
    ],
    "correctIndex": 0,
    "explanation": "Aplicando la regla de la potencia $\\frac{d}{dx}[cx^n] = cnx^{n-1}$ término a término: $f'(x) = 5(4x^3) - 3(3x^2) + 7(1) - 0 = 20x^3 - 9x^2 + 7$"
  },
  {
    "id": "calc-05",
    "topic": "calculo_diferencial",
    "topicName": "Cálculo Diferencial",
    "level": "licenciatura",
    "difficulty": "media",
    "calculator": "none",
    "question": "Determina la primera derivada de la función trigonométrica:\n$f(x) = 3\\sin(4x) - 2\\cos(5x)$",
    "options": [
      "$f'(x) = 12\\cos(4x) + 10\\sin(5x)$",
      "$f'(x) = 12\\cos(4x) - 10\\sin(5x)$",
      "$f'(x) = 3\\cos(4x) + 2\\sin(5x)$",
      "$f'(x) = -12\\cos(4x) + 10\\sin(5x)$"
    ],
    "correctIndex": 0,
    "explanation": "Usando $\\frac{d}{dx}[\\sin(kx)] = k\\cos(kx)$ y $\\frac{d}{dx}[\\cos(kx)] = -k\\sin(kx)$: $f'(x) = 3(4\\cos(4x)) - 2(-5\\sin(5x)) = 12\\cos(4x) + 10\\sin(5x)$"
  },
  {
    "id": "calc-06",
    "topic": "calculo_diferencial",
    "topicName": "Cálculo Diferencial",
    "level": "licenciatura",
    "difficulty": "alta",
    "calculator": "none",
    "question": "Determina el valor de $x$ donde la función $f(x) = x^3 - 3x^2 - 9x + 5$ alcanza su mínimo relativo:",
    "options": [
      "$x = 3$",
      "$x = -1$",
      "$x = 1$",
      "$x = -3$"
    ],
    "correctIndex": 0,
    "explanation": "Hallamos los puntos críticos igualando la primera derivada a cero: $f'(x) = 3x^2 - 6x - 9 = 3(x^2 - 2x - 3) = 3(x - 3)(x + 1) = 0$ Los valores críticos son $x = 3$ y $x = -1$. Aplicando el criterio de la segunda derivada $f''(x) = 6x - 6$: $f''(3) = 6(3) - 6 = 12 \\gt  0 \\Rightarrow \\text{Mínimo relativo en } x = 3$"
  }
];

/* ==========================================================================
   12. ARRANQUE DE LA APLICACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  ThemeManager.init();
  TypographyManager.init();
  MathCanvasBackground.init();
  await ExamEngine.loadQuestions();
  UIManager.init();
  CalculatorManager.init();
  NotificationManager.init();
});
