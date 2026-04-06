// === BETTER TIER: Commitments, dependencies, cascade, forecasting ===

function initBetterTier() {
    renderCommitments();
    renderDependencies();
    renderCascade();
    renderForecast();
    renderMaterials();

    // Cascade simulator
    populateCascadePlots();
    document.getElementById("cascade-slip-btn").addEventListener("click", simulateCascade);
}

// --- COMMITMENTS ---
function renderCommitments() {
    const list = document.getElementById("commitment-list");
    list.innerHTML = "";

    // Generate upcoming commitments from schedule data
    const upcoming = [
        { trade: "AR Joinery", task: "Joiner 1st fix finish", plot: "31", date: "09/03", status: "confirmed" },
        { trade: "AR Joinery", task: "Joiner 1st fix finish", plot: "1", date: "12/03", status: "pending-confirm" },
        { trade: "PB Plumbing", task: "Plumber 1st fix", plot: "30", date: "06/03", status: "confirmed" },
        { trade: "PB Plumbing", task: "Plumber 1st fix", plot: "31", date: "09/03", status: "pending-confirm" },
        { trade: "C Owen", task: "Electrician 1st fix", plot: "31", date: "11/03", status: "pending-confirm" },
        { trade: "Max Energy", task: "Insulation walls", plot: "47-49", date: "09/03", status: "rejected" },
        { trade: "Ian Austin", task: "Tack", plot: "25", date: "06/03", status: "confirmed" },
        { trade: "Ian Austin", task: "Plaster", plot: "25", date: "11/03", status: "pending-confirm" },
    ];

    upcoming.forEach(c => {
        const div = document.createElement("div");
        div.className = `commitment-item ${c.status}`;

        const statusLabels = {
            "confirmed": '<span class="dep-gate pass">Confirmed</span>',
            "pending-confirm": '<span class="dep-gate pending-gate">Awaiting</span>',
            "rejected": '<span class="dep-gate fail">Rejected</span>'
        };

        const tradeColour = DATA.trades[c.trade] ? DATA.trades[c.trade].colour : "#888";

        div.innerHTML = `
            <div class="comm-info">
                <div class="comm-trade" style="color:${tradeColour}">${c.trade}</div>
                <div class="comm-detail">${c.task} — Plot ${c.plot} — ${c.date}</div>
            </div>
            <div class="commitment-actions">
                ${c.status === "pending-confirm" ? `
                    <button class="btn btn-success btn-sm" onclick="confirmCommitment(this)">Confirm</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectCommitment(this)">Reject</button>
                ` : statusLabels[c.status]}
            </div>
        `;
        list.appendChild(div);
    });
}

function confirmCommitment(btn) {
    const item = btn.closest(".commitment-item");
    item.className = "commitment-item confirmed";
    const actions = item.querySelector(".commitment-actions");
    actions.innerHTML = '<span class="dep-gate pass">Confirmed</span>';

    // Simulate notification
    showBetterNotif("Confirmation received. Slot locked in programme.");
}

function rejectCommitment(btn) {
    const item = btn.closest(".commitment-item");
    item.className = "commitment-item rejected";
    const actions = item.querySelector(".commitment-actions");
    actions.innerHTML = '<span class="dep-gate fail">Rejected</span>';

    showBetterNotif("Slot rejected. Downstream tasks flagged for rescheduling.");
}

function showBetterNotif(msg) {
    // Brief flash notification at top of commitment panel
    const panel = document.querySelector(".commitment-panel");
    const existing = panel.querySelector(".flash-notif");
    if (existing) existing.remove();

    const flash = document.createElement("div");
    flash.className = "flash-notif";
    flash.style.cssText = "padding:8px 12px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:4px;font-size:0.78rem;color:#60a5fa;margin-bottom:8px;animation:slideIn 0.3s ease-out;";
    flash.textContent = msg;
    panel.querySelector(".commitment-list").prepend(flash);
    setTimeout(() => flash.remove(), 3000);
}

// --- DEPENDENCIES ---
function renderDependencies() {
    const viz = document.getElementById("dependency-viz");
    viz.innerHTML = "";

    // Show dependency chain for Plot 27 (most complete in the data)
    const plot27States = {
        "1st Fix": "unlocked",
        "Inspection": "unlocked",
        "Plaster Fix": "unlocked",
        "2nd Fix": "active-dep",
        "Final Fix": "locked"
    };

    const gates = {
        "1st Fix": "pass",
        "Inspection": "pass",
        "Plaster Fix": "pass",
        "2nd Fix": "pending-gate",
        "Final Fix": null
    };

    const label = document.createElement("div");
    label.style.cssText = "font-size:0.78rem;color:var(--text-muted);margin-bottom:6px;";
    label.textContent = "Plot 27 — Dependency chain";
    viz.appendChild(label);

    const row = document.createElement("div");
    row.className = "dep-row";
    row.style.flexWrap = "wrap";

    const phases = Object.keys(plot27States);
    phases.forEach((phase, i) => {
        const node = document.createElement("div");
        node.className = `dep-node ${plot27States[phase]}`;
        let html = phase;
        if (gates[phase]) {
            html += ` <span class="dep-gate ${gates[phase]}">${gates[phase] === "pass" ? "\u2713 Passed" : gates[phase] === "fail" ? "\u2717 Failed" : "\u23F3 In progress"}</span>`;
        }
        node.innerHTML = html;
        row.appendChild(node);

        if (i < phases.length - 1) {
            const arrow = document.createElement("div");
            arrow.className = "dep-arrow";
            arrow.textContent = "\u2192";
            row.appendChild(arrow);
        }
    });

    viz.appendChild(row);

    // Show material gate example
    const matLabel = document.createElement("div");
    matLabel.style.cssText = "font-size:0.78rem;color:var(--text-muted);margin-top:12px;margin-bottom:6px;";
    matLabel.textContent = "Material gate: 2nd fix materials must be confirmed before scheduling";
    viz.appendChild(matLabel);

    const matRow = document.createElement("div");
    matRow.className = "dep-row";
    ["Materials ordered", "Delivery confirmed", "On site verified", "2nd Fix unlocked"].forEach((step, i) => {
        const node = document.createElement("div");
        node.className = `dep-node ${i < 2 ? "unlocked" : i === 2 ? "active-dep" : "locked"}`;
        node.textContent = step;
        matRow.appendChild(node);
        if (i < 3) {
            const arrow = document.createElement("div");
            arrow.className = "dep-arrow";
            arrow.textContent = "\u2192";
            matRow.appendChild(arrow);
        }
    });
    viz.appendChild(matRow);
}

// --- CASCADE SIMULATOR ---
function populateCascadePlots() {
    const sel = document.getElementById("cascade-plot");
    DATA.plots.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = `Plot ${p}`;
        sel.appendChild(opt);
    });
    sel.value = "27";
    renderCascade();
}

function renderCascade() {
    const timeline = document.getElementById("cascade-timeline");
    timeline.innerHTML = "";

    const plot = document.getElementById("cascade-plot").value || "27";

    // Show all phases for this plot with original timing
    const allTasks = [];
    let dayOffset = 0;
    DATA.buildSequence.forEach(phase => {
        phase.tasks.forEach(t => {
            allTasks.push({
                task: t.task,
                trade: t.trade,
                start: dayOffset,
                duration: t.days,
                phase: phase.phase,
                shifted: false,
                shiftAmount: 0
            });
            dayOffset += t.days;
        });
    });

    const totalDays = dayOffset;

    allTasks.forEach(t => {
        const row = document.createElement("div");
        row.className = "cascade-row";

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
        bar.textContent = `Plot ${plot}`;
        wrap.appendChild(bar);

        row.appendChild(wrap);
        timeline.appendChild(row);
    });
}

function simulateCascade() {
    const timeline = document.getElementById("cascade-timeline");
    const bars = timeline.querySelectorAll(".cascade-bar-wrap");
    const slipDays = 2;
    const phaseFilter = document.getElementById("cascade-phase").value;
    const phaseName = {
        "first-fix": "1st Fix",
        "plaster": "Plaster Fix",
        "second-fix": "2nd Fix",
        "final": "Final Fix"
    }[phaseFilter];

    let slipStarted = false;
    let cumulativeSlip = 0;

    // Recalculate total
    let totalDays = 0;
    DATA.buildSequence.forEach(phase => {
        phase.tasks.forEach(t => { totalDays += t.days; });
    });

    let dayOffset = 0;
    let taskIdx = 0;

    DATA.buildSequence.forEach(phase => {
        phase.tasks.forEach((t, i) => {
            const wrap = bars[taskIdx];
            if (!wrap) { taskIdx++; return; }

            // First task in the selected phase triggers the slip
            if (phase.phase === phaseName && i === 0 && !slipStarted) {
                slipStarted = true;
                cumulativeSlip = slipDays;
            }

            if (cumulativeSlip > 0) {
                // Clear existing bars
                wrap.innerHTML = "";

                // Original bar (faded)
                const origBar = document.createElement("div");
                origBar.className = "cascade-bar original";
                origBar.style.width = `${(t.days / (totalDays + slipDays)) * 100}%`;
                origBar.style.marginLeft = `${(dayOffset / (totalDays + slipDays)) * 100}%`;
                origBar.style.position = "absolute";
                wrap.appendChild(origBar);

                // Shifted bar
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

    // Show summary
    const btn = document.getElementById("cascade-slip-btn");
    btn.textContent = "Reset";
    btn.className = "btn btn-ghost";
    btn.onclick = () => {
        btn.textContent = "Simulate 2-Day Slip";
        btn.className = "btn btn-warning";
        btn.onclick = simulateCascade;
        renderCascade();
    };
}

// --- PROBABILISTIC FORECAST ---
function renderForecast() {
    const viz = document.getElementById("forecast-viz");
    viz.innerHTML = "";

    const label = document.createElement("div");
    label.style.cssText = "font-size:0.78rem;color:var(--text-muted);margin-bottom:8px;";
    label.textContent = "Plot 27 — Completion confidence by trade (based on historical performance data)";
    viz.appendChild(label);

    Object.entries(DATA.tradeReliability).forEach(([trade, stats]) => {
        const row = document.createElement("div");
        row.className = "forecast-row";

        const pct = Math.round(stats.onTime * 100);
        const level = pct >= 85 ? "high" : pct >= 75 ? "medium" : "low";
        const tradeColour = DATA.trades[trade] ? DATA.trades[trade].colour : "#888";

        row.innerHTML = `
            <div class="forecast-header">
                <span class="forecast-trade" style="color:${tradeColour}">${trade}</span>
                <span class="forecast-pct" style="color:var(--${level === 'high' ? 'green' : level === 'medium' ? 'yellow' : 'red'})">${pct}% on-time</span>
            </div>
            <div class="forecast-bar-bg">
                <div class="forecast-bar-fill ${level}" style="width:${pct}%">
                    ${pct}% confidence
                </div>
            </div>
            <div class="forecast-detail">
                ${stats.completedJobs} jobs completed \u00b7 avg slip: ${stats.avgSlipDays} days \u00b7
                Next task likely ${pct >= 85 ? "on time" : `${stats.avgSlipDays} days late`}
                ${pct < 80 ? " \u2014 consider buffer" : ""}
            </div>
        `;

        viz.appendChild(row);
    });

    // Add the "over time" explanation
    const note = document.createElement("div");
    note.style.cssText = "margin-top:12px;padding:10px 14px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:4px;font-size:0.78rem;color:var(--text-muted);";
    note.innerHTML = `<strong style="color:var(--accent)">How this improves over time:</strong> Every completed task feeds the model. Early on, forecasts use industry averages. After 20-30 jobs per trade, confidence intervals tighten to reflect <em>this specific trade's</em> actual pace on <em>this type of task</em>. After 6 months, the system knows that Ian Austin completes tack in 2.8 days (not the 3 days you planned) and that PB Plumbing slips 28% of the time on 1st fix.`;
    viz.appendChild(note);
}

// --- MATERIALS ---
function renderMaterials() {
    const list = document.getElementById("materials-list");
    list.innerHTML = "";

    const materials = [
        { name: "2nd fix joinery pack", plots: "23-30", status: "confirmed", trade: "AR Joinery", date: "Delivered 16/02" },
        { name: "Tiler materials", plots: "23-30", status: "ordered", trade: null, date: "ETA 24/02" },
        { name: "Cylinder flooring", plots: "23-30", status: "ordered", trade: null, date: "ETA 24/02" },
        { name: "Kitchen units (Plot 28)", plots: "28", status: "confirmed", trade: null, date: "Delivered 01/03" },
        { name: "Kitchen units (Plot 26)", plots: "26", status: "ordered", trade: null, date: "ETA 10/03" },
        { name: "Plaster (Plots 24-25)", plots: "24-25", status: "ordered", trade: "Ian Austin", date: "ETA 03/03" },
        { name: "Insulation (Plots 47-49)", plots: "47-49", status: "missing", trade: "Max Energy", date: "Not ordered" },
        { name: "Elec 2nd fix parts (Plot 27)", plots: "27", status: "confirmed", trade: "C Owen", date: "Delivered 05/03" },
    ];

    materials.forEach(m => {
        const div = document.createElement("div");
        div.className = `material-item mat-${m.status}`;

        const statusClass = m.status;
        const statusLabel = m.status === "missing" ? "NOT ORDERED" : m.status.toUpperCase();

        div.innerHTML = `
            <div class="mat-info">
                <div class="mat-name">${m.name}</div>
                <div class="mat-detail">Plots ${m.plots}${m.trade ? " \u00b7 " + m.trade : ""} \u00b7 ${m.date}</div>
            </div>
            <span class="mat-status ${statusClass}">${statusLabel}</span>
        `;
        list.appendChild(div);
    });
}
