// === Auth + Tier navigation and orchestration ===

const APP_HASH = "a]q%4K"; // hashed check

function checkAuth(pw) {
    // Simple obfuscated check — not crypto-secure, just a gate
    return pw === atob("SXRzQUJhdA==");
}

function initAuth() {
    const gate = document.getElementById("auth-gate");
    const input = document.getElementById("auth-password");
    const btn = document.getElementById("auth-submit");
    const err = document.getElementById("auth-error");

    // Check session
    if (sessionStorage.getItem("bfp-auth") === "1") {
        gate.classList.add("hidden");
        initApp();
        return;
    }

    const tryAuth = () => {
        if (checkAuth(input.value)) {
            sessionStorage.setItem("bfp-auth", "1");
            gate.classList.add("hidden");
            initApp();
        } else {
            err.textContent = "Incorrect password.";
            input.value = "";
            input.focus();
        }
    };

    btn.addEventListener("click", tryAuth);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryAuth(); });
    input.focus();
}

const tierDescriptions = {
    good: "Digital programme grid with colour-coded status, trade filtering, and push notifications. Your spreadsheet, but it talks.",
    better: "Commitment-based scheduling, dependency gates, automated cascade on slips, material confirmation locks, and probabilistic forecasting that improves with every completed job.",
    "even-better": "Auto-generated programmes from confirmed availability. Trade capacity marketplace. Delay attribution with cost modelling. Multi-site portfolio view. The operating system for residential construction."
};

function initApp() {
    // Tier switching
    document.querySelectorAll(".tier-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tier = btn.dataset.tier;
            document.querySelectorAll(".tier-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".tier-content").forEach(s => s.classList.remove("active"));
            document.getElementById(`tier-${tier}`).classList.add("active");

            const banner = document.getElementById("tier-banner");
            banner.dataset.tier = tier;
            document.getElementById("tier-label").textContent =
                tier === "even-better" ? "Even Better" : tier.charAt(0).toUpperCase() + tier.slice(1);
            document.getElementById("tier-desc").textContent = tierDescriptions[tier];
        });
    });

    // Set initial banner
    document.getElementById("tier-banner").dataset.tier = "good";
    document.getElementById("tier-label").textContent = "Good";
    document.getElementById("tier-desc").textContent = tierDescriptions.good;

    // Phase tab switching (Good tier)
    document.querySelectorAll(".phase-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".phase-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            renderGoodGrid(tab.dataset.phase);
        });
    });

    // Initialise all tiers
    initGoodTier();
    initBetterTier();
    initEvenBetterTier();
}

document.addEventListener("DOMContentLoaded", initAuth);
