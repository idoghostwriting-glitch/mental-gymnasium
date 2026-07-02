/*
 * Join-form logic for the Mental Gymnasium landing page.
 *
 * Written as a small UMD-style module so the exact same code runs in the
 * browser (via <script src="assets/join.js">) and can be imported directly
 * by the test suite (Vitest + jsdom) without a build step.
 */
(function (global) {
  "use strict";

  var RECIPIENT = "idoghostwriting@gmail.com";
  var SUBJECT = "Mental Gymnasium — count me in";

  /**
   * Build the mailto: URL for the join form.
   * Pure function — no DOM access — so it is trivial to unit test.
   * All user-supplied values are percent-encoded so that spaces, ampersands,
   * newlines and non-ASCII characters (e.g. Thai) survive intact.
   *
   * @param {string} email    reader-supplied email address
   * @param {string} note     how they'd like to be involved
   * @returns {string} a fully-formed mailto: URL
   */
  function buildJoinMailto(email, note) {
    var subject = encodeURIComponent(SUBJECT);
    var body = encodeURIComponent(
      "Email: " +
        (email || "") +
        "\nInvolvement: " +
        (note || "") +
        "\n\n(sent from the landing page)"
    );
    return "mailto:" + RECIPIENT + "?subject=" + subject + "&body=" + body;
  }

  /**
   * Form submit handler. Prevents native submission, opens the user's mail
   * client with a pre-filled message, and swaps the helper note for a
   * confirmation. Guards against a missing confirmation element.
   *
   * @param {Event} e submit event
   * @returns {boolean} always false (belt-and-braces to stop submission)
   */
  function mgJoin(e) {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    var f = e.target;
    var email = f && f.email ? f.email.value : "";
    var note = f && f.note ? f.note.value : "";

    global.location.href = buildJoinMailto(email, note);

    var msg = global.document.getElementById("mgmsg");
    if (msg) {
      msg.textContent =
        "Thanks — opening your email app so you can hit send.";
    }
    return false;
  }

  global.buildJoinMailto = buildJoinMailto;
  global.mgJoin = mgJoin;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { buildJoinMailto: buildJoinMailto, mgJoin: mgJoin, RECIPIENT: RECIPIENT, SUBJECT: SUBJECT };
  }
})(typeof window !== "undefined" ? window : globalThis);
