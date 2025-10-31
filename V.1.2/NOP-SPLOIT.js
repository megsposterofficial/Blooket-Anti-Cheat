/** Noper Surgeon Exploit
 * -------------------------------------------------------------------------------------------------------------------------------------------------
 *                                                                                                                                  |
 * An advanced Blooket Anti-Cheat that can detect if other users are using exploits.                                                | 
 * When ran, it starts a scan throughout the game to check if anyone's score goes up by a suspicious amount.                        |
 * If a player is spotted cheating, it will flag the player in the console and attempt to kick the player.                          |  
 *                                                                                                                                  |
 * V.1.2 Changelog 31/10/2025                                                                                                       |
 * --Fixed the Kicking player function.                                                                                             |
 * --Script cosmetic changes, added comments for better understanding, polished the script to look cleaner.                         |
 * --Fixed any functions that required console input commands.                                                                      |
 * --Implementing a new anti-cheat feature, a prototype server scanner for suspicious elements added. (Still planning).             |
 *                                                                                                                                  |
 * V.1.1 Changelog 28/10/2025                                                                                                       |
 * --Added a validator for Double score or Triple score increases, this is because some blooket games like crypto hack or gold      |
 *   quest can increase the player score by double or triple the current amount.                                                    |
 * --Made the player flagger less sensitive. Before V.1.1, it would flag any player who'd score was increased by the                |
 *   slightest bit possible.                                                                                                        |   
 * --Implemented a validator for checking if score was added fairly to the player's score. In short, just checks if the             |
 *   player stole from someone else ingame, and doesn't flag them because it was a fair steal intended by the game.                 |
 * --Implemented changes on the MODE function seemingly not detecting anything in the player array.                                 |
 * --Added a stop script event if the NOP-SPLOIT cannot access game state for over 5 seconds while it tries to reconnect.           |    
 * --Added an option to disable or enable kicking players automatically.                                                            |
 *                                                                                                                                  |
 * V.1.0 Changelog 27/10/2025                                                                                                       |
 * --Implemented the NOP-SPLOIT to existance.                                                                                       |
 * --Fixed up an old broken Blooket Anti-Cheat.                                                                                     |
 *                                                                                                                                  |
 * -------------------------------------------------------------------------------------------------------------------------------------------------
 */

// Variables, any variables with a phrase of `true` or `false`, can be altered for your use.

let AntiCheat = true;
let kickEnabled = true;
let scoreThreshold = 1000;
let multiplierSafe = 3;
let multiplierStrict = 4;
let cc = {};
let kicks = [];
let cooldown = {};
let nopFailCount = 0;
let nopFailLimit = 5;
let cryptoHackLog = [];
let cryptohackconfig = 0;
let immunePlayers = new Set();
let upgradeVisible = false;



function hack() { // Game State Connector
  try {
    let node = Object.values(document.querySelector("#app > div > div"))[1].children[1]._owner;
    nopFailCount = 0;
    return node;
  } catch (e) {
    nopFailCount++;
    console.warn(`[ANTI-CHEAT] Failed to access game state. Attempting to reconnect... ${nopFailCount}/${nopFailLimit}`);
    if (nopFailCount >= nopFailLimit) {
      AntiCheat = false;
      console.error("[ANTI-CHEAT] Stopping NOP-SPLOIT, failed to access game state after multiple attempts.");
    }
    return null;
  }
}



function mode() {  // Player Detector
  let h = hack();
  if (!h) return null;
  let players = h.stateNode.state.players;
  if (!players || players.length === 0) return null;
  let sample = players[0];
  return Object.keys(sample).find(key => typeof sample[key] === "number");
}



function simulateClick(el) { // Input Service
  el.focus();
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
}



function kickUser(name) { // Kick User Function
  setTimeout(() => {
    let userElements = Array.from(document.querySelectorAll("div._standingContainer_1efwv_96[role='button']"));
    let matched = false;

    for (let el of userElements) {
      let lines = el.innerText.trim().toLowerCase().split(/\n+/);
      let matchedLine = lines.find(line => line === name.toLowerCase());

      if (matchedLine) {
        simulateClick(el);
        matched = true;

        setTimeout(() => {
          let attempts = 0;
          const interval = setInterval(() => {
            let modal = document.querySelector("form._container_p0ois_1");
            let modalText = modal?.querySelector("div._text_p0ois_15");
            let confirmBtn = Array.from(modal?.querySelectorAll("div._button_552gk_1._button_p0ois_151") || [])
              .find(btn => btn.innerText.trim().toLowerCase() === "yes");

            if (modal && modalText?.innerText.toLowerCase().includes(name.toLowerCase()) && confirmBtn) {
              simulateClick(confirmBtn);
              console.log(`[ANTI-CHEAT] Kick confirmed for ${name}`);
              clearInterval(interval);
            }

            attempts++;
            if (attempts > 20) {
              clearInterval(interval);
            }
          }, 300);
        }, 500);

        break;
      }
    }
  }, 3000);
}



function getCryptoHackAPI() { // Function to obtain Crypto Hack gamemode Analytics
  let logs = Array.from(document.querySelectorAll("div._right_pqj27_13"));

  logs.slice(-5).forEach(el => {
    let spans = el.querySelectorAll("span");
    if (spans.length === 0) return;

    let hacker = spans[0].innerText.trim().toLowerCase();
    let fullText = el.innerText.trim();

    let match = fullText.match(/just took ([\d,]+) crypto from (.+)/);
    if (match) {
      let entry = {
        hacker: hacker,
        amount: parseInt(match[1].replace(/,/g, '')),
        victim: match[2].trim().toLowerCase(),
        timestamp: Date.now()
      };

      let isNew = !cryptoHackLog.some(e =>
        e.victim === entry.victim &&
        e.amount === entry.amount &&
        e.hacker === entry.hacker
      );

      if (isNew) {
        cryptoHackLog.push(entry);
        immunePlayers.add(entry.hacker);
        immunePlayers.add(entry.victim);
        if (cryptohackconfig === 0) cryptohackconfig = 1;
      }
    }
  });

  cryptoHackLog = cryptoHackLog.filter(e => Date.now() - e.timestamp < 10000);
}



function main() { // Main Function
  if (!AntiCheat) return;

  getCryptoHackAPI();

  let h = hack();
  if (!h) return;

  let players = h.stateNode.state.players;
  let scoreKey = mode();
  if (!scoreKey) return;

  for (let u of players) {
    let name = u.name.trim().toLowerCase();
    let cur = u[scoreKey];
    let pre = cc[name] || 0;
    let increase = cur - pre;

    if (!cooldown[name] || Date.now() - cooldown[name] > 5000) {
      let isImmune = immunePlayers && immunePlayers.has(name);

      let isSuspicious =
        !isImmune &&
        ((pre !== 0 && cur > pre * multiplierStrict) ||
         (increase > scoreThreshold && cur > pre * multiplierSafe));

      if (isSuspicious) {
        kicks.push(name);
        if (kickEnabled) kickUser(name);
        cooldown[name] = Date.now();
        console.log(`[ANTI-CHEAT] Flagged ${name}: ${pre} → ${cur} (+${increase})`);
      } else if (isImmune) {
        cooldown[name] = Date.now();
      }
    }

    cc[name] = cur;
  }
}



setTimeout(() => {
  setInterval(main, 1000);
  console.log("[ANTI-CHEAT] NOP-SPLOIT V.1.2 activated.");

}, 3000);
