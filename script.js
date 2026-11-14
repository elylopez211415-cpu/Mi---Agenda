// ===== Utilidades =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const CAT = {
    personal: { n: "Personal", i: "fa-user", c: "#8b5cf6" },
    trabajo: { n: "Trabajo", i: "fa-briefcase", c: "#3b82f6" },
    estudio: { n: "Estudio", i: "fa-graduation-cap", c: "#f59e0b" },
};
const PRIO = { alta: "Alta", media: "Media", baja: "Baja" };
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// ===== Estado =====
let tareas = leer("agenda-tareas", []);
let notas = leer("agenda-notas", []);
let tema = leer("agenda-tema", matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");
let filtro = "todas", nueva = null, diaSel = iso(new Date());
let mes = new Date(); mes.setDate(1);
const guardar = () => escribir("agenda-tareas", tareas);

// ===== Tema, saludo y fecha =====
function aplicarTema() {
    document.documentElement.dataset.tema = tema;
    $("#tema-btn i").className = tema === "oscuro" ? "fas fa-sun" : "fas fa-moon";
    escribir("agenda-tema", tema);
}
$("#tema-btn").onclick = () => { tema = tema === "oscuro" ? "claro" : "oscuro"; aplicarTema(); };

function cabecera() {
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
    ck.onclick = () => { t.completada = !t.completada; guardar(); renderTodo(); };

    const info = document.createElement("div");
    info.className = "tarea-info";
    const tx = document.createElement("span");
    tx.className = "tarea-texto";
    tx.textContent = t.texto;

    const meta = document.createElement("div");
    meta.className = "meta";
    const c = CAT[t.cat] || CAT.personal;
    const p = PRIO[t.prio] ? t.prio : "media";
    meta.innerHTML = `<span class="chip" style="color:${c.c}"><i class="fas ${c.i}"></i> ${c.n}</span><span class="chip ${p}"><i class="fas fa-flag"></i> ${PRIO[p]}</span>`;
    if (t.fecha) {
        const venc = !t.completada && t.fecha < iso(new Date());
        const f = document.createElement("span");
        f.className = "chip" + (venc ? " vencida" : "");
        f.innerHTML = '<i class="fas fa-calendar-days"></i> ';
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
        v.textContent = msg;
        ul.append(v);
    }
    arr.forEach((t) => ul.append(crearItem(t)));
}

function renderTareas() {
    const v = tareas.filter((t) => filtro === "pendientes" ? !t.completada : filtro === "completadas" ? t.completada : true);
    llenar($("#lista-tareas"), v,
        filtro === "completadas" ? "Aún no has completado tareas" : filtro === "pendientes" ? "¡No tienes nada pendiente!" : "No hay tareas. ¡Agrega la primera!");
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
    llenar($("#lista-dia"), tareas.filter((t) => t.fecha === diaSel), "Sin tareas para este día");
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
        v.textContent = "Aún no tienes notas";
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
        cats += `<div class="fila-cat"><div><i class="fas ${CAT[k].i}" style="color:${CAT[k].c}"></i> ${CAT[k].n} · <b>${n}</b></div><div class="bar"><i style="width:${p}%;background:${CAT[k].c}"></i></div></div>`;
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

// ===== Inicio =====
function renderTodo() { renderTareas(); renderCal(); renderResumen(); nueva = null; }
cabecera();
aplicarTema();
renderTodo();
renderNotas();

// ===== Service Worker (instalable y sin conexión) =====
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
