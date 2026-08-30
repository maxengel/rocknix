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
    if (parsed && !host_permitted(g_uri_get_host(parsed))) {
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

    g_signal_connect(view, "decide-policy", G_CALLBACK(on_decide_policy), NULL);

    gtk_container_add(GTK_CONTAINER(window), GTK_WIDGET(view));
    webkit_web_view_load_uri(view, argv[1]);
    gtk_widget_show_all(window);

    gtk_main();
    return 0;
}
