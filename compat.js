/* IDs are identifiers for local records, not authentication tokens. */
(function (global) {
  "use strict";
  function createId() {
    var crypto = global.crypto;
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (crypto && typeof crypto.getRandomValues === "function") {
      var bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 15) | 64;
      bytes[8] = (bytes[8] & 63) | 128;
      var hex = Array.prototype.map.call(bytes, function (byte) { return (byte + 256).toString(16).slice(1); }).join("");
      return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
    }
    // Forecasts can still be displayed when Web Crypto is unavailable.
    // Password registration separately requires secure Web Crypto support.
    return "local_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
  }
  global.SmartBusUtils = Object.freeze({ createId: createId });
})(window);
