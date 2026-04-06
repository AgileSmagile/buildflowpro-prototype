// === EVEN BETTER TIER: Full OS view with plan vs reality ===

const TODAY_INDEX = 3; // Wed 12 Feb = day index 3 (0-indexed)

let ebState = { generated: false };

function initEvenBetterTier() {
    renderAutoProgrammePanel();
    renderCapacityMarketplace();
    renderDelayAttribution();
    renderPortfolio();
    renderDeviceMockups();
    renderSupplierIntel();
    renderOtherApps();

    document.getElementById("auto-generate-btn").addEventListener("click", runAutoGenerate);
    document.getElementById("eb-reset-btn").addEventListener("click", resetEvenBetter);
}

function resetEvenBetter() {
    ebState.generated = false;
    document.getElementById("auto-generate-btn").textContent = "Generate Optimal Programme";
    document.getElementById("auto-generate-btn").disabled = false;
    document.getElementById("auto-status").textContent = "";
    renderAutoProgrammePanel();
}

// --- LIVE PROGRAMME GANTT ---
function renderAutoProgrammePanel() {
    const grid = document.getElementById("auto-programme-grid");
    grid.innerHTML = "";
    renderAutoGrid(grid, ebState.generated);
}

function renderAutoGrid(container, optimised) {
    const table = document.createElement("table");
    const dayLabels = [];
    DATA.weeks.forEach(w => w.days.forEach(d => dayLabels.push(d)));
    const totalDays = dayLabels.length;

    const thead = document.createElement("thead");
    const hRow = document.createElement("tr");
    hRow.innerHTML = "<th class='gantt-task-col'>Task</th><th class='gantt-trade-col'>Trade</th>";
    dayLabels.forEach((d, i) => {
        const th = document.createElement("th");
        th.className = "gantt-day-col";
        th.textContent = d;
        if (i % 5 === 0) th.style.borderLeft = "2px solid var(--border)";
        if (i === TODAY_INDEX) th.classList.add("today-header");
        hRow.appendChild(th);
    });
    thead.appendChild(hRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const plotsToShow = [27, 28, 26];

    // Simulated reality data: some tasks slipped or completed differently
    const reality = {
        27: {
            "Joiner stairs": { actualStart: 2, actualDays: 1, status: "complete" },
            "Joiner windows & doors": { actualStart: 1, actualDays: 1, status: "complete" },
            "Insulation walls": { actualStart: null, actualDays: 0, status: "future" },
            "Joiner 1st fix finish": { actualStart: 0, actualDays: 2, status: "complete", slipped: true, note: "Took 2 days instead of 1. Joiner had to return for snagging." },
            "Plumber 1st fix": { actualStart: 2, actualDays: 2, status: "complete" },
            "Joiner service battens": { actualStart: null, actualDays: 0, status: "future" },
        },
        28: {
            "Joiner stairs": { actualStart: 5, actualDays: 1, status: "future" },
        },
        26: {}
    };

    plotsToShow.forEach(plot => {
        const plotRow = document.createElement("tr");
        const plotTd = document.createElement("td");
        plotTd.colSpan = totalDays + 2;
        plotTd.className = "gantt-phase-header";
        plotTd.textContent = `Plot ${plot}`;
        plotRow.appendChild(plotTd);
        tbody.appendChild(plotRow);

        const plotOffset = plotsToShow.indexOf(plot) * 3;
        let taskDay = plotOffset;
        const plotReality = reality[plot] || {};

        DATA.buildSequence.forEach(phase => {
            phase.tasks.forEach(t => {
                const row = document.createElement("tr");
                const taskTd = document.createElement("td");
                taskTd.className = "gantt-task-col";
                taskTd.textContent = t.task;
                row.appendChild(taskTd);

                const tradeTd = document.createElement("td");
                tradeTd.className = "gantt-trade-col";
                if (t.trade && DATA.trades[t.trade]) {
                    tradeTd.innerHTML = `<span style="color:${DATA.trades[t.trade].colour}">${t.trade}</span>`;
                } else {
                    tradeTd.textContent = t.trade || "\u2014";
                }
                row.appendChild(tradeTd);

                const actual = plotReality[t.task];

                for (let d = 0; d < totalDays; d++) {
                    const td = document.createElement("td");
                    if (d % 5 === 0) td.style.borderLeft = "2px solid var(--border)";

                    // Today line
                    if (d === TODAY_INDEX) td.classList.add("today-col");

                    const isPlanned = d >= taskDay && d < taskDay + t.days;

                    if (actual) {
                        // We have reality data
                        const isActual = actual.actualStart !== null && d >= actual.actualStart && d < actual.actualStart + actual.actualDays;

                        if (actual.status === "complete" && isActual) {
                            td.className += " eb-bar-complete";
                            if (d === actual.actualStart) td.textContent = `P${plot}`;
                            if (actual.slipped) {
                                td.classList.add("eb-bar-slipped");
                                td.title = actual.note || "Slipped from plan";
                                td.style.cursor = "pointer";
                                td.addEventListener("click", (e) => showTooltip(e, actual.note || "Slipped from original plan"));
                            }
                        } else if (isPlanned && !isActual && actual.status === "complete") {
                            // Show planned position as ghost if it moved
                            if (actual.slipped && d >= taskDay && d < taskDay + t.days && !(d >= actual.actualStart && d < actual.actualStart + actual.actualDays)) {
                                td.className += " eb-bar-ghost";
                            }
                        } else if (isPlanned && actual.status === "future") {
                            td.className += optimised ? " eb-bar-optimised" : " eb-bar-planned";
                            if (d === taskDay) td.textContent = `P${plot}`;
                        }
                    } else if (isPlanned) {
                        // No reality data — show plan
                        if (d <= TODAY_INDEX) {
                            // Past but no actual data = potential concern
                            td.className += " eb-bar-planned-past";
                            if (d === taskDay) td.textContent = `P${plot}`;
                        } else {
                            td.className += optimised ? " eb-bar-optimised" : " eb-bar-planned";
                            if (d === taskDay) td.textContent = `P${plot}`;
                        }
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

function showTooltip(e, text) {
    const tip = document.getElementById("eb-tooltip");
    tip.textContent = text;
    tip.style.display = "block";
    tip.style.left = e.pageX + 10 + "px";
    tip.style.top = e.pageY - 20 + "px";
    setTimeout(() => { tip.style.display = "none"; }, 3000);
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

    steps.forEach(s => { setTimeout(() => { status.textContent = s.text; }, s.delay); });

    setTimeout(() => {
        grid.innerHTML = "";

        const successNote = document.createElement("div");
        successNote.style.cssText = "padding:12px 14px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:4px;font-size:0.8rem;color:var(--green);margin-bottom:12px;";
        successNote.innerHTML = `<strong>Programme optimised.</strong> 3 conflicts resolved (Ian Austin double-booked Wed 26/02 \u2014 shifted Plot 25 tack to Thu). AR Joinery 1st fix finish now has 0.5-day buffer based on historic slip rate. <strong>Estimated completion: 2 days earlier than manual programme.</strong>`;
        grid.appendChild(successNote);

        ebState.generated = true;
        renderAutoGrid(grid, true);

        status.textContent = "Optimised \u2713";
        status.style.color = "var(--green)";
        btn.disabled = false;
        btn.textContent = "Regenerate";
    }, 4000);
}

// --- CAPACITY MARKETPLACE ---
function renderCapacityMarketplace() {
    const list = document.getElementById("capacity-list");
    list.innerHTML = "";

    const data = [
        { trade:"AR Joinery", status:"available", slots:"Mon\u2013Wed next week free. 1 crew (2 joiners).", sites:"Oakfield + Riverside" },
        { trade:"PB Plumbing", status:"busy", slots:"Fully booked until 14/03. Waitlist open.", sites:"Oakfield + Elm Park + Station Rd" },
        { trade:"C Owen", status:"available", slots:"Thu\u2013Fri this week, all next week.", sites:"Oakfield only" },
        { trade:"Ian Austin", status:"partial", slots:"Available from Wed. Finishing Plot 25 tack.", sites:"Oakfield only" },
        { trade:"Max Energy", status:"available", slots:"Immediately. 2 crews.", sites:"Oakfield + Church View" },
        { trade:"Clean", status:"available", slots:"Same-day. Flexible.", sites:"All sites" },
    ];

    data.forEach(c => {
        const div = document.createElement("div");
        div.className = "capacity-item";
        const colour = DATA.trades[c.trade] ? DATA.trades[c.trade].colour : "#888";
        div.innerHTML = `
            <div class="capacity-header-row">
                <span class="capacity-trade" style="color:${colour}">${c.trade}</span>
                <span class="capacity-badge ${c.status}">${c.status === "partial" ? "Limited" : c.status === "busy" ? "Booked" : "Available"}</span>
            </div>
            <div class="capacity-slots">${c.slots}</div>
            <div class="capacity-slots" style="color:var(--text-dim);margin-top:2px;">${c.sites}</div>
        `;
        list.appendChild(div);
    });

    const note = document.createElement("div");
    note.style.cssText = "margin-top:8px;padding:8px 12px;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:4px;font-size:0.75rem;color:var(--text-muted);";
    note.innerHTML = `<strong style="color:var(--purple)">Network effect:</strong> Every trade on the system shares capacity across sites. More sites = more valuable for everyone.`;
    list.appendChild(note);
}

// --- DELAY ATTRIBUTION ---
function renderDelayAttribution() {
    const chart = document.getElementById("delay-chart");
    chart.innerHTML = "";

    const maxDays = Math.max(...DATA.delayReasons.map(d => d.daysCost));
    const totalDays = DATA.delayReasons.reduce((s, d) => s + d.daysCost, 0);
    const totalInc = DATA.delayReasons.reduce((s, d) => s + d.count, 0);

    const summary = document.createElement("div");
    summary.style.cssText = "display:flex;gap:1.5rem;margin-bottom:10px;";
    summary.innerHTML = `
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--red);">${totalDays}</div><div style="font-size:0.68rem;color:var(--text-dim);">Days lost</div></div>
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--orange);">${totalInc}</div><div style="font-size:0.68rem;color:var(--text-dim);">Incidents</div></div>
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--yellow);">${(totalDays / totalInc).toFixed(1)}</div><div style="font-size:0.68rem;color:var(--text-dim);">Avg days/inc</div></div>
    `;
    chart.appendChild(summary);

    const colours = ["#ef4444","#f97316","#eab308","#a855f7","#3b82f6","#6b7280"];
    DATA.delayReasons.forEach((d, i) => {
        const row = document.createElement("div");
        row.className = "delay-row";
        row.style.cursor = "pointer";
        row.title = d.topTrade ? `Top offender: ${d.topTrade}` : "No single trade dominates";
        row.innerHTML = `
            <div class="delay-reason">${d.reason}</div>
            <div class="delay-bar-wrap">
                <div class="delay-bar" style="width:${(d.daysCost / maxDays) * 100}%;background:${colours[i]}">${d.daysCost}d</div>
            </div>
            <div class="delay-count">${d.count}x</div>
        `;
        row.addEventListener("click", (e) => {
            showTooltip(e, `${d.reason}: ${d.count} incidents, ${d.daysCost} days lost. ${d.topTrade ? "Worst: " + d.topTrade : "Spread across trades."}`);
        });
        chart.appendChild(row);
    });

    const insight = document.createElement("div");
    insight.style.cssText = "margin-top:8px;padding:8px 12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:4px;font-size:0.75rem;color:var(--text-muted);";
    insight.innerHTML = `<strong style="color:var(--red)">Action needed:</strong> Trade no-shows = 32% of delay days. PB Plumbing most frequent. Recommend: add 1-day buffer to all PB Plumbing slots, source backup plumber.`;
    chart.appendChild(insight);
}

// --- PORTFOLIO ---
function renderPortfolio() {
    const viz = document.getElementById("portfolio-viz");
    viz.innerHTML = "";

    const totalPlots = DATA.sites.reduce((s, site) => s + site.plots, 0);
    const avgComp = Math.round(DATA.sites.reduce((s, site) => s + site.completion, 0) / DATA.sites.length);
    const atRisk = DATA.sites.filter(s => !s.onTrack).length;

    const summary = document.createElement("div");
    summary.style.cssText = "display:flex;gap:1.5rem;margin-bottom:10px;";
    summary.innerHTML = `
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--accent);">${DATA.sites.length}</div><div style="font-size:0.68rem;color:var(--text-dim);">Sites</div></div>
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--text);">${totalPlots}</div><div style="font-size:0.68rem;color:var(--text-dim);">Plots</div></div>
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--green);">${avgComp}%</div><div style="font-size:0.68rem;color:var(--text-dim);">Avg done</div></div>
        <div style="text-align:center;"><div style="font-size:1.5rem;font-weight:700;color:var(--red);">${atRisk}</div><div style="font-size:0.68rem;color:var(--text-dim);">At risk</div></div>
    `;
    viz.appendChild(summary);

    DATA.sites.forEach(site => {
        const div = document.createElement("div");
        div.className = `portfolio-site risk-${site.risk}`;
        div.style.cursor = "pointer";
        div.addEventListener("click", (e) => {
            showTooltip(e, `${site.name}: ${site.plots} plots, ${site.completion}% complete. ${site.onTrack ? "On track." : "Behind schedule \u2014 needs attention."}`);
        });

        div.innerHTML = `
            <div class="portfolio-top">
                <span class="portfolio-name">${site.name}</span>
                <span class="portfolio-risk ${site.risk}">${site.risk}</span>
            </div>
            <div class="portfolio-bar-bg">
                <div class="portfolio-bar ${site.risk}" style="width:${site.completion}%"></div>
            </div>
            <div class="portfolio-meta">
                <span>${site.plots} plots</span>
                <span>${site.completion}%</span>
                <span>${site.onTrack ? "On track" : "Behind"}</span>
            </div>
        `;
        viz.appendChild(div);
    });
}

// --- DEVICE MOCKUPS ---
function renderDeviceMockups() {
    const el = document.getElementById("device-mockups");
    el.innerHTML = `
        <div class="mockup-row">
            <div class="mockup-device mockup-mobile">
                <div class="mockup-frame">
                    <div class="mockup-notch"></div>
                    <div class="mockup-screen">
                        <div class="mockup-header-bar">BuildFlowPro</div>
                        <div class="mockup-content">
                            <div class="mockup-card mockup-alert">
                                <strong>\u{26A0}\u{FE0F} 2 actions needed</strong>
                                <div>Confirm Plot 31 Plumber 1st fix</div>
                                <div>Order insulation Plots 47-49</div>
                            </div>
                            <div class="mockup-card">
                                <strong>Today's tasks</strong>
                                <div class="mockup-task done">
                                    \u2713 Joiner 1st fix P27
                                </div>
                                <div class="mockup-task active">
                                    \u25B6 Plumber 1st fix P27-28
                                </div>
                                <div class="mockup-task upcoming">
                                    \u23F3 Elec 1st fix P27
                                </div>
                            </div>
                            <div class="mockup-card">
                                <strong>Quick note</strong>
                                <div class="mockup-input">Tap to add site note...</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mockup-label">Site Manager (Mobile)</div>
                <div class="mockup-desc">Action queue, today's tasks, quick notes from site. Push notifications for confirmations and changes.</div>
            </div>

            <div class="mockup-device mockup-tablet">
                <div class="mockup-frame mockup-frame-tablet">
                    <div class="mockup-screen">
                        <div class="mockup-header-bar">BuildFlowPro \u2014 AR Joinery</div>
                        <div class="mockup-content">
                            <div class="mockup-card">
                                <strong>Your upcoming work</strong>
                                <div class="mockup-task confirm-slot">
                                    <span>Plot 31 \u2014 1st fix finish \u2014 09/03</span>
                                    <span class="mockup-btn-row">
                                        <span class="mockup-btn green">\u2713</span>
                                        <span class="mockup-btn red">\u2717</span>
                                    </span>
                                </div>
                                <div class="mockup-task confirm-slot">
                                    <span>Plot 1 \u2014 1st fix finish \u2014 12/03</span>
                                    <span class="mockup-btn-row">
                                        <span class="mockup-btn green">\u2713</span>
                                        <span class="mockup-btn red">\u2717</span>
                                    </span>
                                </div>
                                <div class="mockup-task done">
                                    \u2713 Plot 28 \u2014 2nd fix \u2014 09/03 (confirmed)
                                </div>
                            </div>
                            <div class="mockup-card">
                                <strong>Your week at a glance</strong>
                                <div style="font-size:0.7rem;color:var(--text-dim);">Mon: Oakfield P31 | Tue: Oakfield P31 | Wed: Riverside P4 | Thu-Fri: Available</div>
                            </div>
                            <div class="mockup-card">
                                <strong>Signal capacity</strong>
                                <div class="mockup-input">Thu-Fri available, 1 crew...</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mockup-label">Trade View (Tablet)</div>
                <div class="mockup-desc">Trades see only their work. Confirm/reject slots, signal spare capacity, view their week across all sites.</div>
            </div>

            <div class="mockup-device mockup-mobile">
                <div class="mockup-frame">
                    <div class="mockup-notch"></div>
                    <div class="mockup-screen">
                        <div class="mockup-header-bar">BuildFlowPro PM</div>
                        <div class="mockup-content">
                            <div class="mockup-card mockup-alert">
                                <strong>\u{1F6A8} Elm Park behind schedule</strong>
                                <div>3 trades overdue this week</div>
                            </div>
                            <div class="mockup-card">
                                <strong>Portfolio snapshot</strong>
                                <div class="mockup-task done">Riverside 68% \u2713</div>
                                <div class="mockup-task done">Station Rd 91% \u2713</div>
                                <div class="mockup-task active">Oakfield 42%</div>
                                <div class="mockup-task upcoming">Elm Park 15% \u{26A0}\u{FE0F}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mockup-label">Contracts Manager (Mobile)</div>
                <div class="mockup-desc">Portfolio view with alerts. No chasing site managers for updates; the data flows up automatically.</div>
            </div>
        </div>
    `;
}

// --- SUPPLIER INTELLIGENCE ---
function renderSupplierIntel() {
    const el = document.getElementById("supplier-intel");
    el.innerHTML = "";

    const intel = [
        {
            trade: "PB Plumbing", score: 62, trend: "down",
            stats: "72% on-time \u00b7 1.5d avg slip \u00b7 38 jobs",
            notes: [
                { date:"11/02", author:"Ryan G", text:"Paul didn't show for Plot 25. Said he was on another job. 3rd time this month." },
                { date:"06/02", author:"System", text:"Auto-flagged: PB Plumbing has rejected or missed 4 of last 10 commitments." },
                { date:"01/02", author:"Ryan G", text:"Mark (lead plumber) is solid when he's here. Problem is Paul overcommitting." },
            ]
        },
        {
            trade: "AR Joinery", score: 78, trend: "stable",
            stats: "78% on-time \u00b7 1.2d avg slip \u00b7 47 jobs",
            notes: [
                { date:"10/02", author:"Ryan G", text:"Andy's lads are reliable. Sometimes needs extra half day on 1st fix finish if the plot's a complex layout." },
                { date:"03/02", author:"System", text:"AR Joinery 1st fix finish averages 1.3 days vs 1 day planned. Recommend planning 1.5 days." },
            ]
        },
        {
            trade: "C Owen", score: 90, trend: "up",
            stats: "90% on-time \u00b7 0.5d avg slip \u00b7 31 jobs",
            notes: [
                { date:"09/02", author:"Ryan G", text:"Chris is a machine. Only risk is he's sole trader \u2014 no backup if he's off sick." },
            ]
        },
    ];

    intel.forEach(t => {
        const colour = DATA.trades[t.trade] ? DATA.trades[t.trade].colour : "#888";
        const scoreColour = t.score >= 80 ? "var(--green)" : t.score >= 65 ? "var(--yellow)" : "var(--red)";
        const trendIcon = t.trend === "up" ? "\u2191" : t.trend === "down" ? "\u2193" : "\u2192";

        const div = document.createElement("div");
        div.className = "intel-card";
        div.innerHTML = `
            <div class="intel-header">
                <span class="intel-trade" style="color:${colour}">${t.trade}</span>
                <span class="intel-score" style="color:${scoreColour}">${t.score}/100 ${trendIcon}</span>
            </div>
            <div class="intel-stats">${t.stats}</div>
            <div class="intel-notes">
                ${t.notes.map(n => `
                    <div class="intel-note">
                        <span class="intel-note-meta">${n.date} \u00b7 ${n.author}</span>
                        <span class="intel-note-text">${n.text}</span>
                    </div>
                `).join("")}
            </div>
        `;
        el.appendChild(div);
    });
}

// --- ADDITIONAL APPLICATIONS ---
function renderOtherApps() {
    const el = document.getElementById("other-apps");
    el.innerHTML = "";

    const apps = [
        { icon:"\u{1F4F8}", name:"Progress Photos", desc:"Timestamped, geo-tagged photos auto-linked to plot and phase. Visual evidence of completion for sign-off and disputes." },
        { icon:"\u{1F6E1}\u{FE0F}", name:"H&S Compliance", desc:"Method statements and RAMS linked to each trade booking. Can't confirm a slot without current documentation on file." },
        { icon:"\u{1F4CB}", name:"Snagging / Defects", desc:"Defects logged against plot and trade. Ties into reliability scoring. Trades see their defect rate alongside on-time rate." },
        { icon:"\u{1F3E0}", name:"Sales / Buyer Updates", desc:"Sales teams see forecasted completion dates per plot. Buyers get automated updates. No more 'when's my house ready?' calls to site." },
        { icon:"\u{1F4B7}", name:"Cost Tracking", desc:"Delay days converted to cost impact. 'This 2-day slip on plaster cost \u00a31,200 in programme delay.' Makes the business case for better trades." },
        { icon:"\u{1F4D1}", name:"Handover Packs", desc:"Auto-generated handover documentation from completion sign-offs, photos, test certificates, and warranty info. One click, not a week of admin." },
        { icon:"\u{1F527}", name:"Warranty Tracking", desc:"Post-completion defect reporting linked to original trade and materials. 'This boiler issue maps to PB Plumbing, installed 09/03, warranty ref X.'" },
        { icon:"\u{1F4CA}", name:"BI / Reporting", desc:"Aggregated data across sites: which trades are worth the premium, which materials cause rework, where is the programme model wrong. Strategic insight from operational data." },
    ];

    apps.forEach(a => {
        const div = document.createElement("div");
        div.className = "other-app-card";
        div.innerHTML = `
            <div class="app-icon">${a.icon}</div>
            <div class="app-info">
                <div class="app-name">${a.name}</div>
                <div class="app-desc">${a.desc}</div>
            </div>
        `;
        el.appendChild(div);
    });
}
