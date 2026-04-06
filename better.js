// === BETTER TIER: Full interactive commitment engine ===

let betterState = {
    selectedPlot: "",
    selectedTrade: "",
    commitments: [],
    slipActive: false,
    slipPhase: null, // which phase has the simulated slip
    highlightPhase: null, // phase currently selected in cascade dropdown
};

function getInitialCommitments() {
    return [
        { trade:"AR Joinery", task:"Joiner 1st fix finish", plot:"31", date:"2025-03-09", dateStr:"09/03", status:"confirmed", phase:"1st Fix" },
        { trade:"PB Plumbing", task:"Plumber 1st fix", plot:"30", date:"2025-03-06", dateStr:"06/03", status:"confirmed", phase:"1st Fix" },
        { trade:"Ian Austin", task:"Tack", plot:"25", date:"2025-03-06", dateStr:"06/03", status:"confirmed", phase:"Plaster Fix" },
        { trade:"C Owen", task:"Electrician 1st fix", plot:"29", date:"2025-03-07", dateStr:"07/03", status:"confirmed", phase:"1st Fix" },
        { trade:"AR Joinery", task:"Joiner 2nd fix", plot:"28", date:"2025-03-09", dateStr:"09/03", status:"confirmed", phase:"2nd Fix" },
        { trade:"PB Plumbing", task:"Plumber 1st fix", plot:"31", date:"2025-03-09", dateStr:"09/03", status:"pending-confirm", phase:"1st Fix" },
        { trade:"AR Joinery", task:"Joiner 1st fix finish", plot:"1", date:"2025-03-12", dateStr:"12/03", status:"pending-confirm", phase:"1st Fix" },
        { trade:"C Owen", task:"Electrician 1st fix", plot:"31", date:"2025-03-11", dateStr:"11/03", status:"pending-confirm", phase:"1st Fix" },
        { trade:"Ian Austin", task:"Plaster", plot:"25", date:"2025-03-11", dateStr:"11/03", status:"pending-confirm", phase:"Plaster Fix" },
        { trade:"PB Plumbing", task:"Plumber 2nd fix", plot:"27", date:"2025-03-10", dateStr:"10/03", status:"pending-confirm", phase:"2nd Fix" },
        { trade:"Max Energy", task:"Insulation walls", plot:"47-49", date:"2025-03-09", dateStr:"09/03", status:"rejected", phase:"1st Fix" },
        { trade:"Max Energy", task:"Insulation lofts", plot:"27", date:"2025-03-13", dateStr:"13/03", status:"pending-confirm", phase:"Plaster Fix" },
    ];
}

function initBetterTier() {
    betterState.commitments = getInitialCommitments();

    // Populate selectors
    const plotSel = document.getElementById("better-plot");
    DATA.plots.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p; opt.textContent = `Plot ${p}`;
        plotSel.appendChild(opt);
    });
    // Add extra plots from commitments
    ["1","47-49"].forEach(p => {
        const opt = document.createElement("option");
        opt.value = p; opt.textContent = `Plot ${p}`;
        plotSel.appendChild(opt);
    });

    const tradeSel = document.getElementById("better-trade");
    Object.keys(DATA.trades).forEach(t => {
        const opt = document.createElement("option");
        opt.value = t; opt.textContent = t;
        tradeSel.appendChild(opt);
    });

    // Event listeners
    plotSel.addEventListener("change", () => { betterState.selectedPlot = plotSel.value; renderBetterAll(); });
    tradeSel.addEventListener("change", () => { betterState.selectedTrade = tradeSel.value; renderBetterAll(); });
    document.getElementById("better-reset-btn").addEventListener("click", resetBetter);
    document.getElementById("cascade-slip-btn").addEventListener("click", simulateCascade);

    // Phase dropdown highlights the Gantt phase
    const cascadePhase = document.getElementById("cascade-phase");
    cascadePhase.addEventListener("change", () => {
        const phaseName = { "first-fix":"1st Fix", "plaster":"Plaster Fix", "second-fix":"2nd Fix", "final":"Final Fix" }[cascadePhase.value];
        betterState.highlightPhase = phaseName;
        renderBetterGantt();
    });

    renderBetterAll();
}

function resetBetter() {
    betterState = { selectedPlot: "", selectedTrade: "", commitments: getInitialCommitments(), slipActive: false, slipPhase: null, highlightPhase: null, extraFeed: [] };
    document.getElementById("better-plot").value = "";
    document.getElementById("better-trade").value = "";
    document.getElementById("cascade-phase").value = "first-fix";
    document.getElementById("cascade-slip-btn").textContent = "Simulate 2-Day Slip";
    document.getElementById("cascade-slip-btn").className = "btn btn-warning";
    renderBetterAll();
}

function renderBetterAll() {
    renderWarnings();
    renderFeed();
    renderBetterGantt();
    renderCommitments();
    renderCompanyDetail();
    renderCascade();
    renderDependencies();
    renderForecast();
    renderMaterials();
}

// --- WARNINGS ---
function renderWarnings() {
    const el = document.getElementById("better-warnings");
    el.innerHTML = "";

    const warnings = [];
    const rejected = betterState.commitments.filter(c => c.status === "rejected");
    const pending = betterState.commitments.filter(c => c.status === "pending-confirm");
    const materialsMissing = [{ item:"Insulation (Plots 47-49)", trade:"Max Energy" }];

    if (rejected.length > 0) {
        warnings.push({ level:"critical", icon:"\u{1F6A8}", text:`${rejected.length} rejected commitment${rejected.length > 1 ? "s" : ""} — downstream work blocked. ${rejected.map(r => r.trade + " / Plot " + r.plot).join("; ")}` });
    }
    if (pending.length > 0) {
        warnings.push({ level:"warning", icon:"\u{26A0}\u{FE0F}", text:`${pending.length} commitment${pending.length > 1 ? "s" : ""} awaiting confirmation. Earliest: ${pending.sort((a,b) => a.date.localeCompare(b.date))[0].dateStr}` });
    }
    materialsMissing.forEach(m => {
        warnings.push({ level:"critical", icon:"\u{1F4E6}", text:`Materials not ordered: ${m.item}. Cannot schedule ${m.trade} until confirmed.` });
    });
    if (warnings.length === 0) {
        warnings.push({ level:"ok", icon:"\u{2705}", text:"No active warnings. All commitments confirmed, materials on track." });
    }

    warnings.forEach(w => {
        const div = document.createElement("div");
        div.className = `warning-item warning-${w.level}`;
        div.innerHTML = `<span class="warning-icon">${w.icon}</span><span>${w.text}</span>`;
        el.appendChild(div);
    });
}

// --- LIVE FEED ---
function renderFeed() {
    const el = document.getElementById("better-feed");
    el.innerHTML = "";

    const feed = [
        { time:"09:42", type:"confirm", text:"AR Joinery confirmed Plot 31 Joiner 1st fix finish (09/03)" },
        { time:"09:38", type:"confirm", text:"Ian Austin confirmed Plot 25 Tack (06/03)" },
        { time:"09:15", type:"reject", text:"Max Energy rejected Insulation walls Plots 47-49 — crew unavailable, earliest 16/03" },
        { time:"08:50", type:"material", text:"Kitchen units Plot 28 delivered and verified on site" },
        { time:"08:30", type:"confirm", text:"PB Plumbing confirmed Plot 30 Plumber 1st fix (06/03)" },
        { time:"Yesterday 16:20", type:"alert", text:"C Owen flagged: may need extra day on Plot 29 elec 1st fix — complex layout" },
        { time:"Yesterday 14:00", type:"material", text:"Tiler materials ETA updated: now 25/02 (1 day early)" },
        { time:"Yesterday 11:30", type:"system", text:"Programme auto-recalculated: Max Energy rejection shifts Plots 47-49 insulation to wc 16/03" },
    ];

    // Prepend any dynamic feed items from user actions
    const allFeed = [...(betterState.extraFeed || []), ...feed];

    allFeed.forEach(f => {
        const div = document.createElement("div");
        div.className = `feed-item feed-${f.type}`;
        div.innerHTML = `<span class="feed-time">${f.time}</span><span class="feed-text">${f.text}</span>`;
        el.appendChild(div);
    });
}

// --- GANTT WITH COMMITMENT STATUS ---
function renderBetterGantt() {
    const el = document.getElementById("better-gantt");
    el.innerHTML = "";

    const dayLabels = [];
    DATA.weeks.forEach(w => w.days.forEach(d => dayLabels.push(d)));
    const totalDays = dayLabels.length;

    // Build Gantt rows from build sequence for selected plot (or plot 27 default)
    const plot = betterState.selectedPlot || "27";

    const table = document.createElement("table");
    table.className = "gantt-table";

    const thead = document.createElement("thead");
    const hRow = document.createElement("tr");
    hRow.innerHTML = "<th class='gantt-task-col'>Task</th><th class='gantt-trade-col'>Trade</th><th class='gantt-status-col'>Status</th>";
    dayLabels.forEach((d, i) => {
        const th = document.createElement("th");
        th.className = "gantt-day-col";
        th.textContent = d;
        if (i % 5 === 0) th.style.borderLeft = "2px solid var(--border)";
        hRow.appendChild(th);
    });
    thead.appendChild(hRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    let dayOffset = 0;
    const slipDays = 2;

    // Pre-calculate slip offsets if cascade is active
    let slipStarted = false;
    let cumulativeSlip = 0;
    const slipOffsets = {};
    if (betterState.slipActive && betterState.slipPhase) {
        let tempOffset = 0;
        DATA.buildSequence.forEach(phase => {
            phase.tasks.forEach((t, i) => {
                if (phase.phase === betterState.slipPhase && i === 0 && !slipStarted) {
                    slipStarted = true;
                    cumulativeSlip = slipDays;
                }
                slipOffsets[t.task] = cumulativeSlip;
                tempOffset += t.days;
            });
        });
    }
    // Reset for the main loop
    slipStarted = false;
    cumulativeSlip = 0;

    DATA.buildSequence.forEach(phase => {
        // Phase header
        const phRow = document.createElement("tr");
        const phTd = document.createElement("td");
        phTd.colSpan = totalDays + 3;
        phTd.className = "gantt-phase-header";
        // Highlight the phase selected in cascade dropdown
        if (betterState.highlightPhase === phase.phase || betterState.slipPhase === phase.phase) {
            phTd.style.borderLeft = "3px solid var(--orange)";
            phTd.style.background = "rgba(249,115,22,0.1)";
        }
        phTd.textContent = phase.phase;
        if (betterState.slipActive && betterState.slipPhase === phase.phase) {
            phTd.textContent += " \u2014 \u26A0\uFE0F 2-day slip applied";
        }
        phRow.appendChild(phTd);
        tbody.appendChild(phRow);

        phase.tasks.forEach(t => {
            const row = document.createElement("tr");

            // Determine commitment status for this task + plot
            const commitment = betterState.commitments.find(c =>
                c.task === t.task && (c.plot === plot || c.plot.includes(plot))
            );
            const cStatus = commitment ? commitment.status : "no-data";

            // Should this row be dimmed?
            const dimTrade = betterState.selectedTrade && t.trade !== betterState.selectedTrade;
            if (dimTrade) row.classList.add("gantt-dimmed");

            // Task
            const taskTd = document.createElement("td");
            taskTd.className = "gantt-task-col";
            taskTd.textContent = t.task;
            row.appendChild(taskTd);

            // Trade
            const tradeTd = document.createElement("td");
            tradeTd.className = "gantt-trade-col";
            if (t.trade && DATA.trades[t.trade]) {
                tradeTd.innerHTML = `<span style="color:${DATA.trades[t.trade].colour}">${t.trade}</span>`;
                tradeTd.style.cursor = "pointer";
                tradeTd.addEventListener("click", () => {
                    document.getElementById("better-trade").value = t.trade;
                    betterState.selectedTrade = t.trade;
                    renderBetterAll();
                });
            } else {
                tradeTd.textContent = t.trade || "\u2014";
            }
            row.appendChild(tradeTd);

            // Status badge
            const statusTd = document.createElement("td");
            statusTd.className = "gantt-status-col";
            const badges = {
                "confirmed": '<span class="status-badge badge-confirmed">\u2713</span>',
                "pending-confirm": '<span class="status-badge badge-pending">\u23F3</span>',
                "rejected": '<span class="status-badge badge-rejected">\u2717</span>',
                "no-data": '<span class="status-badge badge-nodata">\u2014</span>'
            };
            statusTd.innerHTML = badges[cStatus] || badges["no-data"];
            row.appendChild(statusTd);

            // Calculate this task's slip offset
            const taskSlip = slipOffsets[t.task] || 0;

            // Day cells
            for (let d = 0; d < totalDays; d++) {
                const td = document.createElement("td");
                if (d % 5 === 0) td.style.borderLeft = "2px solid var(--border)";

                const originalStart = dayOffset;
                const originalEnd = dayOffset + t.days;
                const shiftedStart = dayOffset + taskSlip;
                const shiftedEnd = shiftedStart + t.days;
                const inOriginal = d >= originalStart && d < originalEnd;
                const inShifted = d >= shiftedStart && d < shiftedEnd;

                if (taskSlip > 0) {
                    // Cascade active for this task
                    if (inOriginal && !inShifted) {
                        // Ghost: where it was
                        td.className = "gantt-bar-ghost";
                    } else if (inShifted) {
                        // Shifted position
                        td.className = "gantt-bar-shifted";
                        if (d === shiftedStart) td.textContent = `+${taskSlip}d`;
                    }
                } else if (inOriginal) {
                    // Normal bar
                    const barClass = cStatus === "confirmed" ? "gantt-bar-confirmed" :
                        cStatus === "pending-confirm" ? "gantt-bar-pending" :
                        cStatus === "rejected" ? "gantt-bar-rejected" :
                        t.gate ? "gantt-bar-gate" : "gantt-bar-default";
                    td.className = barClass;
                    if (d === dayOffset) td.textContent = `P${plot}`;
                }
                row.appendChild(td);
            }

            tbody.appendChild(row);
            dayOffset += t.days;
        });
    });

    table.appendChild(tbody);

    const wrapper = document.createElement("div");
    wrapper.className = "gantt-scroll";
    wrapper.appendChild(table);
    el.appendChild(wrapper);
}

// --- COMMITMENTS (sorted by date, filtered) ---
function renderCommitments() {
    const list = document.getElementById("commitment-list");
    list.innerHTML = "";

    let filtered = [...betterState.commitments];
    if (betterState.selectedPlot) {
        filtered = filtered.filter(c => c.plot === betterState.selectedPlot || c.plot.includes(betterState.selectedPlot));
    }
    if (betterState.selectedTrade) {
        filtered = filtered.filter(c => c.trade === betterState.selectedTrade);
    }

    // Sort by date
    filtered.sort((a, b) => a.date.localeCompare(b.date));

    document.getElementById("commitment-count").textContent = `(${filtered.length})`;

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">No commitments match the current filter.</div>';
        return;
    }

    filtered.forEach((c, idx) => {
        const div = document.createElement("div");
        div.className = `commitment-item ${c.status}`;
        const tradeColour = DATA.trades[c.trade] ? DATA.trades[c.trade].colour : "#888";

        const statusLabels = {
            "confirmed": '<span class="dep-gate pass">\u2713 Confirmed</span>',
            "pending-confirm": '<span class="dep-gate pending-gate">\u23F3 Awaiting</span>',
            "rejected": '<span class="dep-gate fail">\u2717 Rejected</span>'
        };

        // Build action buttons based on status
        let actionsHtml = "";
        if (c.status === "pending-confirm") {
            actionsHtml = `
                <button class="btn btn-success btn-sm btn-confirm">Confirm</button>
                <button class="btn btn-danger btn-sm btn-reject">Reject</button>
                <button class="btn btn-ghost btn-sm btn-reschedule">\u{1F4C5} Reschedule</button>
            `;
        } else if (c.status === "rejected") {
            actionsHtml = `
                ${statusLabels[c.status]}
                <button class="btn btn-warning btn-sm btn-reschedule">\u{1F4C5} Reschedule</button>
                <button class="btn btn-primary btn-sm btn-find-alt">\u{1F50D} Find alternative</button>
            `;
        } else if (c.status === "rescheduled") {
            actionsHtml = '<span class="dep-gate pending-gate">\u{1F4C5} Rescheduled</span>';
        } else if (c.status === "reassigned") {
            actionsHtml = '<span class="dep-gate pass">\u{1F504} Reassigned</span>';
        } else {
            actionsHtml = statusLabels[c.status] || "";
        }

        div.innerHTML = `
            <div class="comm-info">
                <div class="comm-trade" style="color:${tradeColour}">${c.trade}</div>
                <div class="comm-detail">${c.task} \u2014 Plot ${c.plot} \u2014 ${c.dateStr} \u2014 ${c.phase}</div>
            </div>
            <div class="commitment-actions">${actionsHtml}</div>
        `;

        // Click on trade name to select
        div.querySelector(".comm-trade").style.cursor = "pointer";
        div.querySelector(".comm-trade").addEventListener("click", () => {
            document.getElementById("better-trade").value = c.trade;
            betterState.selectedTrade = c.trade;
            renderBetterAll();
        });

        // Confirm button
        const confirmBtn = div.querySelector(".btn-confirm");
        if (confirmBtn) {
            confirmBtn.addEventListener("click", () => {
                const orig = findCommitment(c);
                if (orig) orig.status = "confirmed";
                renderBetterAll();
            });
        }

        // Reject button
        const rejectBtn = div.querySelector(".btn-reject");
        if (rejectBtn) {
            rejectBtn.addEventListener("click", () => {
                const orig = findCommitment(c);
                if (orig) orig.status = "rejected";
                renderBetterAll();
            });
        }

        // Reschedule button
        const rescheduleBtn = div.querySelector(".btn-reschedule");
        if (rescheduleBtn) {
            rescheduleBtn.addEventListener("click", () => {
                showReschedulePanel(c, div);
            });
        }

        // Find alternative button
        const findAltBtn = div.querySelector(".btn-find-alt");
        if (findAltBtn) {
            findAltBtn.addEventListener("click", () => {
                showAlternativePanel(c, div);
            });
        }

        list.appendChild(div);
    });
}

function findCommitment(c) {
    return betterState.commitments.find(x =>
        x.trade === c.trade && x.task === c.task && x.plot === c.plot && x.dateStr === c.dateStr
    );
}

// --- RESCHEDULE PANEL ---
function showReschedulePanel(commitment, parentDiv) {
    // Remove any existing inline panels
    document.querySelectorAll(".inline-action-panel").forEach(p => p.remove());

    const panel = document.createElement("div");
    panel.className = "inline-action-panel";

    // Generate available date options (next 5 working days from original)
    const baseParts = commitment.dateStr.split("/");
    const baseDay = parseInt(baseParts[0]);
    const baseMonth = parseInt(baseParts[1]);
    const offsets = [2, 3, 4, 5, 7]; // working day offsets
    const dateOptions = offsets.map(off => {
        const newDay = ((baseDay + off - 1) % 28) + 1;
        const newMonth = baseDay + off > 28 ? ((baseMonth) % 12) + 1 : baseMonth;
        return `${String(newDay).padStart(2,"0")}/${String(newMonth).padStart(2,"0")}`;
    });

    panel.innerHTML = `
        <div class="inline-panel-header">
            <strong>Reschedule ${commitment.task}</strong>
            <button class="btn btn-ghost btn-sm inline-panel-close">\u2715</button>
        </div>
        <div class="inline-panel-body">
            <p class="hint" style="margin-bottom:6px;">Select new date. All downstream tasks will auto-cascade.</p>
            <div class="reschedule-options">
                ${dateOptions.map(d => `<button class="btn btn-ghost btn-sm reschedule-date" data-date="${d}">${d}</button>`).join("")}
            </div>
        </div>
    `;

    parentDiv.after(panel);

    // Close button
    panel.querySelector(".inline-panel-close").addEventListener("click", () => panel.remove());

    // Date selection
    panel.querySelectorAll(".reschedule-date").forEach(btn => {
        btn.addEventListener("click", () => {
            const newDate = btn.dataset.date;
            const orig = findCommitment(commitment);
            if (orig) {
                const oldDate = orig.dateStr;
                orig.dateStr = newDate;
                orig.date = `2025-${newDate.split("/").reverse().join("-")}`;
                orig.status = "rescheduled";

                // Add to feed
                addFeedItem("system", `${orig.trade} ${orig.task} Plot ${orig.plot} rescheduled: ${oldDate} \u2192 ${newDate}. Downstream tasks recalculated.`);
            }
            panel.remove();
            renderBetterAll();
        });
    });
}

// --- FIND ALTERNATIVE PANEL ---
const alternativeTrades = {
    "AR Joinery": [
        { name:"BK Carpentry", contact:"Ben K", phone:"07700 900777", onTime:82, available:"Mon\u2013Wed next week", note:"Worked on Riverside, knows the house types." },
        { name:"T&S Joinery", contact:"Tom S", phone:"07700 900888", onTime:74, available:"From Thursday", note:"Cheaper but slower. Good for overflow." },
    ],
    "PB Plumbing": [
        { name:"Mark's Plumbing", contact:"Mark D", phone:"07700 900666", onTime:88, available:"Thu\u2013Fri this week", note:"Reliable. Slightly higher rate but rarely slips." },
        { name:"Aquaflow", contact:"Steve W", phone:"07700 900555", onTime:70, available:"Next week", note:"Large crew but mixed reviews on finish quality." },
    ],
    "C Owen": [
        { name:"Spark Electrical", contact:"Dan P", phone:"07700 900444", onTime:85, available:"Immediately", note:"Two-man team. Fast but charges premium for short notice." },
    ],
    "Max Energy": [
        { name:"EcoInsulate", contact:"James H", phone:"07700 900333", onTime:90, available:"From Wednesday", note:"Specialist in loft insulation. Very tidy." },
    ],
    "Ian Austin": [
        { name:"Premier Plastering", contact:"Lee M", phone:"07700 900222", onTime:76, available:"Next week", note:"Covers tack and skim. Two-man crew." },
    ],
    "Clean": [
        { name:"SiteClean Ltd", contact:"Office", phone:"07700 900111", onTime:95, available:"Same day", note:"Industrial clean specialists." },
    ],
};

function showAlternativePanel(commitment, parentDiv) {
    // Remove any existing inline panels
    document.querySelectorAll(".inline-action-panel").forEach(p => p.remove());

    const panel = document.createElement("div");
    panel.className = "inline-action-panel";

    const alts = alternativeTrades[commitment.trade] || [];

    panel.innerHTML = `
        <div class="inline-panel-header">
            <strong>Alternatives for ${commitment.trade}</strong>
            <button class="btn btn-ghost btn-sm inline-panel-close">\u2715</button>
        </div>
        <div class="inline-panel-body">
            <p class="hint" style="margin-bottom:6px;">${commitment.task} \u2014 Plot ${commitment.plot} \u2014 ${commitment.dateStr}</p>
            ${alts.length === 0 ? '<div class="empty-state">No alternatives on file for this trade type.</div>' : ""}
            <div class="alt-trade-list">
                ${alts.map(a => {
                    const scoreColour = a.onTime >= 85 ? "var(--green)" : a.onTime >= 75 ? "var(--yellow)" : "var(--red)";
                    return `
                        <div class="alt-trade-card">
                            <div class="alt-trade-header">
                                <span class="alt-trade-name">${a.name}</span>
                                <span class="alt-trade-score" style="color:${scoreColour}">${a.onTime}% on-time</span>
                            </div>
                            <div class="alt-trade-meta">
                                \u{1F4F1} ${a.contact} ${a.phone} \u00b7 Available: ${a.available}
                            </div>
                            <div class="alt-trade-note">${a.note}</div>
                            <div class="alt-trade-actions">
                                <button class="btn btn-success btn-sm btn-assign-alt" data-name="${a.name}" data-contact="${a.contact}">Assign ${a.name}</button>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;

    parentDiv.after(panel);

    // Close button
    panel.querySelector(".inline-panel-close").addEventListener("click", () => panel.remove());

    // Assign buttons
    panel.querySelectorAll(".btn-assign-alt").forEach(btn => {
        btn.addEventListener("click", () => {
            const altName = btn.dataset.name;
            const altContact = btn.dataset.contact;
            const orig = findCommitment(commitment);
            if (orig) {
                const oldTrade = orig.trade;
                orig.trade = altName;
                orig.status = "reassigned";

                // Add to feed
                addFeedItem("system", `${commitment.task} Plot ${commitment.plot}: reassigned from ${oldTrade} to ${altName}. ${altContact} notified.`);
                addFeedItem("confirm", `${altName} auto-sent confirmation request for ${commitment.dateStr}.`);
            }
            panel.remove();
            renderBetterAll();
        });
    });
}

// --- FEED HELPERS ---
function addFeedItem(type, text) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
    if (!betterState.extraFeed) betterState.extraFeed = [];
    betterState.extraFeed.unshift({ time: timeStr, type, text });
}

// --- COMPANY DETAIL ---
function renderCompanyDetail() {
    const el = document.getElementById("company-detail");
    const nameEl = document.getElementById("company-detail-name");
    const trade = betterState.selectedTrade;

    if (!trade || !DATA.trades[trade]) {
        nameEl.textContent = "— select a trade above or click a trade name";
        el.innerHTML = '<div class="empty-state">Click any trade name to see contacts, reliability, and notes.</div>';
        return;
    }

    const t = DATA.trades[trade];
    const r = DATA.tradeReliability[trade];
    const comms = betterState.commitments.filter(c => c.trade === trade);
    const confirmed = comms.filter(c => c.status === "confirmed").length;
    const pending = comms.filter(c => c.status === "pending-confirm").length;
    const rejected = comms.filter(c => c.status === "rejected").length;

    // Simulated POC data
    const pocs = {
        "AR Joinery": [
            { name:"Andy Richardson", role:"Owner / Lead Joiner", phone:"07700 900123", email:"andy@arjoinery.co.uk", note:"Best reached before 7am or after 5pm. Prefers text to calls." },
            { name:"Dave R", role:"Site Foreman", phone:"07700 900124", email:"", note:"On site daily. Go-to for day-of issues." },
        ],
        "PB Plumbing": [
            { name:"Paul Bradley", role:"Owner", phone:"07700 900345", email:"paul@pbplumbing.co.uk", note:"Runs 3 crews. Sometimes overcommits — confirm 48hrs before." },
            { name:"Mark B", role:"Lead Plumber", phone:"07700 900346", email:"", note:"Reliable. Usually on Oakfield." },
        ],
        "C Owen": [
            { name:"Chris Owen", role:"Owner / Sole Trader", phone:"07700 900456", email:"chris@cowen-elec.co.uk", note:"One-man band, very reliable but no backup if he's ill." },
        ],
        "Ian Austin": [
            { name:"Ian Austin", role:"Owner", phone:"07700 900567", email:"ian@austinplastering.co.uk", note:"Tack and plaster. Steady pace, rarely slips. Wife handles bookings — call office number for scheduling." },
            { name:"Office", role:"Bookings", phone:"01234 567890", email:"bookings@austinplastering.co.uk", note:"" },
        ],
        "Max Energy": [
            { name:"Max Sheridan", role:"Director", phone:"07700 900234", email:"max@maxenergy.co.uk", note:"Handles quoting and scheduling. Can be slow to respond — chase after 24hrs." },
            { name:"Site Crew Lead", role:"Varies", phone:"", email:"", note:"Crew assigned per job. Check with Max who's coming." },
        ],
        "Clean": [
            { name:"TBC", role:"Various", phone:"", email:"", note:"Use whoever is available. Usually same-day booking." },
        ],
    };

    nameEl.innerHTML = `— <span style="color:${t.colour}">${trade}</span>`;

    const contacts = pocs[trade] || [{ name: t.contact, role:"Primary", phone: t.phone, email:"", note:"" }];

    el.innerHTML = `
        <div class="detail-stats">
            <div class="detail-stat">
                <div class="detail-stat-value" style="color:var(--green)">${r ? Math.round(r.onTime * 100) + "%" : "—"}</div>
                <div class="detail-stat-label">On-time rate</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${r ? r.avgSlipDays + "d" : "—"}</div>
                <div class="detail-stat-label">Avg slip</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${r ? r.completedJobs : "—"}</div>
                <div class="detail-stat-label">Jobs done</div>
            </div>
            <div class="detail-stat">
                <div class="detail-stat-value">${confirmed}<span style="color:var(--text-dim)">/${comms.length}</span></div>
                <div class="detail-stat-label">Confirmed</div>
            </div>
            ${pending > 0 ? `<div class="detail-stat"><div class="detail-stat-value" style="color:var(--yellow)">${pending}</div><div class="detail-stat-label">Pending</div></div>` : ""}
            ${rejected > 0 ? `<div class="detail-stat"><div class="detail-stat-value" style="color:var(--red)">${rejected}</div><div class="detail-stat-label">Rejected</div></div>` : ""}
        </div>
        <div class="detail-contacts">
            <h4>Contacts</h4>
            ${contacts.map(c => `
                <div class="detail-contact">
                    <div class="contact-name">${c.name}${c.role ? ` <span class="contact-role">${c.role}</span>` : ""}</div>
                    ${c.phone ? `<div class="contact-line">\u{1F4F1} ${c.phone}</div>` : ""}
                    ${c.email ? `<div class="contact-line">\u{1F4E7} ${c.email}</div>` : ""}
                    ${c.note ? `<div class="contact-note">${c.note}</div>` : ""}
                </div>
            `).join("")}
        </div>
    `;
}

// --- CASCADE SIMULATOR ---
function renderCascade() {
    const timeline = document.getElementById("cascade-timeline");
    timeline.innerHTML = "";

    const plot = betterState.selectedPlot || "27";

    const allTasks = [];
    let dayOffset = 0;
    DATA.buildSequence.forEach(phase => {
        phase.tasks.forEach(t => {
            allTasks.push({ task: t.task, trade: t.trade, start: dayOffset, duration: t.days, phase: phase.phase });
            dayOffset += t.days;
        });
    });

    const totalDays = dayOffset;

    allTasks.forEach(t => {
        const row = document.createElement("div");
        row.className = "cascade-row";
        if (betterState.selectedTrade && t.trade !== betterState.selectedTrade) {
            row.classList.add("cascade-dimmed");
        }

        const label = document.createElement("div");
        label.className = "cascade-label";
        label.textContent = t.task;
        row.appendChild(label);

        const wrap = document.createElement("div");
        wrap.className = "cascade-bar-wrap";
        wrap.dataset.task = t.task;
        wrap.dataset.start = t.start;
        wrap.dataset.duration = t.duration;

        const bar = document.createElement("div");
        bar.className = "cascade-bar on-time";
        bar.style.width = `${(t.duration / totalDays) * 100}%`;
        bar.style.marginLeft = `${(t.start / totalDays) * 100}%`;
        bar.textContent = `P${plot}`;
        wrap.appendChild(bar);

        row.appendChild(wrap);
        timeline.appendChild(row);
    });
}

function simulateCascade() {
    if (betterState.slipActive) {
        betterState.slipActive = false;
        betterState.slipPhase = null;
        document.getElementById("cascade-slip-btn").textContent = "Simulate 2-Day Slip";
        document.getElementById("cascade-slip-btn").className = "btn btn-warning";
        renderCascade();
        renderBetterGantt();
        return;
    }

    const phaseFilter = document.getElementById("cascade-phase").value;
    const phaseName = { "first-fix":"1st Fix", "plaster":"Plaster Fix", "second-fix":"2nd Fix", "final":"Final Fix" }[phaseFilter];

    betterState.slipActive = true;
    betterState.slipPhase = phaseName;
    document.getElementById("cascade-slip-btn").textContent = "Reset Cascade";
    document.getElementById("cascade-slip-btn").className = "btn btn-ghost";

    // Re-render the Gantt with slip overlay
    renderBetterGantt();

    const timeline = document.getElementById("cascade-timeline");
    const rows = timeline.querySelectorAll(".cascade-row");
    const slipDays = 2;

    let slipStarted = false;
    let cumulativeSlip = 0;
    let totalDays = 0;
    DATA.buildSequence.forEach(phase => phase.tasks.forEach(t => { totalDays += t.days; }));

    let dayOffset = 0;
    let taskIdx = 0;

    DATA.buildSequence.forEach(phase => {
        phase.tasks.forEach((t, i) => {
            // Skip the phase header row concept — we're working with cascade rows directly
            const row = rows[taskIdx];
            if (!row) { taskIdx++; return; }

            const wrap = row.querySelector(".cascade-bar-wrap");
            if (!wrap) { taskIdx++; return; }

            if (phase.phase === phaseName && i === 0 && !slipStarted) {
                slipStarted = true;
                cumulativeSlip = slipDays;
            }

            if (cumulativeSlip > 0) {
                wrap.innerHTML = "";

                const origBar = document.createElement("div");
                origBar.className = "cascade-bar original";
                origBar.style.width = `${(t.days / (totalDays + slipDays)) * 100}%`;
                origBar.style.marginLeft = `${(dayOffset / (totalDays + slipDays)) * 100}%`;
                origBar.style.position = "absolute";
                wrap.appendChild(origBar);

                const shiftBar = document.createElement("div");
                shiftBar.className = "cascade-bar shifted";
                shiftBar.style.width = `${(t.days / (totalDays + slipDays)) * 100}%`;
                shiftBar.style.left = `${((dayOffset + cumulativeSlip) / (totalDays + slipDays)) * 100}%`;
                shiftBar.textContent = `+${cumulativeSlip}d`;
                wrap.appendChild(shiftBar);
            }

            dayOffset += t.days;
            taskIdx++;
        });
    });
}

// --- DEPENDENCIES ---
function renderDependencies() {
    const viz = document.getElementById("dependency-viz");
    viz.innerHTML = "";

    const plot = betterState.selectedPlot || "27";

    const plot27States = { "1st Fix":"unlocked", "Inspection":"unlocked", "Plaster Fix":"unlocked", "2nd Fix":"active-dep", "Final Fix":"locked" };
    const gates = { "1st Fix":"pass", "Inspection":"pass", "Plaster Fix":"pass", "2nd Fix":"pending-gate", "Final Fix":null };

    const label = document.createElement("div");
    label.style.cssText = "font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;";
    label.textContent = `Plot ${plot} \u2014 Dependency chain`;
    viz.appendChild(label);

    const row = document.createElement("div");
    row.className = "dep-row";
    row.style.flexWrap = "wrap";

    Object.keys(plot27States).forEach((phase, i, arr) => {
        const node = document.createElement("div");
        node.className = `dep-node ${plot27States[phase]}`;
        let html = phase;
        if (gates[phase]) {
            const gLabel = gates[phase] === "pass" ? "\u2713 Passed" : gates[phase] === "fail" ? "\u2717 Failed" : "\u23F3 In progress";
            html += ` <span class="dep-gate ${gates[phase]}">${gLabel}</span>`;
        }
        node.innerHTML = html;
        row.appendChild(node);

        if (i < arr.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "dep-arrow";
            arrow.textContent = "\u2192";
            row.appendChild(arrow);
        }
    });

    viz.appendChild(row);
}

// --- FORECAST ---
function renderForecast() {
    const viz = document.getElementById("forecast-viz");
    viz.innerHTML = "";

    let entries = Object.entries(DATA.tradeReliability);
    if (betterState.selectedTrade) {
        entries = entries.filter(([trade]) => trade === betterState.selectedTrade);
    }

    entries.forEach(([trade, stats]) => {
        const row = document.createElement("div");
        row.className = "forecast-row";
        const pct = Math.round(stats.onTime * 100);
        const level = pct >= 85 ? "high" : pct >= 75 ? "medium" : "low";
        const tradeColour = DATA.trades[trade] ? DATA.trades[trade].colour : "#888";

        row.innerHTML = `
            <div class="forecast-header">
                <span class="forecast-trade" style="color:${tradeColour}">${trade}</span>
                <span class="forecast-pct" style="color:var(--${level === "high" ? "green" : level === "medium" ? "yellow" : "red"})">${pct}% on-time</span>
            </div>
            <div class="forecast-bar-bg">
                <div class="forecast-bar-fill ${level}" style="width:${pct}%">${pct}%</div>
            </div>
            <div class="forecast-detail">
                ${stats.completedJobs} jobs \u00b7 avg slip: ${stats.avgSlipDays}d${pct < 80 ? " \u2014 consider buffer" : ""}
            </div>
        `;
        viz.appendChild(row);
    });

    const note = document.createElement("div");
    note.style.cssText = "margin-top:8px;padding:8px 12px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:4px;font-size:0.75rem;color:var(--text-muted);";
    note.innerHTML = `<strong style="color:var(--accent)">Over time:</strong> Every completed task feeds the model. After 20\u201330 jobs per trade, forecasts tighten to reflect this specific trade's actual pace on this type of task.`;
    viz.appendChild(note);
}

// --- MATERIALS ---
function renderMaterials() {
    const list = document.getElementById("materials-list");
    list.innerHTML = "";

    const materials = [
        { name:"2nd fix joinery pack", plots:"23-30", status:"confirmed", trade:"AR Joinery", date:"Delivered 16/02" },
        { name:"Tiler materials", plots:"23-30", status:"ordered", trade:null, date:"ETA 24/02" },
        { name:"Cylinder flooring", plots:"23-30", status:"ordered", trade:null, date:"ETA 24/02" },
        { name:"Kitchen units (Plot 28)", plots:"28", status:"confirmed", trade:null, date:"Delivered 01/03" },
        { name:"Kitchen units (Plot 26)", plots:"26", status:"ordered", trade:null, date:"ETA 10/03" },
        { name:"Plaster (Plots 24-25)", plots:"24-25", status:"ordered", trade:"Ian Austin", date:"ETA 03/03" },
        { name:"Insulation (Plots 47-49)", plots:"47-49", status:"missing", trade:"Max Energy", date:"Not ordered" },
        { name:"Elec 2nd fix parts (Plot 27)", plots:"27", status:"confirmed", trade:"C Owen", date:"Delivered 05/03" },
    ];

    let filtered = materials;
    if (betterState.selectedPlot) {
        filtered = filtered.filter(m => m.plots.includes(betterState.selectedPlot));
    }
    if (betterState.selectedTrade) {
        filtered = filtered.filter(m => m.trade === betterState.selectedTrade || !m.trade);
    }

    filtered.forEach(m => {
        const div = document.createElement("div");
        div.className = `material-item mat-${m.status}`;
        div.innerHTML = `
            <div class="mat-info">
                <div class="mat-name">${m.name}</div>
                <div class="mat-detail">Plots ${m.plots}${m.trade ? " \u00b7 " + m.trade : ""} \u00b7 ${m.date}</div>
            </div>
            <span class="mat-status ${m.status}">${m.status === "missing" ? "NOT ORDERED" : m.status.toUpperCase()}</span>
        `;
        list.appendChild(div);
    });
}
