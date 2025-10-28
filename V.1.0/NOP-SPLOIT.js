/** Noper Surgeon Exploit
 * -------------------------------------------------------------------------------------------------------------------------------------------------
 *                                                                                                                                  |
 * An advanced Blooket Anti-Cheat that can detect if other users are using exploits.                                                | 
 * When ran, it starts a scan throughout the game to check if anyone's score goes up by a suspicious amount.                        |
 * If a player is spotted cheating, it will flag the player in the console and attempt to kick the player.                          |
 *                                                                                                                                  |
 * V.1.0 Changelog                                                                                                                  |
 * --Implemented the NOP-SPLOIT to existance.                                                                                       |
 *                                                                                                                                  |
 * -------------------------------------------------------------------------------------------------------------------------------------------------
 */

let AntiCheat = true;
let cc = {};
let kicks = [];
let cooldown = {};

function hack() {
  try {
    return Object.values(document.querySelector("#app > div > div"))[1].children[1]._owner;
  } catch (e) {
    console.warn("[ANTI-CHEAT] Failed to access game state. Waiting...");
    return null;
  }
}

function mode() {
  let h = hack();
  if (!h) return null;
  let sample = h.stateNode.state.players[0];
  return Object.keys(sample).find(key => typeof sample[key] === "number");
}

function kickUser(name) {
  let userElements = Array.from(document.querySelectorAll("[class*=hostRegularBody] [class*=styles__left] div"));
  for (let el of userElements) {
    if (el.innerText.includes(name)) {
      el.click();
      console.log(`[ANTI-CHEAT] Attempting to kick ${name}`);
      setTimeout(() => {
        let modalBtn = document.querySelector("[class*=modal] [class*=hoverRed]");
        if (modalBtn) modalBtn.click();
      }, 500);
    }
  }
}

function check() {
  if (!AntiCheat) return;

  let h = hack();
  if (!h) return;

  let players = h.stateNode.state.players;
  let scoreKey = mode();
  if (!scoreKey) return;

  for (let u of players) {
    let name = u.name;
    let cur = u[scoreKey];
    let pre = cc[name] || 0;

    if (!cooldown[name] || Date.now() - cooldown[name] > 5000) {
      if ((pre !== 0 && cur > pre * 3) || (pre === 0 && cur > 50)) {
        kicks.push(name);
        kickUser(name);
        cooldown[name] = Date.now();
        console.log(`[ANTI-CHEAT] Flagged ${name}: ${pre} → ${cur}`);
      }
    }

    cc[name] = cur;
  }
}

setTimeout(() => {
  setInterval(check, 1000);
  console.log("[ANTI-CHEAT] Anti-cheat script activated.");
}, 3000);