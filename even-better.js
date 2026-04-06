// === EVEN BETTER TIER: Auto-programme, marketplace, delay attribution, portfolio ===

function initEvenBetterTier() {
    renderAutoProgrammePanel();
    renderCapacityMarketplace();
    renderDelayAttribution();
    renderPortfolio();

    document.getElementById("auto-generate-btn").addEventListener("click", runAutoGenerate);
}

// --- AUTO-GENERATED PROGRAMME ---
function renderAutoProgrammePanel() {
    const grid = document.getElementById("auto-programme-grid");
    grid.innerHTML = "";

    const note = document.createElement("div");
    note.style.cssText = "padding:12px 14px;background:var(--surface-2);border-radius:4px;font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;";
    note.innerHTML = `The site manager defines <strong>plots</strong> and selects a <strong>build sequence template</strong>. The system generates the optimal programme by cross-referencing confirmed trade availability, material delivery dates, inspection slot capacity, and historical completion pace per trade per task type.`;
    grid.appendChild(note);

    renderAutoGrid(grid, false);
}

function renderAutoGrid(container, optimised) {
    const table = document.createElement("table");
    const dayLabels = [];
    DATA.weeks.forEach(w => {
        w.days.forEach(d => dayLabels.push(d));
    });

    // Header
    const thead = document.createElement("thead");
    const hRow = document.createElement("tr");
    hRow.innerHTML = "<th>Task</th><th>Trade</th>";
    dayLabels.forEach(d => {
        const th = document.createElement("th");
        th.textContent = d;
        hRow.appendChild(th);
    });
    thead.appendChild(hRow);
    table.appendChild(thead);

    // Body: show first 3 plots with auto-assigned slots
    const tbody = document.createElement("tbody");
    const plotsToShow = [27, 28, 26];

    plotsToShow.forEach(plot => {
        // Section header row
        const plotRow = document.createElement("tr");
        const plotTd = document.createElement("td");
        plotTd.colSpan = dayLabels.length + 2;
        plotTd.style.cssText = "background:var(--surface-3);font-weight:700;font-size:0.75rem;color:var(--text);padding:6px 10px;";
        plotTd.textContent = `Plot ${plot}`;
        plotRow.appendChild(plotTd);
        tbody.appendChild(plotRow);

        // Stagger start by 3 working days per plot
        const plotOffset = plotsToShow.indexOf(plot) * 3;
        let taskDay = plotOffset;

        DATA.buildSequence.forEach(phase => {
            phase.tasks.forEach(t => {
                const row = document.createElement("tr");

                const taskTd = document.createElement("td");
                taskTd.style.cssText = "text-align:left;padding-left:12px;";
                taskTd.textContent = t.task;
                row.appendChild(taskTd);

                const tradeTd = document.createElement("td");
                tradeTd.style.cssText = "text-align:left;";
                if (t.trade && DATA.trades[t.trade]) {
                    tradeTd.innerHTML = `<span style="color:${DATA.trades[t.trade].colour}">${t.trade}</span>`;
                } else {
                    tradeTd.textContent = t.trade || "\u2014";
                }
                row.appendChild(tradeTd);

                for (let d = 0; d < dayLabels.length; d++) {
                    const td = document.createElement("td");
                    if (d >= taskDay && d < taskDay + t.days) {
                        td.className = optimised ? "auto-optimised" : "auto-filled";
                        td.textContent = `P${plot}`;
                    }
                    row.appendChild(td);
                }

                tbody.appendChild(row);
                taskDay += t.days;
            });
        });
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

function runAutoGenerate() {
    const btn = document.getElementById("auto-generate-btn");
    const status = document.getElementById("auto-status");
    const grid = document.getElementById("auto-programme-grid");

    btn.disabled = true;
    status.textContent = "Analysing trade availability...";
    status.style.color = "var(--yellow)";

    const steps = [
        { delay: 800, text: "Cross-referencing material delivery dates..." },
        { delay: 1600, text: "Checking inspection slot capacity..." },
        { delay: 2400, text: "Applying historical pace adjustments..." },
        { delay: 3200, text: "Optimising for minimum programme duration..." },
    ];

    steps.forEach(s => {
        setTimeout(() => { status.textContent = s.text; }, s.delay);
    });

    setTimeout(() => {
        grid.innerHTML = "";

        const successNote = document.createElement("div");
        successNote.style.cssText = "padding:12px 14px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:4px;font-size:0.8rem;color:var(--green);margin-bottom:12px;";
        successNote.innerHTML = `<strong>Programme generated.</strong> 9 plots scheduled across 5 weeks. 3 conflicts auto-resolved (Ian Austin double-booked Wed 26/02 \u2014 shifted Plot 25 tack to Thu). Material gates: 1 blocked (Insulation plots 47-49 \u2014 materials not ordered). <strong>Estimated completion: 2 days earlier than manual programme.</strong>`;
        grid.appendChild(successNote);

        renderAutoGrid(grid, true);

        status.textContent = "Programme optimised \u2713";
        status.style.color = "var(--green)";
        btn.disabled = false;
        btn.textContent = "Regenerate";
    }, 4000);
}

// --- TRADE CAPACITY MARKETPLACE ---
function renderCapacityMarketplace() {
    const list = document.getElementById("capacity-list");
    list.innerHTML = "";

    const capacityData = [
        { trade: "AR Joinery", status: "available", slots: "Mon\u2013Wed next week free. 1 crew (2 joiners).", sites: "Currently on Oakfield + Riverside" },
        { trade: "PB Plumbing", status: "busy", slots: "Fully booked until 14/03. Waitlist open.", sites: "Oakfield + Elm Park + Station Road" },
        { trade: "C Owen", status: "available", slots: "Thu\u2013Fri this week, all next week. 1 electrician.", sites: "Oakfield only" },
        { trade: "Ian Austin", status: "partial", slots: "Available from Wed. Currently finishing Plot 25 tack.", sites: "Oakfield only" },
        { trade: "Max Energy", status: "available", slots: "Available immediately. 2 crews.", sites: "Oakfield + Church View" },
        { trade: "Clean", status: "available", slots: "Same-day availability. Flexible.", sites: "All sites" },
    ];

    capacityData.forEach(c => {
        const div = document.createElement("div");
        div.className = "capacity-item";
        const tradeColour = DATA.trades[c.trade] ? DATA.trades[c.trade].colour : "#888";

        div.innerHTML = `
            <div class="capacity-header-row">
                <span class="capacity-trade" style="color:${tradeColour}">${c.trade}</span>
                <span class="capacity-badge ${c.status}">${c.status === "partial" ? "Limited" : c.status === "busy" ? "Fully booked" : "Available"}</span>
            </div>
            <div class="capacity-slots">${c.slots}</div>
            <div class="capacity-slots" style="color:var(--text-dim);margin-top:2px;">${c.sites}</div>
        `;
        list.appendChild(div);
    });

    const note = document.createElement("div");
    note.style.cssText = "margin-top:10px;padding:10px 14px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:4px;font-size:0.78rem;color:var(--text-muted);";
    note.innerHTML = `<strong style="color:var(--purple)">Network effect:</strong> Every trade using the system shares their capacity across all sites. Site managers see real-time availability instead of playing phone tag. Trades get predictable forward visibility of work. The more sites on the platform, the more valuable it becomes for everyone.`;
    list.appendChild(note);
}

// --- DELAY ATTRIBUTION ---
function renderDelayAttribution() {
    const chart = document.getElementById("delay-chart");
    chart.innerHTML = "";

    const maxDays = Math.max(...DATA.delayReasons.map(d => d.daysCost));
    const totalDays = DATA.delayReasons.reduce((sum, d) => sum + d.daysCost, 0);
    const totalIncidents = DATA.delayReasons.reduce((sum, d) => sum + d.count, 0);

    const summary = document.createElement("div");
    summary.style.cssText = "display:flex;gap:2rem;margin-bottom:12px;";
    summary.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--red);">${totalDays}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Total days lost</div>
        </div>
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--orange);">${totalIncidents}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Delay incidents</div>
        </div>
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--yellow);">${(totalDays / totalIncidents).toFixed(1)}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Avg days per incident</div>
        </div>
    `;
    chart.appendChild(summary);

    const colours = ["#ef4444", "#f97316", "#eab308", "#a855f7", "#3b82f6", "#6b7280"];

    DATA.delayReasons.forEach((d, i) => {
        const row = document.createElement("div");
        row.className = "delay-row";

        row.innerHTML = `
            <div class="delay-reason">${d.reason}</div>
            <div class="delay-bar-wrap">
                <div class="delay-bar" style="width:${(d.daysCost / maxDays) * 100}%;background:${colours[i]}">
                    ${d.daysCost} days
                </div>
            </div>
            <div class="delay-count">${d.count}x${d.topTrade ? " \u00b7 " + d.topTrade : ""}</div>
        `;
        chart.appendChild(row);
    });

    const insight = document.createElement("div");
    insight.style.cssText = "margin-top:10px;padding:10px 14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:4px;font-size:0.78rem;color:var(--text-muted);";
    insight.innerHTML = `<strong style="color:var(--red)">Insight:</strong> Trade no-shows account for 32% of all delay days. PB Plumbing is the most frequent offender. This data is invisible in a spreadsheet but becomes actionable at scale: renegotiate terms, add buffer to PB Plumbing slots, or source a backup plumber.`;
    chart.appendChild(insight);
}

// --- MULTI-SITE PORTFOLIO ---
function renderPortfolio() {
    const viz = document.getElementById("portfolio-viz");
    viz.innerHTML = "";

    const totalPlots = DATA.sites.reduce((s, site) => s + site.plots, 0);
    const avgCompletion = Math.round(DATA.sites.reduce((s, site) => s + site.completion, 0) / DATA.sites.length);
    const atRisk = DATA.sites.filter(s => !s.onTrack).length;

    const summary = document.createElement("div");
    summary.style.cssText = "display:flex;gap:2rem;margin-bottom:12px;";
    summary.innerHTML = `
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--accent);">${DATA.sites.length}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Active sites</div>
        </div>
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--text);">${totalPlots}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Total plots</div>
        </div>
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--green);">${avgCompletion}%</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Avg completion</div>
        </div>
        <div style="text-align:center;">
            <div style="font-size:1.8rem;font-weight:700;color:var(--red);">${atRisk}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);">Sites at risk</div>
        </div>
    `;
    viz.appendChild(summary);

    DATA.sites.forEach(site => {
        const div = document.createElement("div");
        div.className = `portfolio-site risk-${site.risk}`;

        div.innerHTML = `
            <div class="portfolio-top">
                <span class="portfolio-name">${site.name}</span>
                <span class="portfolio-risk ${site.risk}">${site.risk} risk</span>
            </div>
            <div class="portfolio-bar-bg">
                <div class="portfolio-bar ${site.risk}" style="width:${site.completion}%"></div>
            </div>
            <div class="portfolio-meta">
                <span>${site.plots} plots</span>
                <span>${site.completion}% complete</span>
                <span>${site.onTrack ? "On track" : "Behind schedule"}</span>
            </div>
        `;
        viz.appendChild(div);
    });
}
