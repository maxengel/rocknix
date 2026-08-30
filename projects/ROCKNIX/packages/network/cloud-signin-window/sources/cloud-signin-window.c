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

static void on_probe(GObject *source, GAsyncResult *result, gpointer data)
{
    GError *error = NULL;
    JSCValue *value = webkit_web_view_evaluate_javascript_finish(
        WEBKIT_WEB_VIEW(source), result, &error);
    if (value) {
        char *text = jsc_value_to_string(value);
        g_message("probe %s", text);
        g_free(text);
        g_object_unref(value);
    } else if (error) {
        g_message("probe failed: %s", error->message);
        g_error_free(error);
    }
}

static gboolean probe_tick(gpointer view)
{
    static const char *script =
        "(function () {"
        "  var a = document.activeElement;"
        "  var d = a ? a.tagName + (a.type ? '[' + a.type + ']' : '') : 'none';"
        "  if (a && a.id) d += '#' + a.id;"
        "  if (a && a.name) d += '@' + a.name;"
        "  return 'focus=' + d"
        "       + ' value=' + (a && a.value !== undefined ?"
        "                      JSON.stringify(a.value) : '-')"
        "       + ' inputs=' + document.querySelectorAll('input').length"
        "       + ' frames=' + window.frames.length;"
        "})();";
    webkit_web_view_evaluate_javascript(WEBKIT_WEB_VIEW(view), script, -1,
                                        NULL, NULL, NULL, on_probe, NULL);
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

    /* Diagnostic, behind an environment variable, reporting what the page
     * actually holds rather than what it looks like it holds. Keystroke
     * delivery has three places it can fail silently, and a screenshot only
     * shows the last one -- an empty box looks identical whether nothing
     * arrived, something arrived and was rejected, or the caret is in a
     * different element than the one drawing a focus ring. Two earlier
     * attempts at this reported through document.title, which never reaches
     * the compositor without a notify::title handler and so said nothing at
     * all. This asks the page and prints the answer. */
    if (g_getenv("CLOUD_SIGNIN_DEBUG"))
        g_timeout_add_seconds(2, probe_tick, view);
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
    if (argc > 2)
        allowed_host = argv[2];

    gtk_init(&argc, &argv);

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
    g_signal_connect(view, "load-changed", G_CALLBACK(on_load_changed), NULL);
    g_signal_connect(window, "key-press-event", G_CALLBACK(on_key), NULL);

    /* Something to look at while the provider's page loads. Six seconds of
     * a blank screen on a handheld reads as a crash, and the player has no
     * other feedback that anything is happening. */
    GtkWidget *stack = gtk_stack_new();
    GtkWidget *loading = gtk_box_new(GTK_ORIENTATION_VERTICAL, 12);
    GtkWidget *spinner = gtk_spinner_new();
    gtk_widget_set_size_request(spinner, 48, 48);
    gtk_spinner_start(GTK_SPINNER(spinner));
    gtk_widget_set_valign(loading, GTK_ALIGN_CENTER);
    gtk_box_pack_start(GTK_BOX(loading), spinner, FALSE, FALSE, 0);
    gtk_box_pack_start(GTK_BOX(loading),
                       gtk_label_new("Opening the sign-in page\u2026"),
                       FALSE, FALSE, 0);
    gtk_stack_add_named(GTK_STACK(stack), loading, "loading");
    gtk_stack_add_named(GTK_STACK(stack), GTK_WIDGET(view), "page");
    gtk_stack_set_visible_child_name(GTK_STACK(stack), "loading");
    g_object_set_data(G_OBJECT(view), "stack", stack);

    gtk_container_add(GTK_CONTAINER(window), stack);
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
