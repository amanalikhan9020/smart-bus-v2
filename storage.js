/* Local prototype storage. This is not server-side authentication. */
(() => {
  "use strict";

  const USERS = "smartbus_users_v4";
  const CURRENT = "smartbus_current_v4";
  const ITERATIONS = 600000;
  const ALGORITHM = "PBKDF2-SHA-256";
  let initialized = false;
  let initialization;

  function read(key, fallback, label) {
    let raw;
    try {
      raw = localStorage.getItem(key);
    } catch {
      throw new Error("Browser storage is unavailable. Allow local storage and try again.");
    }
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Stored ${label} data is damaged. Existing data was kept; restore a valid backup before continuing.`);
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      throw new Error("Could not save to browser storage. It may be full or blocked. Nothing was reported as saved; free space or allow storage and try again.");
    }
  }

  function requireReady() {
    if (!initialized) throw new Error("Local storage setup has not completed. Check the storage warning and reload after correcting it.");
  }

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function text(value, max = 256) {
    return typeof value === "string" && value.trim().length > 0 && value.length <= max;
  }

  function invalid(label) {
    throw new Error(`Stored ${label} data is invalid. Existing data was kept; restore a valid backup before continuing.`);
  }

  function hasHash(user) {
    return user.passwordAlgorithm === ALGORITHM &&
      /^[a-f0-9]{64}$/.test(user.passwordHash) &&
      /^[a-f0-9]{32}$/.test(user.salt) &&
      Number.isInteger(user.iterations) && user.iterations >= 100000 && user.iterations <= 1000000;
  }

  function legacyBlankPassword(user) {
    return !hasHash(user) && typeof user.password === "string" && !user.password.trim();
  }

  function accounts(allowLegacy = false) {
    const users = read(USERS, [], "account");
    if (!Array.isArray(users)) invalid("account");
    const ids = new Set();
    const emails = new Set();
    for (const user of users) {
      if (!isObject(user) || !/^[a-zA-Z0-9_-]{1,128}$/.test(user.id) || user.id === "guest" ||
          !text(user.name) || !text(user.email, 254)) invalid("account");
      const email = user.email.trim().toLowerCase();
      if (ids.has(user.id) || emails.has(email)) invalid("account");
      ids.add(user.id);
      emails.add(email);
      if (!hasHash(user) && !(allowLegacy && typeof user.password === "string")) invalid("account credentials");
    }
    return users;
  }

  function publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.id === "guest" ? "Guest" : "Registered user"
    };
  }

  function secureCrypto() {
    if (!globalThis.crypto?.subtle) {
      throw new Error("Password protection needs HTTPS or localhost with Web Crypto support. Open the app through its local HTTP server.");
    }
    return globalThis.crypto;
  }

  const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const unhex = value => Uint8Array.from(value.match(/../g), pair => parseInt(pair, 16));

  async function derive(password, salt, iterations) {
    const crypto = secureCrypto();
    const material = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: unhex(salt), iterations }, material, 256
    );
    return hex(new Uint8Array(bits));
  }

  async function credentials(password) {
    const salt = hex(secureCrypto().getRandomValues(new Uint8Array(16)));
    return {
      passwordAlgorithm: ALGORITHM,
      iterations: ITERATIONS,
      salt,
      passwordHash: await derive(password, salt, ITERATIONS)
    };
  }

  function sameHash(a, b) {
    if (a.length !== b.length) return false;
    let difference = 0;
    for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return difference === 0;
  }

  function current(users = accounts()) {
    const user = read(CURRENT, null, "session");
    if (user === null) return null;
    if (!isObject(user)) invalid("session");
    if (user.id === "guest") {
      return { id: "guest", name: "Guest", email: "No email", type: "Guest" };
    }
    const account = users.find(item => item.id === user.id);
    if (!account) invalid("session (the referenced account does not exist)");
    return publicUser(account);
  }

  async function init() {
    if (initialized) return;
    if (initialization) return initialization;
    initialization = (async () => {
      const users = accounts(true);
      if (users.some(legacyBlankPassword)) {
        const error = new Error("A legacy local account has a blank or spaces-only password. Use local legacy password recovery to set a valid password, then retry setup. Existing accounts and trips have been kept.");
        error.code = "LEGACY_PASSWORD_RESET";
        throw error;
      }
      // Derive every legacy password before replacing the accounts in one setItem.
      // IDs and trip keys are retained. On a derivation failure, no accounts change.
      const upgraded = [];
      for (const user of users) {
        const clean = {
          ...user,
          ...(hasHash(user) ? {} : await credentials(user.password))
        };
        delete clean.password;
        upgraded.push(clean);
      }
      const storedSession = read(CURRENT, null, "session");
      const session = current(upgraded);
      if (JSON.stringify(users) !== JSON.stringify(upgraded)) write(USERS, upgraded);
      // Legacy sessions contained the whole account, including its plaintext password.
      // Rewrite only a public view, never the password, hash or salt.
      if (session !== null && JSON.stringify(session) !== JSON.stringify(storedSession)) {
        write(CURRENT, session);
      }
      initialized = true;
    })();
    try {
      await initialization;
    } finally {
      initialization = undefined;
    }
  }

  function required(value, label) {
    if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  }

  function validateEmail(email) {
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
  }

  // This repairs an old validation bug using data in this browser only. It is
  // deliberately not email verification or a remotely authenticated reset.
  async function recoverLegacy(email, newPassword, confirm) {
    required(email, "Email");
    required(newPassword, "New password");
    required(confirm, "Confirm password");
    email = email.trim().toLowerCase();
    validateEmail(email);
    if (newPassword.trim().length < 6) {
      throw new Error("New password must contain at least 6 characters excluding surrounding spaces.");
    }
    if (newPassword !== confirm) throw new Error("Passwords do not match.");
    const eligible = user => user.email.trim().toLowerCase() === email && legacyBlankPassword(user);
    if (!accounts(true).some(eligible)) {
      throw new Error("No legacy account with a blank or spaces-only password matches this email in this browser.");
    }
    const protectedPassword = await credentials(newPassword);
    const users = accounts(true);
    const index = users.findIndex(eligible);
    if (index === -1) throw new Error("This legacy account was already changed. Retry setup before continuing.");
    const updated = { ...users[index], ...protectedPassword };
    delete updated.password;
    const session = read(CURRENT, null, "session");
    const upgraded = users.slice();
    upgraded[index] = updated;
    write(USERS, upgraded);
    if (isObject(session) && session.id === updated.id) {
      try {
        write(CURRENT, publicUser(updated));
      } catch {
        throw new Error("The legacy password was updated, but the old local session could not be cleaned. Allow browser storage and reload before continuing.");
      }
    }
    // Keep IDs and trip keys; do not create a new session or sign the user in.
    return publicUser(updated);
  }

  async function register(name, email, password, confirm) {
    requireReady();
    required(name, "Full name");
    required(email, "Email");
    required(password, "Password");
    required(confirm, "Confirm password");
    name = name.trim();
    email = email.trim().toLowerCase();
    if (name.length > 256) throw new Error("Full name must be 256 characters or fewer.");
    validateEmail(email);
    if (password.length < 6) throw new Error("Password must contain at least 6 characters.");
    if (password !== confirm) throw new Error("Passwords do not match.");
    if (accounts().some(user => user.email.trim().toLowerCase() === email)) {
      throw new Error("This email is already registered.");
    }
    const protectedPassword = await credentials(password);
    // Read again after the async hash so another registration is not overwritten.
    const users = accounts();
    if (users.some(user => user.email.trim().toLowerCase() === email)) throw new Error("This email is already registered.");
    const user = {
      id: "user_" + secureCrypto().randomUUID(), name, email,
      type: "Registered user", ...protectedPassword
    };
    write(USERS, [...users, user]);
    try {
      write(CURRENT, publicUser(user));
    } catch {
      throw new Error("Your account was saved, but the local session could not be stored. Allow browser storage, then log in again.");
    }
    return publicUser(user);
  }

  async function login(email, password) {
    requireReady();
    required(email, "Email");
    required(password, "Password");
    email = email.trim().toLowerCase();
    validateEmail(email);
    const user = accounts().find(item => item.email.trim().toLowerCase() === email);
    if (!user || !sameHash(await derive(password, user.salt, user.iterations), user.passwordHash)) {
      throw new Error("Incorrect email or password.");
    }
    const result = publicUser(user);
    write(CURRENT, result);
    return result;
  }

  function getCurrentUser() {
    requireReady();
    return current();
  }

  function guest() {
    requireReady();
    const user = { id: "guest", name: "Guest", email: "No email", type: "Guest" };
    write(CURRENT, user);
    return user;
  }

  function logout() {
    requireReady();
    try {
      localStorage.removeItem(CURRENT);
    } catch {
      throw new Error("Could not clear the local session. Allow browser storage and try logging out again.");
    }
  }

  function tripKey(user) {
    return "smartbus_trips_v4_" + user.id;
  }

  function validateTrip(trip) {
    if (!isObject(trip) ||
        !(typeof trip.id === "string" && text(trip.id, 128) || Number.isSafeInteger(trip.id) && trip.id >= 0) ||
        !text(trip.routeId, 32) || !text(trip.routeName, 128) || !text(trip.stop, 256) ||
        typeof trip.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(trip.time) ||
        !Number.isFinite(trip.occupancy) || trip.occupancy < 0 || trip.occupancy > 100 ||
        !Number.isSafeInteger(trip.capacity) || trip.capacity <= 0 ||
        !Number.isSafeInteger(trip.passengers) || trip.passengers < 0 || trip.passengers > trip.capacity ||
        ![0, 1].includes(trip.dayOffset ?? 0)) {
      throw new Error("Trip data is incomplete or invalid. Select a valid route, stop and time, then predict again. Existing trips were kept.");
    }
    // The app loads its route model before using storage. Keep this optional so
    // the storage module can also be exercised independently of the interface.
    const routes = window.SmartBusModel?.ROUTES;
    if (routes && (!Object.hasOwn(routes, trip.routeId) ||
        routes[trip.routeId].name !== trip.routeName ||
        routes[trip.routeId].capacity !== trip.capacity ||
        !routes[trip.routeId].stops.includes(trip.stop))) {
      throw new Error("Trip route, stop or capacity does not match the route data. Existing trips were kept; restore valid trip data before continuing.");
    }
    return {
      id: trip.id,
      routeId: trip.routeId,
      routeName: trip.routeName,
      stop: trip.stop,
      time: trip.time,
      dayOffset: trip.dayOffset ?? 0,
      occupancy: trip.occupancy,
      passengers: trip.passengers,
      capacity: trip.capacity
    };
  }

  function getTrips() {
    const user = getCurrentUser();
    if (!user) return [];
    const trips = read(tripKey(user), [], "trip");
    if (!Array.isArray(trips)) invalid("trip");
    const clean = trips.map(validateTrip);
    if (new Set(clean.map(trip => trip.id)).size !== clean.length) invalid("trip identifiers");
    return clean;
  }

  function saveTrip(trip) {
    const user = getCurrentUser();
    if (!user) throw new Error("Log in or continue as guest before saving a trip.");
    const clean = validateTrip(trip);
    const trips = getTrips();
    if (trips.some(item => item.routeId === clean.routeId && item.stop === clean.stop &&
        item.time === clean.time && item.dayOffset === clean.dayOffset)) {
      throw new Error("This trip is already saved. Open Saved Trips to view it.");
    }
    if (trips.some(item => item.id === clean.id)) clean.id = secureCrypto().randomUUID();
    write(tripKey(user), [clean, ...trips]);
    return trips.length + 1;
  }

  function deleteTrip(id) {
    const user = getCurrentUser();
    if (!user) throw new Error("Log in or continue as guest before deleting a trip.");
    const trips = getTrips();
    if (!trips.some(trip => trip.id === id)) throw new Error("This trip was not found in the current user's saved trips.");
    const remaining = trips.filter(trip => trip.id !== id);
    write(tripKey(user), remaining);
    return remaining.length;
  }

  window.SmartBusStore = Object.freeze({
    init, recoverLegacy, getCurrentUser, register, login, guest, logout, getTrips, saveTrip, deleteTrip
  });
})();
