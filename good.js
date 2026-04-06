// === GOOD TIER: Digital programme grid with notifications ===

const phaseMap = {
    "first-fix": "1st Fix",
    "plaster": "Plaster Fix",
    "second-fix": "2nd Fix",
    "final": "Final Fix"
};

const phaseTaskMap = {
    "1st Fix": [
        "Joiner stairs", "Joiner windows & doors", "Insulation walls",
        "Joiner 1st fix finish", "Plumber 1st fix", "Joiner service battens",
        "Electrician 1st fix", "1st Fix Inspection"
    ],
    "Plaster Fix": [
        "Tack", "Plaster", "Clean out (plaster)", "Insulation lofts"
    ],
    "2nd Fix": [
        "Mist coat", "Joiner 2nd fix", "Kitchen", "Tiler",
        "Flooring for cylinder", "Plumber 2nd fix", "Electrician 2nd fix",
        "Elec test", "Plumber final", "Patcher", "Clean out (2nd fix)"
    ],
    "Final Fix": [
        "Paint", "Flooring", "Joiner final", "Build clean",
        "Mastic", "Final clean", "CML"
    ]
};

function getTaskTrade(taskName) {
    for (const phase of DATA.buildSequence) {
        for (const t of phase.tasks) {
            if (t.task === taskName) return t.trade;
        }
    }
    // Check schedule data for trade
    const entry = DATA.schedule.find(s => s.task === taskName);
    return entry ? entry.trade : null;
}

function initGoodTier() {
    // Populate trade filter
    const select = document.getElementById("good-filter-trade");
    const tradeNames = Object.keys(DATA.trades);
    tradeNames.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
    select.addEventListener("change", () => {
        const activePhase = document.querySelector(".phase-tab.active").dataset.phase;
        renderGoodGrid(activePhase);
    });

    document.getElementById("good-reset-btn").addEventListener("click", resetGood);

    renderGoodGrid("first-fix");
}

function resetGood() {
    // Reset trade filter
    document.getElementById("good-filter-trade").value = "";
    // Reset phase to 1st Fix
    document.querySelectorAll(".phase-tab").forEach(t => t.classList.remove("active"));
    document.querySelector('.phase-tab[data-phase="first-fix"]').classList.add("active");
    // Clear notifications
    document.getElementById("good-notification-list").innerHTML = "";
    // Re-render
    renderGoodGrid("first-fix");
}

function renderGoodGrid(phaseKey) {
    const phaseName = phaseMap[phaseKey];
    const tasks = phaseTaskMap[phaseName];
    if (!tasks) return;

    const tradeFilter = document.getElementById("good-filter-trade").value;
    const table = document.getElementById("good-grid");
    table.innerHTML = "";

    // Build header
    const thead = document.createElement("thead");

    // Week commencing row
    const wcRow = document.createElement("tr");
    wcRow.innerHTML = '<th class="trade-col" rowspan="2">Trade</th><th class="task-col" rowspan="2">Task</th>';
    DATA.weeks.forEach(w => {
        const th = document.createElement("th");
        th.className = "wc-header";
        th.colSpan = 5;
        th.textContent = "wc " + w.days[0];
        wcRow.appendChild(th);
    });
    thead.appendChild(wcRow);

    // Day names row
    const dayRow = document.createElement("tr");
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    DATA.weeks.forEach(() => {
        dayNames.forEach(d => {
            const th = document.createElement("th");
            th.textContent = d;
            dayRow.appendChild(th);
        });
    });
    thead.appendChild(dayRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    const totalDays = DATA.weeks.length * 5; // 25 days

    tasks.forEach(taskName => {
        const trade = getTaskTrade(taskName);
        if (tradeFilter && trade !== tradeFilter) return;

        const row = document.createElement("tr");

        // Trade cell
        const tradeTd = document.createElement("td");
        tradeTd.className = "trade-col";
        if (trade && DATA.trades[trade]) {
            tradeTd.innerHTML = `<span style="color:${DATA.trades[trade].colour}">${trade}</span>`;
        } else {
            tradeTd.textContent = trade || "—";
        }
        row.appendChild(tradeTd);

        // Task cell
        const taskTd = document.createElement("td");
        taskTd.className = "task-col";
        taskTd.textContent = taskName;
        row.appendChild(taskTd);

        // Day cells
        for (let d = 0; d < totalDays; d++) {
            const td = document.createElement("td");
            // Find schedule entries for this task and day
            const entries = DATA.schedule.filter(s => s.task === taskName && s.day === d);
            if (entries.length > 0) {
                const entry = entries[0];
                td.textContent = entry.plots;
                if (taskName.includes("Inspection")) {
                    td.className = "cell-inspection";
                } else {
                    td.className = `cell-${entry.status}`;
                }
                // Click handler for notifications
                td.addEventListener("click", () => {
                    simulateNotification(entry, taskName);
                });
            } else {
                td.className = "cell-empty";
                td.addEventListener("click", () => {
                    simulateAddNotification(taskName, trade, d);
                });
            }
            row.appendChild(td);
        }

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
}

function simulateNotification(entry, taskName) {
    const list = document.getElementById("good-notification-list");
    const trade = entry.trade;
    const tradeInfo = trade ? DATA.trades[trade] : null;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    const notifications = [];

    if (trade && tradeInfo) {
        notifications.push({
            icon: "sms",
            emoji: "\u{1F4F1}",
            text: `<span class="notif-trade">${tradeInfo.contact} (${trade})</span> — SMS sent: "Schedule change for plot${entry.plots.includes("/") || entry.plots.includes("-") ? "s" : ""} ${entry.plots}: ${taskName} has been updated. Please confirm availability."`,
            time: timeStr
        });
    }

    // If it's a status change to missed, notify PM
    if (entry.status === "missed") {
        notifications.push({
            icon: "alert",
            emoji: "\u{26A0}\u{FE0F}",
            text: `<span class="notif-trade">Project Manager</span> — Alert: ${taskName} on plot${entry.plots.includes("/") || entry.plots.includes("-") ? "s" : ""} ${entry.plots} was missed. Downstream tasks may be affected.`,
            time: timeStr
        });
    }

    // Downstream trade notification
    const downstreamTrade = getDownstreamTrade(taskName);
    if (downstreamTrade && DATA.trades[downstreamTrade]) {
        notifications.push({
            icon: "email",
            emoji: "\u{1F4E7}",
            text: `<span class="notif-trade">${DATA.trades[downstreamTrade].contact} (${downstreamTrade})</span> — Email: "Upstream task '${taskName}' on plot(s) ${entry.plots} has changed. Your scheduled work may shift. Updated programme attached."`,
            time: timeStr
        });
    }

    notifications.forEach((n, i) => {
        setTimeout(() => {
            const div = document.createElement("div");
            div.className = "notification-item";
            div.innerHTML = `
                <div class="notif-icon ${n.icon}">${n.emoji}</div>
                <div class="notif-body">
                    <div>${n.text}</div>
                    <div class="notif-time">${n.time}</div>
                </div>
            `;
            list.prepend(div);
            // Keep max 8 notifications
            while (list.children.length > 8) list.removeChild(list.lastChild);
        }, i * 400);
    });
}

function simulateAddNotification(taskName, trade, dayIndex) {
    const list = document.getElementById("good-notification-list");
    const tradeInfo = trade ? DATA.trades[trade] : null;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const weekIdx = Math.floor(dayIndex / 5);
    const dayIdx = dayIndex % 5;
    const dayStr = DATA.weeks[weekIdx] ? DATA.weeks[weekIdx].days[dayIdx] : "TBC";

    if (tradeInfo) {
        const div = document.createElement("div");
        div.className = "notification-item";
        div.innerHTML = `
            <div class="notif-icon sms">\u{1F4F1}</div>
            <div class="notif-body">
                <div><span class="notif-trade">${tradeInfo.contact} (${trade})</span> — SMS: "New booking: ${taskName} on ${dayStr}. Please confirm."</div>
                <div class="notif-time">${timeStr}</div>
            </div>
        `;
        list.prepend(div);
        while (list.children.length > 8) list.removeChild(list.lastChild);
    }
}

function getDownstreamTrade(taskName) {
    // Find the next task in sequence after this one and return its trade
    for (const phase of DATA.buildSequence) {
        for (let i = 0; i < phase.tasks.length; i++) {
            if (phase.tasks[i].task === taskName && i < phase.tasks.length - 1) {
                return phase.tasks[i + 1].trade;
            }
        }
    }
    return null;
}
