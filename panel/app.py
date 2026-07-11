import os
import re
import json
import shutil
import time
import webbrowser
from threading import Timer
from flask import Flask, render_template, request, jsonify, send_from_directory

# ── RUTAS ──────────────────────────────────────────────────────────────────────
# app.py vive en /panel/, la web vive un nivel arriba
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))  # .../holasoyambi/panel/
WEB_DIR     = os.path.dirname(BASE_DIR)                   # .../holasoyambi/
AGENDA_JSON = os.path.join(WEB_DIR, "data/agenda_config.json")
IMGS_DIR    = os.path.join(WEB_DIR, "imgs", "index", "agenda")
BGS_DIR     = os.path.join(WEB_DIR, "imgs", "index", "bgs")   # ← carpeta de fondos exclusivos

DOSSIER_JSON     = os.path.join(WEB_DIR, "data", "dossier_config.json")
DOSSIER_HTML     = os.path.join(WEB_DIR, "dossier.html")
DOSSIER_FLYERS   = os.path.join(WEB_DIR, "imgs", "dossier", "flyers")
DOSSIER_OVERLAYS = os.path.join(WEB_DIR, "imgs", "dossier", "overlays")
DOSSIER_SPONSORS = os.path.join(WEB_DIR, "imgs", "dossier", "sponsors")

app = Flask(__name__, 
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))

# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def load_agenda():
    if os.path.exists(AGENDA_JSON):
        try:
            with open(AGENDA_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
            if data:
                return data
        except:
            pass
    return []


def save_agenda_json(entries):
    os.makedirs(os.path.dirname(AGENDA_JSON), exist_ok=True)
    with open(AGENDA_JSON, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=4, ensure_ascii=False)


def inject_into_html(entries):
    """Reemplaza el contenido de main-box en tschedule.html."""
    if not os.path.exists(TSCHEDULE):
        return False, "No se encontró tschedule.html"

    blocks = []
    for e in entries:
        bg    = "bg-exclusivo" if e["tipo"] == "exclusivo" else "bg-standard"

        # ── Estilos inline para exclusivos con BG y color de border propios ──
        # Se usan data-attributes para que load_agenda() pueda leerlos de vuelta
        inline_style = ""
        data_attrs   = ""

        if e["tipo"] == "exclusivo":
            border_color = e.get("border_color", "#d72626") or "#d72626"
            bg_imagen    = e.get("bg_imagen", "")

            # border-top con color personalizado
            inline_style += f"border-top-color:{border_color};"

            # fondo via CSS custom property --bg-url (se resuelve en tschedule.css)
            if bg_imagen:
                inline_style += f"--bg-url:url('../{bg_imagen}');"

            # guardamos los valores en data-attributes para poder releerlos al parsear
            data_attrs = f' data-bg="{bg_imagen}" data-border-color="{border_color}"'

        style_attr = f' style="{inline_style}"' if inline_style else ""

        blocks.append(f"""            <section class="section-twitch-agenda {bg}"{style_attr}{data_attrs}>
                <div class="twitch-banner">

                    <div class="twitch-thumb">
                        <img src="{e['imagen']}" alt="Stream Game">
                    </div>

                    <div class="twitch-divider"></div>

                    <div class="twitch-info">
                        <span class="twitch-date">{e['fecha']}</span>
                        <h3 class="twitch-game">{e['juego']}</h3>
                        <span class="twitch-day">{e['dia']} - {e['hora']}</span>
                        <span class="twitch-type">{e['tipo_stream']}</span>
                    </div>

                    <div class="twitch-actions">
                        <a href="#" class="twitch-btn primary" data-video="{e['video']}">VER TRAILER</a>
                        <!--<a href="#" class="twitch-btn secondary">VER AGENDA</a>-->
                        <a href="https://www.twitch.tv/4mbitv" target="_blank" class="twitch-btn channel">VER CANAL</a>
                    </div>

                </div>
            </section>""")

    new_content = "\n\n".join(blocks)

    try:
        full_html = open(TSCHEDULE, "r", encoding="utf-8").read()
        MARKER    = '<div class="main-box">'
        start_idx = full_html.find(MARKER)
        if start_idx == -1:
            return False, 'No se encontró <div class="main-box">'

        content_start = start_idx + len(MARKER)
        depth, pos    = 1, content_start

        while pos < len(full_html) and depth > 0:
            o = full_html.find("<div",   pos)
            c = full_html.find("</div>", pos)
            if c == -1:
                break
            if o != -1 and o < c:
                depth += 1
                pos    = o + 4
            else:
                depth -= 1
                if depth == 0:
                    content_end = c
                else:
                    pos = c + 6

        # Backup antes de escribir
        shutil.copy2(TSCHEDULE, TSCHEDULE + ".bak")

        updated = full_html[:content_start] + "\n" + new_content + "\n        " + full_html[content_end:]
        open(TSCHEDULE, "w", encoding="utf-8").write(updated)
        return True, "OK"

    except Exception as ex:
        return False, str(ex)


# ══════════════════════════════════════════════════════════════════════════════
# RUTAS FLASK
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/imgs/<path:filename>")
def serve_img(filename):
    return send_from_directory(os.path.join(WEB_DIR, "imgs"), filename)

# ── AGENDA ────────────────────────────────────────────────────────────────────

@app.route("/api/agenda", methods=["GET"])
def api_agenda_get():
    return jsonify(load_agenda())


@app.route("/api/agenda", methods=["POST"])
def api_agenda_save():
    entries = request.json
    try:
        save_agenda_json(entries)
        if os.path.exists(INDEX_HTML):
            os.utime(INDEX_HTML, None)
        return jsonify({"ok": True, "msg": "Guardado correctamente"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/agenda/upload-image", methods=["POST"])
def api_agenda_upload_image():
    """
    Sube imágenes de thumbnail (dest=agenda) o de fondo exclusivo (dest=bgs).
    El campo 'dest' del FormData determina la carpeta destino:
      - 'bgs'    → imgs/index/bgs/
      - cualquier otro (o ausente) → imgs/index/agenda/
    """
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400

    f        = request.files["file"]
    filename = f.filename.lower().replace(" ", "_")
    dest     = request.form.get("dest", "agenda")  # ← lee el campo dest del FormData

    # ── Elige carpeta según destino ──
    if dest == "bgs":
        target_dir = BGS_DIR
        rel_prefix = "imgs/index/bgs"
    else:
        target_dir = IMGS_DIR
        rel_prefix = "imgs/index/agenda"

    os.makedirs(target_dir, exist_ok=True)
    dest_path = os.path.join(target_dir, filename)
    f.save(dest_path)

    return jsonify({"ok": True, "rel": f"{rel_prefix}/{filename}"})


# ══════════════════════════════════════════════════════════════════════════════
# DOSSIER
# ══════════════════════════════════════════════════════════════════════════════

def load_dossier():
    """Carga dossier desde JSON."""
    if os.path.exists(DOSSIER_JSON):
        try:
            with open(DOSSIER_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {"header": {}, "sponsors_intro": "", "campanas": [], "disenos": [], "sponsors": []}


def save_dossier_json(data):
    os.makedirs(os.path.dirname(DOSSIER_JSON), exist_ok=True)
    with open(DOSSIER_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def inject_dossier_html(data):
    """Regenera dossier.html a partir del JSON del dossier."""
    if not os.path.exists(DOSSIER_HTML):
        return False, "No se encontró dossier.html"

    header    = data.get("header", {})
    campanas  = data.get("campanas",  [])
    disenos   = data.get("disenos",   [])
    sponsors  = data.get("sponsors",  [])
    sp_intro  = data.get("sponsors_intro", "")

    # ── HEADER ──
    subtitulo = header.get("subtitulo", "Streamer · Content Creator · Gaming Press")
    stat1_num = header.get("stat1_num", "4+");  stat1_lbl = header.get("stat1_lbl", "Años activo")
    stat2_num = header.get("stat2_num", "60+"); stat2_lbl = header.get("stat2_lbl", "Campañas")
    stat3_num = header.get("stat3_num", "15+"); stat3_lbl = header.get("stat3_lbl", "Studios & Sponsors")

    # ── CAMPAÑAS agrupadas por año ──
    by_anio = {}
    for c in campanas:
        anio = str(c.get("anio", "2026"))
        if anio not in by_anio:
            by_anio[anio] = {"desc": c.get("desc", ""), "items": []}
        by_anio[anio]["items"].append(c)

    campanas_html = ""
    for anio in sorted(by_anio.keys(), reverse=True):
        grupo      = by_anio[anio]
        items_html = ""
        for i in grupo["items"]:
            if i.get("imagen"):
                titulo = i.get("titulo", "")
                caption = '<div class="flyer-caption">' + titulo + '</div>' if titulo else ""
                items_html += '                <div class="flyer-item"><img src="' + i["imagen"] + '" alt="' + titulo + '">' + caption + '</div>\n'
        campanas_html += (
            '\n        <div class="year-block">\n'
            '            <div class="year-header">\n'
            '                <span class="year-num">' + anio + '</span>\n'
            '                <div class="year-divider"></div>\n'
            '                <span class="year-count">' + str(len(grupo["items"])) + ' Campañas</span>\n'
            '            </div>\n'
            '            <p class="year-desc">' + grupo["desc"] + '</p>\n'
            '            <div class="flyers-grid">\n'
            + items_html +
            '            </div>\n'
            '        </div>\n'
        )

    # ── DISEÑOS — agrupados por categoría padre ──
    DISENO_CATS = {
        'Key Art':                '🎮 GAMING',
        'Stream Overlay':         '🎮 GAMING',
        'HUD & Gameplay Overlay': '🎮 GAMING',
        'Gaming Artwork':         '🎮 GAMING',
        'Promo Banners':          '🎮 GAMING',
        'Cinematic Photography':  '📸 PHOTOGRAPHY',
        'Portraits':              '📸 PHOTOGRAPHY',
        'Visual Stories':         '📸 PHOTOGRAPHY',
        'Cinematics':             '🎬 FILMMAKING',
        'Video Editing':          '🎬 FILMMAKING',
        'Motion Design':          '🎬 FILMMAKING',
        'Creative Direction':     '🎨 CREATIVE',
        'Visual Identity':        '🎨 CREATIVE',
        'Artwork & Design':       '🎨 CREATIVE',
    }
    DISENO_PADRES = ['🎨 CREATIVE', '🎬 FILMMAKING', '🎮 GAMING', '📸 PHOTOGRAPHY']

    by_padre = {}
    sin_cat  = []
    for d in disenos:
        if not d.get("imagen"):
            continue
        padre = DISENO_CATS.get(d.get("categoria", ""), None)
        if padre:
            by_padre.setdefault(padre, []).append(d)
        else:
            sin_cat.append(d)

    disenos_html = ""
    grupos_ordenados = [p for p in DISENO_PADRES if p in by_padre]
    if sin_cat:
        grupos_ordenados.append("__sin_categoria__")
        by_padre["__sin_categoria__"] = sin_cat

    for padre in grupos_ordenados:
        items = by_padre[padre]
        titulo_display = "Sin categoría" if padre == "__sin_categoria__" else padre
        items_html = ""
        for d in items:
            caption = d.get("caption", "")
            subcat  = d.get("categoria", "")
            img_src = d["imagen"]
            cap_esc = caption.replace("'", "&#39;")
            sub_esc = subcat.replace("'", "&#39;")
            img_esc = img_src.replace("'", "&#39;")
            badge_html = ('<span class="overlay-badge">' + subcat + '</span>\n                ') if subcat else ""
            items_html += (
                '            <div class="overlay-item" onclick="abrirLightbox(\''  + img_esc + '\',\'' + cap_esc + '\',\'' + sub_esc + '\')" style="cursor:pointer">\n'
                '                ' + badge_html +
                '<img src="' + img_src + '" alt="' + caption + '">\n'
                '                <div class="overlay-caption">' + caption + '</div>\n'
                '            </div>\n'
            )
        disenos_html += (
            '        <div class="diseno-grupo">\n'
            '            <div class="diseno-grupo-header">\n'
            '                <span class="diseno-grupo-titulo">' + titulo_display + '</span>\n'
            '                <div class="diseno-grupo-line"></div>\n'
            '                <span class="diseno-grupo-count">' + str(len(items)) + ' Diseño' + ('s' if len(items) != 1 else '') + '</span>\n'
            '            </div>\n'
            '            <div class="overlays-grid">\n'
            + items_html +
            '            </div>\n'
            '        </div>\n'
        )

    # ── SPONSORS — agrupados por categoría ──
    from collections import OrderedDict
    CAT_ICONS = {
        'Studios':         '🎮',
        'Publishers':      '📦',
        'Partner & Creator Programs': '🤜',
        'Press & Creator': '📢',
        'Marketing / PR':  '📣',
        'Services & Tech': '🛠',
        'Sponsors':        '🤝',
        'Collab':          '🔗',
    }
    by_cat = OrderedDict()
    # Partner & Creator Programs siempre primero
    FIRST_CAT = 'Partner & Creator Programs'
    all_cats = []
    for s in sponsors:
        cat = s.get("categoria") or "Studios"
        if cat not in all_cats:
            all_cats.append(cat)
    sorted_cats = ([FIRST_CAT] if FIRST_CAT in all_cats else []) + sorted([c for c in all_cats if c != FIRST_CAT])
    for cat in sorted_cats:
        by_cat[cat] = [s for s in sponsors if (s.get("categoria") or "Studios") == cat]
    sponsors_html = ""
    for cat, items in by_cat.items():
        count = len(items)
        sponsors_html += (
            '        <div class="sponsor-cat-block">\n'
            '            <div class="sponsor-cat-header">\n'
            '                <span class="sponsor-cat-name">' + CAT_ICONS.get(cat, '') + ' ' + cat + '</span>\n'
            '                <div class="sponsor-cat-line"></div>\n'
            '                <span class="sponsor-cat-count">' + str(count) + ' Entidad' + ('es' if count != 1 else '') + '</span>\n'
            '            </div>\n'
            '            <div class="sponsors-grid">\n'
        )
        for s in items:
            if s.get("imagen"):
                badge = ''
                if cat == FIRST_CAT and s.get("badge"):
                    badge = '<span class="sponsor-badge">' + s["badge"] + '</span>'
                sponsors_html += (
                    '                <div class="sponsor-item-wrap">' + badge +
                    '<a class="sponsor-item" href="' + s.get("url","#") + '" target="_blank" rel="noopener">' +
                    '<img src="' + s["imagen"] + '" alt="' + s.get("nombre","") + '"></a></div>\n'
                )
        sponsors_html += '            </div>\n        </div>\n'

    new_html = (
        '<!DOCTYPE html>\n'
        '<html lang="es">\n'
        '<head>\n'
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>Dossier \xe2\x80\x94 4mbiTV</title>\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;900&display=swap" rel="stylesheet">\n'
        '<link rel="stylesheet" href="css/dossier.css">\n'
        '</head>\n'
        '<body>\n'
        '<div class="dossier-wrap">\n\n'
        '    <div class="dossier-hero">\n'
        '        <div class="dossier-hero-left">\n'
        '            <span class="dossier-kicker">Media Kit &amp; Trayectoria</span>\n'
        '            <h1 class="dossier-name">4mbiTV / GREENHAWK</h1>\n'
        '            <p class="dossier-sub">' + subtitulo + '</p>\n'
        '            <p class="dossier-ceo">CEO · GREENHAWK</p>\n'
        '        </div>\n'
        '        <div class="dossier-stats">\n'
        '            <div class="dossier-stat"><span class="dossier-stat-num">' + stat1_num + '</span><span class="dossier-stat-lbl">' + stat1_lbl + '</span></div>\n'
        '            <div class="dossier-stat"><span class="dossier-stat-num">' + stat2_num + '</span><span class="dossier-stat-lbl">' + stat2_lbl + '</span></div>\n'
        '            <div class="dossier-stat"><span class="dossier-stat-num">' + stat3_num + '</span><span class="dossier-stat-lbl">' + stat3_lbl + '</span></div>\n'
        '        </div>\n'
        '    </div>\n\n'
        '    <nav class="dossier-tabs">\n'
        '        <div class="dossier-tab active" data-tab="campanas">Campañas</div>\n'
        '        <div class="dossier-tab" data-tab="disenos">Diseños</div>\n'
        '        <div class="dossier-tab" data-tab="sponsors">Gaming Network</div>\n'
        '    </nav>\n\n'
        '    <div class="tab-panel active" id="tab-campanas">\n'
        + campanas_html +
        '    </div>\n\n'
        '    <div class="tab-panel" id="tab-disenos">\n'
        + disenos_html +
        '    </div>\n\n'
        '    <div class="tab-panel" id="tab-sponsors">\n'
        '        <span class="block-kicker">Industry Partners</span>\n'
        '        <div class="sponsors-intro-block">\n'
        '            <p class="sponsors-intro">' + sp_intro.replace('\n', '<br>') + '</p>\n'
        + ('            <div class="sponsors-intro-photo"><img src="' + data.get('sponsors_photo','') + '"></div>\n' if data.get('sponsors_photo') else '') +
        '        </div>\n'
        + sponsors_html +
        '    </div>\n\n'
        '</div>\n'
        '<!-- LIGHTBOX -->\n'
        '<div id="lightbox" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;align-items:center;justify-content:center;flex-direction:column;gap:16px" onclick="cerrarLightbox(event)">\n'
        '    <button onclick="cerrarLightbox()" style="position:fixed;top:24px;right:32px;background:none;border:none;color:#fff;font-size:32px;cursor:pointer;line-height:1">✕</button>\n'
        '    <div style="max-width:90vw;max-height:82vh;position:relative">\n'
        '        <img id="lb-img" src="" style="max-width:90vw;max-height:82vh;border-radius:6px;object-fit:contain;display:block">\n'
        '        <span id="lb-badge" style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,.7);color:#22c55e;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:5px 12px;border-radius:4px;border:1px solid rgba(34,197,94,.4)"></span>\n'
        '    </div>\n'
        '    <p id="lb-caption" style="color:#9a9a9a;font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;max-width:700px;text-align:center"></p>\n'
        '</div>\n'
        '<script>\n'
        'function abrirLightbox(src, caption, subcat) {\n'
        '    const lb = document.getElementById(\'lightbox\');\n'
        '    document.getElementById(\'lb-img\').src = src;\n'
        '    document.getElementById(\'lb-caption\').textContent = caption;\n'
        '    const badge = document.getElementById(\'lb-badge\');\n'
        '    badge.textContent = subcat; badge.style.display = subcat ? \'\' : \'none\';\n'
        '    lb.style.display = \'flex\';\n'
        '    document.body.style.overflow = \'hidden\';\n'
        '}\n'
        'function cerrarLightbox(e) {\n'
        '    if (e && e.target !== document.getElementById(\'lightbox\')) return;\n'
        '    document.getElementById(\'lightbox\').style.display = \'none\';\n'
        '    document.getElementById(\'lb-img\').src = \'\';\n'
        '    document.body.style.overflow = \'\';\n'
        '}\n'
        'document.addEventListener(\'keydown\', e => { if (e.key === \'Escape\') cerrarLightbox(); });\n'
        'const tabs   = document.querySelectorAll(\'.dossier-tab\');\n'
        'const panels = document.querySelectorAll(\'.tab-panel\');\n'
        'function activarTab(name) {\n'
        '    tabs.forEach(t   => t.classList.toggle(\'active\', t.dataset.tab === name));\n'
        '    panels.forEach(p => p.classList.toggle(\'active\', p.id === \'tab-\' + name));\n'
        '}\n'
        'tabs.forEach(tab => {\n'
        '    tab.addEventListener(\'click\', () => {\n'
        '        activarTab(tab.dataset.tab);\n'
        '        localStorage.setItem(\'dossier_tab\', tab.dataset.tab);\n'
        '    });\n'
        '});\n'
        'const saved = localStorage.getItem(\'dossier_tab\');\n'
        'if (saved && document.getElementById(\'tab-\' + saved)) activarTab(saved);\n'
        '</script>\n'
        '</body>\n'
        '</html>'
    )

    try:
        shutil.copy2(DOSSIER_HTML, DOSSIER_HTML + ".bak")
        open(DOSSIER_HTML, "w", encoding="utf-8").write(new_html)
        return True, "OK"
    except Exception as ex:
        return False, str(ex)


@app.route("/api/dossier", methods=["GET"])
def api_dossier_get():
    return jsonify(load_dossier())


@app.route("/api/dossier", methods=["POST"])
def api_dossier_save():
    data = request.json
    try:
        save_dossier_json(data)
        ok, msg = inject_dossier_html(data)
        if ok:
            return jsonify({"ok": True,  "msg": "Dossier guardado correctamente"})
        else:
            return jsonify({"ok": False, "msg": msg}), 500
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/dossier/upload-image", methods=["POST"])
def api_dossier_upload_image():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400
    f        = request.files["file"]
    filename = f.filename.lower().replace(" ", "_")
    dest     = request.form.get("dest", "dossier_flyers")
    anio     = request.form.get("anio", "").strip()  # ← año opcional

    dirs = {
        "dossier_flyers":   (DOSSIER_FLYERS,   "imgs/dossier/flyers"),
        "dossier_overlays": (DOSSIER_OVERLAYS, "imgs/dossier/overlays"),
        "dossier_sponsors": (DOSSIER_SPONSORS, "imgs/dossier/sponsors"),
    }
    target_dir, rel_prefix = dirs.get(dest, (DOSSIER_FLYERS, "imgs/dossier/flyers"))

    # Si es un flyer y viene con año, guardar en subcarpeta flyers/2023/ etc.
    if dest == "dossier_flyers" and anio:
        target_dir = os.path.join(target_dir, anio)
        rel_prefix = f"imgs/dossier/flyers/{anio}"

    os.makedirs(target_dir, exist_ok=True)
    f.save(os.path.join(target_dir, filename))
    return jsonify({"ok": True, "rel": f"{rel_prefix}/{filename}"})



# ══════════════════════════════════════════════════════════════════════════════
# INDEX CONFIG
# ══════════════════════════════════════════════════════════════════════════════

INDEX_JSON   = os.path.join(WEB_DIR, "data", "index_config.json")
INDEX_HTML   = os.path.join(WEB_DIR, "index.html")
INDEX_IMGS   = os.path.join(WEB_DIR, "imgs", "index")

def load_index_config():
    if os.path.exists(INDEX_JSON):
        try:
            with open(INDEX_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {}

def save_index_config(data):
    # Merge con config existente para no perder claves no enviadas
    existing = load_index_config()
    existing.update(data)
    os.makedirs(os.path.dirname(INDEX_JSON), exist_ok=True)
    with open(INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=4, ensure_ascii=False)
    return existing


@app.route("/api/index", methods=["GET"])
def api_index_get():
    return jsonify(load_index_config())


@app.route("/api/index", methods=["POST"])
def api_index_save():
    data = request.json
    try:
        save_index_config(data)
        # Toca el index.html para que el live server detecte el cambio y recargue
        if os.path.exists(INDEX_HTML):
            os.utime(INDEX_HTML, None)
        return jsonify({"ok": True, "msg": "Index guardado correctamente"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/index/upload-image", methods=["POST"])
def api_index_upload_image():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400
    f        = request.files["file"]
    filename = f.filename.lower().replace(" ", "_")
    dest     = request.form.get("dest", "index_bg")

    # Bleed agenda — siempre sobrescribe con el mismo nombre fijo
    if dest == "index_bleed":
        target_dir = os.path.join(WEB_DIR, "imgs", "index", "agenda")
        os.makedirs(target_dir, exist_ok=True)
        fixed_path = os.path.join(target_dir, "agenda_over-img.webp")
        f.save(fixed_path)
        return jsonify({"ok": True, "rel": "imgs/index/agenda/agenda_over-img.webp"})

    dest_map = {
        "index_bg":    ("imgs/index/bgs",   "imgs/index/bgs"),
        "index_obj":   ("imgs/index",        "imgs/index"),
        "index_logo":  ("imgs/index",        "imgs/index"),
        "index_thumb": ("imgs/index/agenda", "imgs/index/agenda"),
    }
    subdir, rel_prefix = dest_map.get(dest, ("imgs/index", "imgs/index"))
    target_dir = os.path.join(WEB_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)
    f.save(os.path.join(target_dir, filename))
    return jsonify({"ok": True, "rel": f"{rel_prefix}/{filename}"})

# ══════════════════════════════════════════════════════════════════════════════
# NOTICIAS
# Lee/escribe noticias_config.json en la raíz del sitio web.
# ══════════════════════════════════════════════════════════════════════════════

NOTICIAS_JSON = os.path.join(WEB_DIR, "data", "noticias_config.json")
NOTICIAS_IMGS = os.path.join(WEB_DIR, "imgs", "noticias")
NOTICIA_BODY_IMGS = os.path.join(WEB_DIR, "noticia", "imgs")


def load_noticias():
    if os.path.exists(NOTICIAS_JSON):
        try:
            with open(NOTICIAS_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                return data
        except:
            pass
    return []


def save_noticias_json(data):
    os.makedirs(os.path.dirname(NOTICIAS_JSON), exist_ok=True)
    with open(NOTICIAS_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


@app.route("/api/noticias", methods=["GET"])
def api_noticias_get():
    return jsonify(load_noticias())


@app.route("/api/noticias", methods=["POST"])
def api_noticias_save():
    data = request.json
    if not isinstance(data, list):
        return jsonify({"ok": False, "msg": "Se esperaba un array de noticias"}), 400
    try:
        if os.path.exists(NOTICIAS_JSON):
            shutil.copy2(NOTICIAS_JSON, NOTICIAS_JSON + ".bak")
        save_noticias_json(data)
        return jsonify({"ok": True, "msg": "Noticias guardadas correctamente"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/noticias/upload-image", methods=["POST"])
def api_noticias_upload_image():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400
    f        = request.files["file"]
    filename = f.filename.lower().replace(" ", "_")
    dest     = request.form.get("dest", "portada")

    # Imágenes de cuerpo/galería (texto/imagen/galeria dentro de una noticia)
    if dest == "cuerpo":
        os.makedirs(NOTICIA_BODY_IMGS, exist_ok=True)
        f.save(os.path.join(NOTICIA_BODY_IMGS, filename))
        return jsonify({"ok": True, "rel": f"noticia/imgs/{filename}"})

    # Portada — comportamiento original, sin cambios
    os.makedirs(NOTICIAS_IMGS, exist_ok=True)
    f.save(os.path.join(NOTICIAS_IMGS, filename))
    return jsonify({"ok": True, "rel": f"imgs/noticias/{filename}"})

# ══════════════════════════════════════════════════════════════════════════════
# CREATORPHUNT
# Lee/escribe creatorphunt_config.json en la raíz del sitio web.
# ══════════════════════════════════════════════════════════════════════════════

CREATORPHUNT_JSON = os.path.join(WEB_DIR, "data", "creatorphunt_config.json")
CREATORPHUNT_IMGS = os.path.join(WEB_DIR, "imgs", "index", "creatorPhunt")


def load_creatorphunt():
    if os.path.exists(CREATORPHUNT_JSON):
        try:
            with open(CREATORPHUNT_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {}


def save_creatorphunt_json(data):
    with open(CREATORPHUNT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


@app.route("/api/creatorphunt", methods=["GET"])
def api_creatorphunt_get():
    return jsonify(load_creatorphunt())


@app.route("/api/creatorphunt", methods=["POST"])
def api_creatorphunt_save():
    data = request.json
    try:
        if os.path.exists(CREATORPHUNT_JSON):
            shutil.copy2(CREATORPHUNT_JSON, CREATORPHUNT_JSON + ".bak")
        save_creatorphunt_json(data)
        if os.path.exists(INDEX_HTML):
            os.utime(INDEX_HTML, None)
        return jsonify({"ok": True, "msg": "Hunt Showdown guardado correctamente"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/creatorphunt/upload-image", methods=["POST"])
def api_creatorphunt_upload_image():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400
    f        = request.files["file"]
    filename = f.filename.lower().replace(" ", "_")
    os.makedirs(CREATORPHUNT_IMGS, exist_ok=True)
    f.save(os.path.join(CREATORPHUNT_IMGS, filename))
    return jsonify({"ok": True, "rel": f"imgs/index/creatorPhunt/{filename}"})

# ══════════════════════════════════════════════════════════════════════════════
# TWITCH TOP
# Lee/escribe data/twitch_config.json · guarda imágenes en imgs/index/twitch/
# ══════════════════════════════════════════════════════════════════════════════

TWITCH_TOP_JSON = os.path.join(WEB_DIR, "data", "twitch_config.json")
TWITCH_TOP_IMGS = os.path.join(WEB_DIR, "imgs", "index", "twitch")


def load_twitch_top():
    if os.path.exists(TWITCH_TOP_JSON):
        try:
            with open(TWITCH_TOP_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            pass
    return {"kicker": "", "titulo": "", "cards": [], "footer_texto": []}


@app.route("/api/twitch-top", methods=["GET"])
def api_twitch_top_get():
    return jsonify(load_twitch_top())


@app.route("/api/twitch-top", methods=["POST"])
def api_twitch_top_save():
    data = request.json
    try:
        if os.path.exists(TWITCH_TOP_JSON):
            shutil.copy2(TWITCH_TOP_JSON, TWITCH_TOP_JSON + ".bak")
        os.makedirs(os.path.dirname(TWITCH_TOP_JSON), exist_ok=True)
        with open(TWITCH_TOP_JSON, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        if os.path.exists(INDEX_HTML):
            os.utime(INDEX_HTML, None)
        return jsonify({"ok": True, "msg": "Twitch guardado correctamente"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/twitch-top/upload-image", methods=["POST"])
def api_twitch_top_upload_image():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400
    f = request.files["file"]

    # Nombre original saneado (minúsculas, espacios → guion bajo)
    original = f.filename.lower().replace(" ", "_")
    name, ext = os.path.splitext(original)

    # BUGFIX: antes se guardaba con el nombre original tal cual, así que si
    # dos cards distintas subían un archivo con el mismo nombre (típico si tu
    # herramienta de diseño siempre exporta con el mismo nombre, ej.
    # "igcamp-feed_webp.webp"), la segunda pisaba el archivo de la primera y
    # las dos terminaban mostrando la misma imagen. Le agregamos un sufijo
    # único (timestamp en milisegundos) para que cada upload sea un archivo
    # físico distinto, sin importar el nombre original.
    unique_suffix = str(int(time.time() * 1000))
    filename = f"{name}_{unique_suffix}{ext}"

    os.makedirs(TWITCH_TOP_IMGS, exist_ok=True)
    f.save(os.path.join(TWITCH_TOP_IMGS, filename))
    return jsonify({"ok": True, "rel": f"imgs/index/twitch/{filename}"})

# ══════════════════════════════════════════════════════════════════════════════
# REPRODUCTOR
# Lee/escribe data/player_config.json · guarda MP3 en audio/ (raíz del sitio)
# ══════════════════════════════════════════════════════════════════════════════

PLAYER_JSON = os.path.join(WEB_DIR, "data", "player_config.json")
AUDIO_DIR   = os.path.join(WEB_DIR, "audio")


def load_player():
    if os.path.exists(PLAYER_JSON):
        try:
            with open(PLAYER_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                return data
        except:
            pass
    return []


def save_player_json(data):
    os.makedirs(os.path.dirname(PLAYER_JSON), exist_ok=True)
    with open(PLAYER_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


@app.route("/api/player", methods=["GET"])
def api_player_get():
    return jsonify(load_player())


@app.route("/api/player", methods=["POST"])
def api_player_save():
    data = request.json
    if not isinstance(data, list):
        return jsonify({"ok": False, "msg": "Se esperaba un array de temas"}), 400
    try:
        if os.path.exists(PLAYER_JSON):
            shutil.copy2(PLAYER_JSON, PLAYER_JSON + ".bak")
        save_player_json(data)
        return jsonify({"ok": True, "msg": "Playlist guardada correctamente"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


@app.route("/api/player/upload", methods=["POST"])
def api_player_upload():
    if "file" not in request.files:
        return jsonify({"ok": False, "msg": "No se recibió archivo"}), 400
    f        = request.files["file"]
    filename = f.filename.lower().replace(" ", "_")
    os.makedirs(AUDIO_DIR, exist_ok=True)
    f.save(os.path.join(AUDIO_DIR, filename))
    return jsonify({"ok": True, "rel": f"audio/{filename}"})


@app.route("/api/player/<int:idx>", methods=["DELETE"])
def api_player_delete(idx):
    playlist = load_player()
    if idx < 0 or idx >= len(playlist):
        return jsonify({"ok": False, "msg": "Índice fuera de rango"}), 404
    removed = playlist.pop(idx)
    try:
        save_player_json(playlist)
        return jsonify({"ok": True, "msg": f"Eliminado: {removed.get('name')} — {removed.get('track')}"})
    except Exception as ex:
        return jsonify({"ok": False, "msg": str(ex)}), 500


# Sirve los MP3 desde audio/ (igual que /imgs/ sirve imágenes)
@app.route("/audio/<path:filename>")
def serve_audio(filename):
    return send_from_directory(AUDIO_DIR, filename)

# ══════════════════════════════════════════════════════════════════════════════
# BOTÓN DE CIERRE DEL PANEL
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/shutdown", methods=["POST"])
def shutdown():
    os.kill(os.getpid(), 9)
    return '', 204


# ══════════════════════════════════════════════════════════════════════════════
# ARRANQUE
# ══════════════════════════════════════════════════════════════════════════════

def open_browser():
    webbrowser.open("http://127.0.0.1:5000")

if __name__ == "__main__":
    # El auto-reloader de Flask (activado por debug=True) reinicia este
    # script como subproceso, así que sin este chequeo el navegador se
    # abriría dos veces. WERKZEUG_RUN_MAIN solo está seteado en el
    # proceso "real" que sirve la app, no en el proceso vigía
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        Timer(1.0, open_browser).start()
    # debug=True activa TEMPLATES_AUTO_RELOAD (Jinja2 vuelve a leer
    # index.html del disco en cada request en vez de cachearlo en memoria)
    # y el auto-reloader de Flask, que reinicia el proceso solo cuando
    # detecta cambios en app.py. Esto es lo que resuelve el problema de
    # tener que apagar/prender el panel a mano para ver cambios en index.html
    app.run(debug=True, port=5000)