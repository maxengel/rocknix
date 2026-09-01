/* SPDX-License-Identifier: GPL-2.0
 * Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)
 *
 * cloud-signin-window - one fullscreen web view, for one job.
 *
 * A cloud provider's OAuth redirect goes to http://localhost:<port>, which
 * resolves on whichever machine is running the browser. If that is the
 * player's phone, nothing is listening and they land on an error page they
 * have to copy an address out of. So the browser runs here instead, where
 * rclone's authorize listener actually is, and the player drives it from
 * their phone over VNC.
 *
 * This is deliberately not a browser. There is no address bar, no tabs, no
 * downloads, and navigation is refused outside the provider's own host and
 * the loopback redirect -- a handheld should not become a way to browse the
 * web because we needed somebody to sign in to Dropbox.
 *
 *   cloud-signin-window <url> <allowed-host>
 */

#include <gtk/gtk.h>
#include <webkit2/webkit2.h>
#include <string.h>

#define OSK_ROWS 4
#define OSK_COLS 11

static const char *allowed_host = NULL;

static gboolean host_permitted(const char *host)
{
    if (!host)
        return FALSE;
    if (g_strcmp0(host, "localhost") == 0 || g_strcmp0(host, "127.0.0.1") == 0)
        return TRUE;
    if (!allowed_host)
        return TRUE;
    /* the host itself, or any subdomain of it: providers bounce sign-ins
     * through their own auth and CDN subdomains constantly. */
    size_t hl = strlen(host), al = strlen(allowed_host);
    if (hl == al && g_ascii_strcasecmp(host, allowed_host) == 0)
        return TRUE;
    return hl > al && host[hl - al - 1] == '.'
        && g_ascii_strcasecmp(host + hl - al, allowed_host) == 0;
}

/* An on-screen keyboard, because the handheld has no touchscreen and typing
 * from a phone is meant to be optional rather than required. Consoles solve
 * this the same way: a grid walked with the d-pad and pressed with A. GTK
 * moves focus between the buttons on its own, so the d-pad drives it with no
 * extra handling.
 *
 * Keys go in as GDK key events rather than being written into the DOM. A
 * provider's login form watches keystrokes -- validating an address as it is
 * typed, enabling the button, moving focus -- and text poked straight into a
 * field arrives with none of that having happened.
 */
typedef struct {
    GtkWidget *revealer;
    GtkWidget *hints;
    const char *exit_hint;
    gboolean auto_raise;
    WebKitWebView *view;
    GtkWidget *keys[OSK_ROWS + 1][OSK_COLS];   /* +1: the extras row */
    int row, col;
    gboolean shift;
    char last_field[256];
} Osk;

/* Two layouts rather than a modifier: a sign-in needs capitals for an address
 * and punctuation for a password, and a shift that only latches for one key is
 * a mechanism to explain on a screen with no room to explain it. */
static const char *OSK_LOWER[OSK_ROWS] = {
    "1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm.-_",
};
static const char *OSK_UPPER[OSK_ROWS] = {
    "!@#$%^&*()", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM+?/",
};
static const char *OSK_EXTRAS[] = { "shift", "space", "@", "del", "enter", "hide" };

/* Sized for a four-inch screen held at arm's length, and dark because it sits
 * under a page that is usually white -- a keyboard that flashes the screen
 * bright every time it appears is the thing people turn the brightness down
 * to avoid. The selected key is drawn by osk-sel, not by GTK's focus ring:
 * nothing here ever holds focus. */
static const char *OSK_CSS =
    "#osk { background: #14171c; padding: 6px; }"
    "#osk button {"
    "  background-image: none; background-color: #262b33;"
    "  color: #e8ecf2; border: 1px solid #333a45; border-radius: 5px;"
    "  padding: 6px 2px; margin: 0; min-height: 30px; min-width: 20px;"
    "  font-size: 16px; text-shadow: none;"
    "}"
    "#osk button.osk-sel {"
    "  background-color: #f0f3f8; color: #14171c;"
    "  border: 2px solid #ffffff; font-weight: bold;"
    "}"
    "#hints { background: #0d1014; color: #93a0b4; font-size: 12px;"
    "         padding: 4px 8px; }";

static void osk_type(Osk *osk, guint keyval)
{
    /* The WebView holds GTK focus the whole time the keyboard is up -- the
     * keys never take it. A WebView that loses focus blurs the field the
     * player is typing into, and a character delivered to a blurred field
     * goes nowhere; the d-pad is intercepted in on_key instead, which is
     * what makes keeping focus here possible. */
    GtkWidget *target = GTK_WIDGET(osk->view);
    GdkWindow *gdkwin = gtk_widget_get_window(target);
    if (!gdkwin)
        return;

    for (int press = 1; press >= 0; press--) {
        GdkEvent *event = gdk_event_new(press ? GDK_KEY_PRESS : GDK_KEY_RELEASE);
        event->key.window = g_object_ref(gdkwin);
        event->key.send_event = TRUE;
        event->key.time = GDK_CURRENT_TIME;
        event->key.keyval = keyval;
        event->key.state = 0;
        gtk_main_do_event(event);
        gdk_event_free(event);
    }
}

static void osk_relabel(Osk *osk);
static void osk_highlight(Osk *osk);
static void osk_type(Osk *osk, guint keyval);

/* Y found no overlay, so it does what it says on the help bar and steps to
 * the next control. Answering in the callback rather than sending Tab up
 * front matters: sending both would skip a control every time an overlay was
 * present. */
static void on_jump_done(GObject *source, GAsyncResult *result, gpointer data)
{
    JSCValue *value = webkit_web_view_evaluate_javascript_finish(
        WEBKIT_WEB_VIEW(source), result, NULL);
    if (!value)
        return;

    char *text = jsc_value_to_string(value);
    if (g_strcmp0(text, "none") == 0)
        osk_type((Osk *) data, GDK_KEY_Tab);
    g_free(text);
    g_object_unref(value);
}

/* The help bar has to describe the buttons as they behave at this moment. It
 * said "B back" while the keyboard was up, where B closes the keyboard and
 * goes nowhere -- a help line that is wrong is worse than no help line, since
 * it is believed. */
static void osk_hints(Osk *osk)
{
    gboolean up = gtk_revealer_get_reveal_child(GTK_REVEALER(osk->revealer));
    char *text = up
        ? g_strdup_printf("A press key     B or X close keyboard     "
                          "L1/R1 scroll     %s to exit", osk->exit_hint)
        : g_strdup_printf("A select     B back     X keyboard     "
                          "Y next     L1/R1 scroll     %s to exit",
                          osk->exit_hint);
    if (osk->hints)
        gtk_label_set_text(GTK_LABEL(osk->hints), text);
    g_free(text);
}

static void osk_hide(Osk *osk)
{
    gtk_revealer_set_reveal_child(GTK_REVEALER(osk->revealer), FALSE);
    gtk_widget_grab_focus(GTK_WIDGET(osk->view));
    osk_hints(osk);
}

static void osk_show(Osk *osk)
{
    gtk_revealer_set_reveal_child(GTK_REVEALER(osk->revealer), TRUE);
    gtk_widget_grab_focus(GTK_WIDGET(osk->view));
    osk_highlight(osk);
    osk_hints(osk);
}

/* One entry point for a key, whether it arrived from the d-pad or from a
 * finger. Touchscreen handhelds exist and the buttons stay clickable; they
 * are set can-focus=FALSE so a tap cannot steal focus from the page. */
static void osk_press(Osk *osk, const char *label)
{
    if (g_strcmp0(label, "hide") == 0)       { osk_hide(osk); return; }
    if (g_strcmp0(label, "shift") == 0)      { osk->shift = !osk->shift;
                                               osk_relabel(osk); return; }
    if (g_strcmp0(label, "space") == 0)      { osk_type(osk, GDK_KEY_space); return; }
    if (g_strcmp0(label, "del") == 0)        { osk_type(osk, GDK_KEY_BackSpace); return; }
    if (g_strcmp0(label, "enter") == 0)      { osk_type(osk, GDK_KEY_Return); return; }
    if (!*label)
        return;
    osk_type(osk, gdk_unicode_to_keyval((guint) g_utf8_get_char(label)));
}

static void on_osk_clicked(GtkButton *button, gpointer data)
{
    osk_press(data, gtk_button_get_label(button));
}

static void osk_relabel(Osk *osk)
{
    const char **rows = osk->shift ? OSK_UPPER : OSK_LOWER;
    for (int r = 0; r < OSK_ROWS; r++)
        for (int c = 0; c < OSK_COLS && osk->keys[r][c]; c++) {
            const char *src = rows[r];
            if ((int) strlen(src) <= c)
                continue;
            char label[2] = { src[c], 0 };
            gtk_button_set_label(GTK_BUTTON(osk->keys[r][c]), label);
        }
}

/* The selected key is drawn by us, not by GTK's focus ring, because nothing
 * in the keyboard ever holds focus. */
static void osk_highlight(Osk *osk)
{
    for (int r = 0; r < OSK_ROWS + 1; r++)
        for (int c = 0; c < OSK_COLS; c++) {
            GtkWidget *w = osk->keys[r][c];
            if (!w)
                continue;
            GtkStyleContext *ctx = gtk_widget_get_style_context(w);
            if (r == osk->row && c == osk->col)
                gtk_style_context_add_class(ctx, "osk-sel");
            else
                gtk_style_context_remove_class(ctx, "osk-sel");
        }
}

static int osk_row_len(Osk *osk, int row)
{
    int n = 0;
    for (int c = 0; c < OSK_COLS && osk->keys[row][c]; c++)
        n++;
    return n;
}

static void osk_move(Osk *osk, int dr, int dc)
{
    int rows = OSK_ROWS + 1;
    osk->row = (osk->row + dr + rows) % rows;
    int len = osk_row_len(osk, osk->row);
    if (len == 0)
        return;
    if (dr != 0 && osk->col >= len)
        osk->col = len - 1;
    if (dc != 0)
        osk->col = (osk->col + dc + len) % len;
    osk_highlight(osk);
}

static GtkWidget *osk_build(Osk *osk)
{
    GtkWidget *box = gtk_box_new(GTK_ORIENTATION_VERTICAL, 4);
    gtk_widget_set_name(box, "osk");

    for (int r = 0; r < OSK_ROWS; r++) {
        GtkWidget *row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 4);
        int c = 0;
        for (const char *p = OSK_LOWER[r]; *p && c < OSK_COLS; p++, c++) {
            char label[2] = { *p, 0 };
            GtkWidget *b = gtk_button_new_with_label(label);
            gtk_widget_set_can_focus(b, FALSE);
            g_signal_connect(b, "clicked", G_CALLBACK(on_osk_clicked), osk);
            gtk_box_pack_start(GTK_BOX(row), b, TRUE, TRUE, 0);
            osk->keys[r][c] = b;
        }
        gtk_box_pack_start(GTK_BOX(box), row, FALSE, FALSE, 0);
    }

    GtkWidget *row = gtk_box_new(GTK_ORIENTATION_HORIZONTAL, 4);
    for (guint i = 0; i < G_N_ELEMENTS(OSK_EXTRAS) && i < OSK_COLS; i++) {
        GtkWidget *b = gtk_button_new_with_label(OSK_EXTRAS[i]);
        gtk_widget_set_can_focus(b, FALSE);
        g_signal_connect(b, "clicked", G_CALLBACK(on_osk_clicked), osk);
        gtk_box_pack_start(GTK_BOX(row), b, TRUE, TRUE, 0);
        osk->keys[OSK_ROWS][i] = b;
    }
    gtk_box_pack_start(GTK_BOX(box), row, FALSE, FALSE, 0);
    return box;
}

/* Raise the keyboard when the page puts the caret in a text field, and do it
 * once per field. A handheld with a touchscreen focuses a field by being
 * tapped and one without does it by pressing A on it; neither is a moment
 * where the player should have to know that X exists. */
/* GtkSpinner draws from the icon theme, and this image ships no pixbuf
 * loaders for it -- "Could not load a pixbuf from .../process-working-
 * symbolic.png". It renders nothing at all, silently, which is why the
 * loading screen was a line of text on an empty page. Cairo is always
 * there. */
typedef struct { double phase; } Spin;

static gboolean on_spin_draw(GtkWidget *widget, cairo_t *cr, gpointer data)
{
    Spin *spin = data;
    int w = gtk_widget_get_allocated_width(widget);
    int h = gtk_widget_get_allocated_height(widget);
    double r = (MIN(w, h) / 2.0) - 4.0;

    cairo_set_line_width(cr, 4.0);
    cairo_set_line_cap(cr, CAIRO_LINE_CAP_ROUND);

    cairo_set_source_rgba(cr, 0.0, 0.0, 0.0, 0.10);
    cairo_arc(cr, w / 2.0, h / 2.0, r, 0, 2 * G_PI);
    cairo_stroke(cr);

    cairo_set_source_rgba(cr, 0.10, 0.12, 0.15, 0.85);
    cairo_arc(cr, w / 2.0, h / 2.0, r, spin->phase, spin->phase + G_PI / 2.0);
    cairo_stroke(cr);
    return FALSE;
}

static gboolean on_spin_tick(gpointer widget)
{
    Spin *spin = g_object_get_data(G_OBJECT(widget), "spin");
    spin->phase += 0.22;
    if (spin->phase > 2 * G_PI)
        spin->phase -= 2 * G_PI;
    gtk_widget_queue_draw(GTK_WIDGET(widget));
    return G_SOURCE_CONTINUE;
}

static void on_probe(GObject *source, GAsyncResult *result, gpointer data)
{
    Osk *osk = data;
    GError *error = NULL;
    JSCValue *value = webkit_web_view_evaluate_javascript_finish(
        WEBKIT_WEB_VIEW(source), result, &error);

    if (!value) {
        if (error) {
            if (g_getenv("CLOUD_SIGNIN_DEBUG"))
                g_message("probe failed: %s", error->message);
            g_error_free(error);
        }
        return;
    }

    char *text = jsc_value_to_string(value);
    if (g_getenv("CLOUD_SIGNIN_DEBUG"))
        g_message("probe %s", text);

    if (osk && text && g_str_has_prefix(text, "text:")) {
        const char *field = text + 5;
        /* Only on a change of field. Re-raising a keyboard the player just
         * dismissed, every two seconds, would be worse than never raising
         * it. */
        if (g_strcmp0(field, osk->last_field) != 0) {
            g_strlcpy(osk->last_field, field, sizeof(osk->last_field));
            /* Not for somebody who chose to type on their phone: they asked
             * for the other keyboard, and this one only takes up the screen
             * they are reading the form on. X still summons it. */
            if (osk->auto_raise
                && !gtk_revealer_get_reveal_child(GTK_REVEALER(osk->revealer)))
                osk_show(osk);
        }
    } else if (osk) {
        osk->last_field[0] = 0;
    }

    g_free(text);
    g_object_unref(value);
}

static gboolean probe_tick(gpointer data)
{
    Osk *osk = data;
    static const char *script =
        "(function () {"
        "  var a = document.activeElement;"
        /* A provider moves from email to password without loading a page, and
         * leaves focus on the body. Nothing then has the caret, so the
         * on-screen keyboard has nowhere to type and spatial navigation has
         * no anchor to move from -- the password box cannot be selected at
         * all, which is where a real sign-in stopped. Adopt a field when the
         * page has abandoned focus, never when something else holds it. */
        "  if (!a || a === document.body || a.tagName === 'BODY') {"
        "    var boxes = document.querySelectorAll("
        "      'input[type=text],input[type=email],input[type=password],"
        "       input[type=tel],input[type=url],input:not([type]),textarea');"
        "    for (var i = 0; i < boxes.length; i++) {"
        "      var b = boxes[i], r = b.getBoundingClientRect();"
        "      if (!r.width || !r.height || b.disabled || b.readOnly) continue;"
        "      if (r.bottom < 0 || r.top > innerHeight) continue;"
        "      b.focus();"
        "      a = document.activeElement;"
        "      break;"
        "    }"
        "  }"
        "  if (!a) return 'none';"
        "  var t = (a.tagName || '').toUpperCase();"
        "  var ty = (a.type || 'text').toLowerCase();"
        "  var typed = t === 'TEXTAREA' || a.isContentEditable ||"
        "              (t === 'INPUT' && ['text','email','password','search',"
        "               'url','tel','number'].indexOf(ty) >= 0);"
        "  if (!typed) return 'other:' + t;"
        "  return 'text:' + t + '/' + ty + '/' + (a.id || a.name || '?');"
        "})();";

    /* Nothing to ask while the keyboard is being driven -- and asking anyway
     * is how this oscillates, since a page can report a different active
     * element the moment the caret moves. */
    webkit_web_view_evaluate_javascript(osk->view, script, -1,
                                        NULL, NULL, NULL, on_probe, osk);
    return G_SOURCE_CONTINUE;
}

/* Instrumentation, kept deliberately. Keystrokes arriving from the phone go
 * uinput -> kernel -> libinput -> sway -> here, and when they stopped landing
 * every hop but the last could be proven individually. Without this line
 * there is no way to tell "sway never delivered it" from "the page had
 * nothing focused". */
static gboolean on_key(GtkWidget *widget, GdkEventKey *event, gpointer data)
{
    if (g_getenv("CLOUD_SIGNIN_DEBUG"))
        g_message("key %s (%u)", event->string && *event->string ? event->string : "?",
                  event->keyval);

    /* A way out, always. The handheld's buttons are not a keyboard -- sway
     * reports the gamepad as a tablet_pad -- so without something mapping
     * them, this window covers the screen, cannot be driven from the device
     * and cannot be closed. cloud_oauth maps Start to Escape; this is what
     * receives it. */
    if (event->keyval == GDK_KEY_Escape) {
        gtk_main_quit();
        return TRUE;
    }

    Osk *osk = data;
    if (!osk)
        return FALSE;

    /* Y. Tab reaches everything the page can focus, but a consent banner is
     * pinned to the viewport and sits at the end of the document, so getting
     * to it costs about ten presses -- and the d-pad never gets there at all,
     * because spatial navigation will not descend into a fixed-position
     * element. Measured on Dropbox's own sign-in page: Down stops on the
     * language picker just above the banner.
     *
     * So Y goes to the overlay first if there is one, and behaves as Tab
     * afterwards. Overlays are found by what they are rather than by who
     * published them -- a visible control inside a fixed or sticky box --
     * because a rule per provider is a rule that rots. */
    if (event->keyval == GDK_KEY_F4) {
        static const char *jump =
            "(function () {"
            "  var all = document.querySelectorAll("
            "    'button,[role=button],a[href],input,select,textarea');"
            "  var ov = [];"
            "  for (var i = 0; i < all.length; i++) {"
            "    var e = all[i], r = e.getBoundingClientRect();"
            "    if (!r.width || !r.height) continue;"
            "    if (r.bottom < 0 || r.top > innerHeight) continue;"
            "    var n = e, fixed = false;"
            "    while (n && n !== document.body) {"
            "      var pos = getComputedStyle(n).position;"
            "      if (pos === 'fixed' || pos === 'sticky') { fixed = true; break; }"
            "      n = n.parentElement;"
            "    }"
            "    if (fixed) ov.push(e);"
            "  }"
            "  if (!ov.length) return 'none';"
            "  var at = ov.indexOf(document.activeElement);"
            "  var next;"
            "  if (at >= 0) {"
            "    next = ov[(at + 1) % ov.length];"
            "  } else {"
            "    next = ov.find(function (e) {"
            "      return e.tagName === 'BUTTON'"
            "          || e.getAttribute('role') === 'button';"
            "    }) || ov[0];"
            "  }"
            "  next.focus();"
            "  return 'overlay';"
            "})();";
        webkit_web_view_evaluate_javascript(osk->view, jump, -1,
                                            NULL, NULL, NULL,
                                            on_jump_done, osk);
        return TRUE;
    }

    /* L1 and R1, mapped to F2/F3 by cloud_oauth. Scrolling is done in the
     * page rather than by sending Page_Up, because Page_Up does nothing at
     * all while a text field has the caret -- which is most of the time on a
     * sign-in form, and exactly when the button below the fold is the thing
     * that cannot be reached. */
    if (event->keyval == GDK_KEY_F2 || event->keyval == GDK_KEY_F3) {
        const char *js = event->keyval == GDK_KEY_F2
            ? "window.scrollBy({top: -Math.round(innerHeight*0.7), behavior:'smooth'});"
            : "window.scrollBy({top:  Math.round(innerHeight*0.7), behavior:'smooth'});";
        webkit_web_view_evaluate_javascript(osk->view, js, -1,
                                            NULL, NULL, NULL, NULL, NULL);
        return TRUE;
    }

    /* X on the handheld, mapped to F1. */
    gboolean showing = gtk_revealer_get_reveal_child(GTK_REVEALER(osk->revealer));
    if (event->keyval == GDK_KEY_F1) {
        if (showing)
            osk_hide(osk);
        else
            osk_show(osk);
        return TRUE;
    }

    /* While the keyboard is up the d-pad walks its keys and A presses one.
     * These are intercepted here, before the page sees them, which is what
     * lets the WebView keep focus throughout -- see osk_type. B closes the
     * keyboard rather than navigating back, because with a keyboard open
     * that is what B means everywhere else. */
    if (showing) {
        switch (event->keyval) {
        case GDK_KEY_Up:    osk_move(osk, -1,  0); return TRUE;
        case GDK_KEY_Down:  osk_move(osk,  1,  0); return TRUE;
        case GDK_KEY_Left:  osk_move(osk,  0, -1); return TRUE;
        case GDK_KEY_Right: osk_move(osk,  0,  1); return TRUE;
        case GDK_KEY_Return:
        case GDK_KEY_KP_Enter: {
            GtkWidget *key = osk->keys[osk->row][osk->col];
            if (key)
                osk_press(osk, gtk_button_get_label(GTK_BUTTON(key)));
            return TRUE;
        }
        case GDK_KEY_BackSpace:
            osk_hide(osk);
            return TRUE;
        default:
            break;
        }
    }
    return FALSE;
}

/* WebKit only routes keys to the page when the WebView itself holds GTK
 * focus. A window can be focused by the compositor -- sway reported
 * focused=true -- while the widget inside it never took focus, which looks
 * exactly like the keyboard not working. The page may also move focus during
 * load, so this reasserts once the load settles. */
static void on_load_changed(WebKitWebView *view, WebKitLoadEvent event,
                            gpointer data)
{
    if (event != WEBKIT_LOAD_FINISHED)
        return;

    GtkWidget *stack = g_object_get_data(G_OBJECT(view), "stack");
    if (stack)
        gtk_stack_set_visible_child_name(GTK_STACK(stack), "page");

    gtk_widget_grab_focus(GTK_WIDGET(view));

    /* Focusing the widget is not enough: the page itself has to have an
     * element focused or the characters go nowhere, which is exactly what a
     * broken keyboard looks like. Putting the cursor in the first real field
     * is also what somebody would expect on opening a sign-in page -- they
     * should be able to start typing without hunting for the box, whether
     * they are typing on the handheld or from their phone.
     *
     * Skipped for hidden, disabled and consent-banner fields, and the page is
     * left alone if it has already focused something itself. */
    /* Poll from inside the page rather than focusing once. LOAD_FINISHED
     * fires when the document is done, but a provider's sign-in form is
     * rendered by script after that -- so a single querySelector at load
     * time finds nothing, focuses nothing, and every keystroke afterwards
     * goes into a page with no cursor in it. That looked exactly like a
     * broken keyboard and cost a debugging session.
     *
     * Gives up after ten seconds so a page that genuinely has no field does
     * not keep a timer alive for the life of the window. */
    static const char *focus_first =
        "(function poll(n) {"
        "  var a = document.activeElement;"
        "  if (a && ['INPUT','TEXTAREA'].indexOf(a.tagName) >= 0) return;"
        "  var f = document.querySelector("
        "    'input[type=email],input[type=text],input[type=password],"
        "     input:not([type]),input[type=tel]');"
        "  if (f && f.offsetParent !== null && !f.disabled) { f.focus(); return; }"
        "  if (n > 0) setTimeout(function () { poll(n - 1); }, 500);"
        "})(20);";
    g_message("load finished, asking the page for a field to focus");
    webkit_web_view_evaluate_javascript(view, focus_first, -1, NULL, NULL,
                                        NULL, NULL, NULL);

    /* This poll does two jobs. It raises the keyboard when the caret lands in
     * a text field, and under CLOUD_SIGNIN_DEBUG it reports what the page
     * actually holds rather than what it looks like it holds -- keystroke
     * delivery has three places it can fail silently, and a screenshot only
     * shows the last one, since an empty box looks identical whether nothing
     * arrived, something arrived and was rejected, or the caret is in a
     * different element than the one drawing a focus ring. Two earlier
     * attempts at that reported through document.title, which never reaches
     * the compositor without a notify::title handler and so said nothing at
     * all. Asking the page and printing the answer is what settled it.
     *
     * A page can finish loading several times (a redirect, a form post), so
     * the timer is started once rather than once per load. */
    static gboolean probing = FALSE;
    if (data && !probing) {
        probing = TRUE;
        g_timeout_add(500, probe_tick, data);
    }
}

static gboolean on_decide_policy(WebKitWebView *view,
                                 WebKitPolicyDecision *decision,
                                 WebKitPolicyDecisionType type,
                                 gpointer data)
{
    if (type != WEBKIT_POLICY_DECISION_TYPE_NAVIGATION_ACTION)
        return FALSE;

    WebKitNavigationAction *action =
        webkit_navigation_policy_decision_get_navigation_action(
            WEBKIT_NAVIGATION_POLICY_DECISION(decision));
    WebKitURIRequest *request = webkit_navigation_action_get_request(action);
    const char *uri = webkit_uri_request_get_uri(request);

    g_autoptr(GUri) parsed = g_uri_parse(uri, G_URI_FLAGS_NONE, NULL);
    if (!parsed)
        return FALSE;

    /* Only network navigation is filtered. about:, data: and blob: have no
     * host and are not somewhere the player could be led -- they are how a
     * page builds its own subframes and documents. Refusing them broke the
     * provider's form from the inside: the log filled with "refused
     * navigation to about:srcdoc" while keystrokes arrived at GTK correctly
     * and landed nowhere, which reads as a broken keyboard and is not one.
     *
     * The point of this policy is that a sign-in window cannot become a way
     * to browse the web. That is about http(s) going somewhere else, and
     * nothing else. */
    const char *scheme = g_uri_get_scheme(parsed);
    if (g_strcmp0(scheme, "http") != 0 && g_strcmp0(scheme, "https") != 0)
        return FALSE;

    /* Only where the *player* would end up, not what the page loads.
     *
     * A sign-in page is assembled from other origins by design: Dropbox's
     * form needs dropboxcaptcha.com, the "Continue with Google" button needs
     * accounts.google.com. Filtering those refused the captcha, the form
     * never became usable, and keystrokes that arrived correctly all the way
     * to WebKit went nowhere -- which looked like a broken keyboard through
     * four wrong diagnoses.
     *
     * What this is actually for is stopping the window becoming a way to
     * browse the web: the player following Terms, or Privacy, and never
     * coming back. That is a top-level navigation, and it is the only thing
     * worth refusing. Subframes and resources load freely; the ephemeral
     * context means none of it outlives the sign-in.
     */
    /* A user gesture is the thing worth filtering: the player tapping Terms
     * or Privacy and browsing away. Everything a page loads for itself --
     * dropboxcaptcha.com for the form's captcha, accounts.google.com for the
     * "Continue with Google" button, analytics nobody asked for -- arrives
     * without one.
     *
     * Not frame_name: an iframe with no name attribute reports NULL exactly
     * as the main frame does, so that test refused the captcha anyway and
     * the form stayed unusable.
     */
    if (!webkit_navigation_action_is_user_gesture(action))
        return FALSE;

    if (!host_permitted(g_uri_get_host(parsed))) {
        g_message("refused navigation to %s", uri);
        webkit_policy_decision_ignore(decision);
        return TRUE;
    }
    return FALSE;
}

int main(int argc, char **argv)
{
    if (argc < 2) {
        g_printerr("usage: cloud-signin-window <url> [allowed-host]\n");
        return 1;
    }
    /* Which two buttons leave is not the same on every handheld -- the
     * RG35XX SP has a Mode button and ES maps its hotkey to it, smaller pads
     * have none. cloud_oauth reads the pad and passes what it found, because
     * naming a button the player does not have is worse than naming none. */
    const char *exit_hint = "SELECT + START";
    gboolean auto_raise = TRUE;
    for (int i = 2; i < argc; i++) {
        if (g_strcmp0(argv[i], "--exit-hint") == 0 && i + 1 < argc)
            exit_hint = argv[++i];
        else if (g_strcmp0(argv[i], "--no-auto-keyboard") == 0)
            auto_raise = FALSE;
        else if (!allowed_host && argv[i][0] != '-')
            allowed_host = argv[i];
    }

    gtk_init(&argc, &argv);

    static Osk osk;

    GtkWidget *window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_title(GTK_WINDOW(window), "Sign in");
    gtk_window_fullscreen(GTK_WINDOW(window));
    g_signal_connect(window, "destroy", G_CALLBACK(gtk_main_quit), NULL);

    /* Ephemeral: nothing this window does should outlive the sign-in. The
     * session cookie belongs to the player's provider account, not to the
     * handheld, and the next person to open cloud setup starts clean. */
    WebKitWebContext *context =
        webkit_web_context_new_ephemeral();
    WebKitWebView *view =
        WEBKIT_WEB_VIEW(webkit_web_view_new_with_context(context));

    /* Spatial navigation: the arrow keys move focus to whatever is in that
     * direction, which is what a d-pad means. Tab order on a provider's
     * login page wanders through cookie banners and footer links before it
     * reaches the password field. */
    WebKitSettings *settings = webkit_web_view_get_settings(view);
    webkit_settings_set_enable_spatial_navigation(settings, TRUE);
    webkit_settings_set_enable_tabs_to_links(settings, TRUE);

    g_signal_connect(view, "decide-policy", G_CALLBACK(on_decide_policy), NULL);
    g_signal_connect(view, "load-changed", G_CALLBACK(on_load_changed), &osk);
    g_signal_connect(window, "key-press-event", G_CALLBACK(on_key), &osk);

    /* Something to look at while the provider's page loads. Six seconds of
     * a blank screen on a handheld reads as a crash, and the player has no
     * other feedback that anything is happening. */
    GtkWidget *stack = gtk_stack_new();
    GtkWidget *loading = gtk_box_new(GTK_ORIENTATION_VERTICAL, 12);
    static Spin spin;
    GtkWidget *spinner = gtk_drawing_area_new();
    gtk_widget_set_size_request(spinner, 48, 48);
    gtk_widget_set_halign(spinner, GTK_ALIGN_CENTER);
    g_object_set_data(G_OBJECT(spinner), "spin", &spin);
    g_signal_connect(spinner, "draw", G_CALLBACK(on_spin_draw), &spin);
    g_timeout_add(60, on_spin_tick, spinner);
    gtk_widget_set_valign(loading, GTK_ALIGN_CENTER);
    gtk_box_pack_start(GTK_BOX(loading), spinner, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(loading),
                       gtk_label_new("Opening the sign-in page\u2026"),
                       FALSE, FALSE, 0);
    gtk_stack_add_named(GTK_STACK(stack), loading, "loading");
    gtk_stack_add_named(GTK_STACK(stack), GTK_WIDGET(view), "page");
    gtk_stack_set_visible_child_name(GTK_STACK(stack), "loading");
    g_object_set_data(G_OBJECT(view), "stack", stack);

    /* Page on top, keyboard underneath it when asked for. A revealer rather
     * than show/hide so the page resizes around it instead of being covered:
     * a keyboard over the field you are typing into is worse than no
     * keyboard. */
    GtkCssProvider *css = gtk_css_provider_new();
    gtk_css_provider_load_from_data(css, OSK_CSS, -1, NULL);
    gtk_style_context_add_provider_for_screen(gdk_screen_get_default(),
                                              GTK_STYLE_PROVIDER(css),
                                              GTK_STYLE_PROVIDER_PRIORITY_APPLICATION);
    g_object_unref(css);

    osk.view = view;
    osk.exit_hint = exit_hint;
    osk.auto_raise = auto_raise;
    osk.revealer = gtk_revealer_new();
    gtk_revealer_set_transition_type(GTK_REVEALER(osk.revealer),
                                     GTK_REVEALER_TRANSITION_TYPE_SLIDE_UP);
    gtk_container_add(GTK_CONTAINER(osk.revealer), osk_build(&osk));
    gtk_revealer_set_reveal_child(GTK_REVEALER(osk.revealer), FALSE);

    /* The player arrives here from a menu, with no way to find out what the
     * buttons do -- the page is the provider's and says nothing about a
     * handheld. Every other screen on this device carries a help bar; this
     * is that. It is also the answer to "nothing brings up the keyboard":
     * the keyboard raises itself on a text field, and this says how to ask
     * for it the rest of the time. */
    GtkWidget *hints = gtk_label_new("");
    gtk_widget_set_name(hints, "hints");
    gtk_label_set_xalign(GTK_LABEL(hints), 0.5f);
    osk.hints = hints;
    osk_hints(&osk);

    GtkWidget *outer = gtk_box_new(GTK_ORIENTATION_VERTICAL, 0);
    gtk_box_pack_start(GTK_BOX(outer), stack, TRUE, TRUE, 0);
    gtk_box_pack_start(GTK_BOX(outer), osk.revealer, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(outer), hints, FALSE, FALSE, 0);

    gtk_container_add(GTK_CONTAINER(window), outer);
    gtk_widget_set_can_focus(GTK_WIDGET(view), TRUE);
    webkit_web_view_load_uri(view, argv[1]);
    gtk_widget_show_all(window);

    /* present, then focus: the window has to be mapped and activated before
     * the widget inside it can take keyboard focus. */
    gtk_window_present(GTK_WINDOW(window));
    gtk_widget_grab_focus(GTK_WIDGET(view));

    gtk_main();
    return 0;
}
