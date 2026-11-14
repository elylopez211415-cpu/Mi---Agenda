// ===== Utilidades =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const CAT = {
    personal: { n: "Personal", e: "🏠", i: "fa-user", c: "#8b5cf6" },
    trabajo: { n: "Trabajo", e: "💼", i: "fa-briefcase", c: "#3b82f6" },
    estudio: { n: "Estudio", e: "📚", i: "fa-graduation-cap", c: "#f59e0b" },
};
const PRIO = { alta: "Alta", media: "Media", baja: "Baja" };
const PRIOE = { alta: "🔥", media: "⚡", baja: "🌱" };
const FRASES = [
    "Un paso a la vez, pero siempre hacia adelante.",
    "Lo que planificas hoy, mañana lo agradeces.",
    "Hazlo simple, hazlo hoy.",
    "Los pequeños avances también son avances.",
    "Organizarte es regalarte tiempo.",
    "Hoy es un gran día para empezar.",
    "La constancia le gana al talento.",
];
function emojiVacio(li, msg) {
    const i = msg.indexOf(" "), e = document.createElement("span");
    e.className = "emoji";
    e.textContent = msg.slice(0, i);
    li.append(e, msg.slice(i + 1));
}
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// ===== Estado =====
let tareas = leer("agenda-tareas", []);
let notas = leer("agenda-notas", []);
let tema = leer("agenda-tema", matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");
let filtro = "todas", nueva = null, diaSel = iso(new Date());
let color = leer("agenda-color", "violeta");
let mes = new Date(); mes.setDate(1);
const guardar = () => escribir("agenda-tareas", tareas);

// ===== Tema, saludo y fecha =====
function aplicarTema() {
    document.documentElement.dataset.tema = tema;
    document.documentElement.dataset.color = color;
    $("#tema-btn i").className = tema === "oscuro" ? "fas fa-sun" : "fas fa-moon";
    escribir("agenda-tema", tema);
}
$("#tema-btn").onclick = () => { tema = tema === "oscuro" ? "claro" : "oscuro"; aplicarTema(); };

function cabecera() {
    $("#frase").textContent = "💡 " + FRASES[new Date().getDate() % FRASES.length];
    const h = new Date().getHours();
    $("#saludo").textContent = h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
    $("#fecha-actual").textContent = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ===== Tareas =====
function crearItem(t) {
    const li = document.createElement("li");
    li.className = "tarea" + (t.completada ? " completada" : "") + (t.id === nueva ? " nueva" : "");

    const ck = document.createElement("button");
    ck.className = "tarea-check";
    ck.setAttribute("aria-label", "Marcar como completada");
    ck.innerHTML = '<i class="fas fa-check"></i>';
    ck.onclick = () => { t.completada = !t.completada; if (t.completada) confeti(); guardar(); renderTodo(); };

    const info = document.createElement("div");
    info.className = "tarea-info";
    const tx = document.createElement("span");
    tx.className = "tarea-texto";
    tx.textContent = t.texto;

    const meta = document.createElement("div");
    meta.className = "meta";
    const c = CAT[t.cat] || CAT.personal;
    const p = PRIO[t.prio] ? t.prio : "media";
    meta.innerHTML = `<span class="chip" style="color:${c.c}">${c.e} ${c.n}</span><span class="chip ${p}">${PRIOE[p]} ${PRIO[p]}</span>`;
    if (t.fecha) {
        const venc = !t.completada && t.fecha < iso(new Date());
        const f = document.createElement("span");
        f.className = "chip" + (venc ? " vencida" : "");
        f.innerHTML = '📅 ';
        f.append(t.fecha.split("-").reverse().slice(0, 2).join("/"));
        meta.append(f);
    }
    info.append(tx, meta);

    const del = document.createElement("button");
    del.className = "tarea-eliminar";
    del.setAttribute("aria-label", "Eliminar tarea");
    del.innerHTML = '<i class="fas fa-trash-can"></i>';
    del.onclick = () => {
        li.classList.add("saliendo");
        setTimeout(() => { tareas = tareas.filter((x) => x.id !== t.id); guardar(); renderTodo(); }, 250);
    };

    li.append(ck, info, del);
    return li;
}

function llenar(ul, arr, msg) {
    ul.innerHTML = "";
    if (!arr.length) {
        const v = document.createElement("li");
        v.className = "vacio";
        emojiVacio(v, msg);
        ul.append(v);
    }
    arr.forEach((t) => ul.append(crearItem(t)));
}

function renderTareas() {
    const v = tareas.filter((t) => filtro === "pendientes" ? !t.completada : filtro === "completadas" ? t.completada : true);
    llenar($("#lista-tareas"), v,
        filtro === "completadas" ? "🎯 Aún no has completado tareas" : filtro === "pendientes" ? "🎉 ¡No tienes nada pendiente!" : "📝 No hay tareas. ¡Agrega la primera!");
    const pend = tareas.filter((t) => !t.completada).length;
    const pct = tareas.length ? Math.round(((tareas.length - pend) / tareas.length) * 100) : 0;
    $("#contador-tareas").textContent = pend === 1 ? "1 tarea pendiente" : pend + " tareas pendientes";
    $("#pct").textContent = pct + "%";
    $("#barra-fill").style.width = pct + "%";
}

function agregarTarea() {
    const texto = $("#tarea-input").value.trim();
    if (!texto) { $("#tarea-input").focus(); return; }
    const t = { id: Date.now(), texto, completada: false, cat: $("#cat-sel").value, prio: $("#prio-sel").value, fecha: $("#fecha-input").value };
    tareas.unshift(t);
    nueva = t.id;
    $("#tarea-input").value = "";
    $("#fecha-input").value = "";
    guardar();
    renderTodo();
    $("#tarea-input").focus();
}

$("#agregar-btn").onclick = agregarTarea;
$("#tarea-input").addEventListener("keydown", (e) => { if (e.key === "Enter") agregarTarea(); });
$("#limpiar-btn").onclick = () => { tareas = tareas.filter((t) => !t.completada); guardar(); renderTodo(); };
$$(".filtro-btn").forEach((b) => b.onclick = () => {
    $$(".filtro-btn").forEach((x) => x.classList.remove("activo"));
    b.classList.add("activo");
    filtro = b.dataset.filtro;
    renderTareas();
});

// ===== Calendario =====
function renderCal() {
    const y = mes.getFullYear(), m = mes.getMonth(), hoy = iso(new Date());
    $("#cal-mes").textContent = mes.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const g = $("#cal-grid");
    g.innerHTML = "";
    ["L", "M", "X", "J", "V", "S", "D"].forEach((d) => {
        const s = document.createElement("span");
        s.className = "sem";
        s.textContent = d;
        g.append(s);
    });
    for (let i = 0; i < (new Date(y, m, 1).getDay() + 6) % 7; i++) g.append(document.createElement("span"));
    for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
        const f = iso(new Date(y, m, d));
        const b = document.createElement("button");
        b.className = "dia" + (f === hoy ? " hoy" : "") + (f === diaSel ? " sel" : "") + (tareas.some((t) => t.fecha === f) ? " punto" : "");
        b.textContent = d;
        b.onclick = () => { diaSel = f; renderCal(); };
        g.append(b);
    }
    const [Y, M, D] = diaSel.split("-");
    $("#cal-dia").textContent = new Date(+Y, M - 1, +D).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    llenar($("#lista-dia"), tareas.filter((t) => t.fecha === diaSel), "🌤️ Sin tareas para este día");
}
$("#mes-ant").onclick = () => { mes.setMonth(mes.getMonth() - 1); renderCal(); };
$("#mes-sig").onclick = () => { mes.setMonth(mes.getMonth() + 1); renderCal(); };

// ===== Notas =====
function renderNotas() {
    const ul = $("#lista-notas");
    ul.innerHTML = "";
    if (!notas.length) {
        const v = document.createElement("li");
        v.className = "vacio";
        emojiVacio(v, "🗒️ Aún no tienes notas");
        ul.append(v);
    }
    notas.forEach((n) => {
        const li = document.createElement("li");
        li.className = "nota n" + (n.id % 4);
        li.textContent = n.texto;
        const d = document.createElement("button");
        d.className = "nota-del";
        d.setAttribute("aria-label", "Eliminar nota");
        d.innerHTML = '<i class="fas fa-trash-can"></i>';
        d.onclick = () => { notas = notas.filter((x) => x.id !== n.id); escribir("agenda-notas", notas); renderNotas(); };
        li.append(d);
        ul.append(li);
    });
}
$("#nota-btn").onclick = () => {
    const t = $("#nota-input").value.trim();
    if (!t) return;
    notas.unshift({ id: Date.now(), texto: t });
    $("#nota-input").value = "";
    escribir("agenda-notas", notas);
    renderNotas();
};

// ===== Resumen =====
function renderResumen() {
    const tot = tareas.length, h = tareas.filter((t) => t.completada).length, hoy = iso(new Date());
    const ven = tareas.filter((t) => !t.completada && t.fecha && t.fecha < hoy).length;
    const pct = tot ? Math.round((h / tot) * 100) : 0;
    let cats = "";
    Object.keys(CAT).forEach((k) => {
        const n = tareas.filter((t) => t.cat === k).length, p = tot ? Math.round((n / tot) * 100) : 0;
        cats += `<div class="fila-cat"><div>${CAT[k].e} ${CAT[k].n} · <b>${n}</b></div><div class="bar"><i style="width:${p}%;background:${CAT[k].c}"></i></div></div>`;
    });
    $("#resumen").innerHTML = `<div class="anillo" style="--p:${pct}"><span>${pct}%</span></div>
        <div class="stats">
            <div class="stat"><b>${tot}</b><span>Total</span></div>
            <div class="stat"><b>${h}</b><span>Completadas</span></div>
            <div class="stat"><b>${tot - h}</b><span>Pendientes</span></div>
            <div class="stat"><b>${ven}</b><span>Vencidas</span></div>
        </div><h3>Por categoría</h3>${cats}`;
}

// ===== Navegación por pestañas =====
$$(".tabs button").forEach((b) => b.onclick = () => {
    $$(".tabs button").forEach((x) => x.classList.remove("activo"));
    b.classList.add("activo");
    $$(".vista").forEach((v) => v.classList.toggle("activa", v.id === "vista-" + b.dataset.vista));
});

// ===== Confeti =====
function confeti(n = 80) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("#confeti"), x = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    const col = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
    const ps = Array.from({ length: n }, () => ({
        x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.6,
        vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 14 - 4,
        s: Math.random() * 7 + 4, c: col[(Math.random() * col.length) | 0],
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    }));
    let f = 0;
    (function paso() {
        x.clearRect(0, 0, c.width, c.height);
        ps.forEach((p) => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.4; p.r += p.vr;
            x.save(); x.translate(p.x, p.y); x.rotate(p.r);
            x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore();
        });
        if (++f < 110) requestAnimationFrame(paso); else x.clearRect(0, 0, c.width, c.height);
    })();
}

// ===== Color de la app =====
const COLORES = ["violeta", "verde", "rosa", "naranja"];
$("#color-btn").onclick = () => {
    color = COLORES[(COLORES.indexOf(color) + 1) % COLORES.length];
    escribir("agenda-color", color);
    aplicarTema();
};

// ===== Enfoque (Pomodoro) =====
const POMO = { enfoque: 25 * 60, descanso: 5 * 60 };
let pModo = "enfoque", pRest = POMO.enfoque, pId = null, pFin = 0;
let pomos = leer("agenda-pomos", { f: "", n: 0 });
if (pomos.f !== iso(new Date())) pomos = { f: iso(new Date()), n: 0 };

function renderPomo() {
    const m = String(Math.floor(pRest / 60)).padStart(2, "0"), s = String(pRest % 60).padStart(2, "0");
    $("#pomo-tiempo").textContent = m + ":" + s;
    $("#pomo-ini").innerHTML = pId ? '<i class="fas fa-pause"></i> Pausar' : '<i class="fas fa-play"></i> Iniciar';
    $("#pomo-n").textContent = pomos.n;
    $$(".pomo-modo").forEach((b) => b.classList.toggle("activo", b.dataset.modo === pModo));
    $("#pomo-anillo").style.setProperty("--p", Math.round((1 - pRest / POMO[pModo]) * 100));
    document.title = pId ? m + ":" + s + " · Mi Agenda" : "Mi Agenda";
}
function pomoParar() { clearInterval(pId); pId = null; }
$("#pomo-ini").onclick = () => {
    if (pId) { pRest = Math.max(0, Math.round((pFin - Date.now()) / 1000)); pomoParar(); renderPomo(); return; }
    pFin = Date.now() + pRest * 1000;
    pId = setInterval(() => {
        pRest = Math.max(0, Math.round((pFin - Date.now()) / 1000));
        if (pRest <= 0) {
            pomoParar();
            if (pModo === "enfoque") { pomos.n++; escribir("agenda-pomos", pomos); }
            confeti(120);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            pModo = pModo === "enfoque" ? "descanso" : "enfoque";
            pRest = POMO[pModo];
        }
        renderPomo();
    }, 500);
    renderPomo();
};
$("#pomo-reset").onclick = () => { pomoParar(); pRest = POMO[pModo]; renderPomo(); };
$$(".pomo-modo").forEach((b) => b.onclick = () => { pomoParar(); pModo = b.dataset.modo; pRest = POMO[pModo]; renderPomo(); });

// ===== Inicio =====
function renderTodo() { renderTareas(); renderCal(); renderResumen(); nueva = null; }
cabecera();
aplicarTema();
renderTodo();
renderNotas();
renderPomo();

// ===== Service Worker (instalable y sin conexión) =====
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
