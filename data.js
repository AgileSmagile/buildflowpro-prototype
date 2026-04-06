// Ryan's actual data extracted from spreadsheet, structured for all three tiers
const DATA = {
    siteName: "Oakfield Phase 2",
    phases: ["1st Fix", "Plaster Fix", "2nd Fix", "Final Fix"],

    // Weeks from the spreadsheet (week commencing dates)
    weeks: [
        { wc: "2025-02-09", days: ["09/02","10/02","11/02","12/02","13/02"] },
        { wc: "2025-02-16", days: ["16/02","17/02","18/02","19/02","20/02"] },
        { wc: "2025-02-23", days: ["23/02","24/02","25/02","26/02","27/02"] },
        { wc: "2025-03-02", days: ["02/03","03/03","04/03","05/03","06/03"] },
        { wc: "2025-03-09", days: ["09/03","10/03","11/03","12/03","13/03"] },
    ],

    trades: {
        "AR Joinery":   { colour: "#4CAF50", contact: "Andy R", phone: "07700 900123" },
        "Max Energy":   { colour: "#9C27B0", contact: "Max",    phone: "07700 900234" },
        "PB Plumbing":  { colour: "#2196F3", contact: "Paul B", phone: "07700 900345" },
        "C Owen":       { colour: "#FF9800", contact: "Chris O",phone: "07700 900456" },
        "Ian Austin":   { colour: "#795548", contact: "Ian A",  phone: "07700 900567" },
        "Clean":        { colour: "#607D8B", contact: "TBC",    phone: "" },
    },

    plots: [23, 24, 25, 26, 27, 28, 29, 30, 31],

    // Build sequence template (defines the dependency chain)
    buildSequence: [
        { phase: "1st Fix", tasks: [
            { id: "stairs",          task: "Joiner stairs",           trade: "AR Joinery",   days: 1 },
            { id: "windows",         task: "Joiner windows & doors",  trade: "AR Joinery",   days: 1 },
            { id: "insulation",      task: "Insulation walls",        trade: "Max Energy",   days: 1 },
            { id: "joiner-1st",      task: "Joiner 1st fix finish",   trade: "AR Joinery",   days: 1 },
            { id: "plumber-1st",     task: "Plumber 1st fix",         trade: "PB Plumbing",  days: 2 },
            { id: "service-battens", task: "Joiner service battens",  trade: "AR Joinery",   days: 1 },
            { id: "elec-1st",        task: "Electrician 1st fix",     trade: "C Owen",       days: 2 },
            { id: "inspect-1st",     task: "1st Fix Inspection",      trade: null,           days: 1, gate: true },
        ]},
        { phase: "Plaster Fix", tasks: [
            { id: "tack",            task: "Tack",                    trade: "Ian Austin",   days: 3 },
            { id: "plaster",         task: "Plaster",                 trade: "Ian Austin",   days: 3 },
            { id: "clean-plaster",   task: "Clean out",               trade: "Clean",        days: 1 },
            { id: "insulation-loft", task: "Insulation lofts",        trade: "Max Energy",   days: 1 },
        ]},
        { phase: "2nd Fix", tasks: [
            { id: "mist-coat",       task: "Mist coat",               trade: null,           days: 1 },
            { id: "joiner-2nd",      task: "Joiner 2nd fix",          trade: "AR Joinery",   days: 1 },
            { id: "kitchen",         task: "Kitchen",                 trade: null,           days: 1 },
            { id: "tiler",           task: "Tiler",                   trade: null,           days: 1 },
            { id: "flooring-cyl",    task: "Flooring for cylinder",   trade: null,           days: 1 },
            { id: "plumber-2nd",     task: "Plumber 2nd fix",         trade: "PB Plumbing",  days: 2 },
            { id: "elec-2nd",        task: "Electrician 2nd fix",     trade: "C Owen",       days: 1 },
            { id: "elec-test",       task: "Elec test",               trade: "C Owen",       days: 1 },
            { id: "plumber-final",   task: "Plumber final",           trade: "PB Plumbing",  days: 1 },
            { id: "patcher",         task: "Patcher",                 trade: "Ian Austin",   days: 1 },
            { id: "clean-2nd",       task: "Clean out",               trade: "Clean",        days: 1 },
        ]},
        { phase: "Final Fix", tasks: [
            { id: "paint",           task: "Paint",                   trade: null,           days: 2 },
            { id: "flooring",        task: "Flooring",                trade: null,           days: 1 },
            { id: "joiner-final",    task: "Joiner final",            trade: "AR Joinery",   days: 1 },
            { id: "build-clean",     task: "Build clean",             trade: "Clean",        days: 1 },
            { id: "mastic",          task: "Mastic",                  trade: null,           days: 1 },
            { id: "final-clean",     task: "Final clean",             trade: "Clean",        days: 1 },
            { id: "cml",             task: "CML",                     trade: null,           days: 1, gate: true },
        ]},
    ],

    // Actual schedule data from spreadsheet (for Good tier grid)
    // Each entry: { task, trade, plot, dayIndex (0-24 for 5 weeks), status }
    schedule: [
        // 1st Fix — Joiner stairs
        { task:"Joiner stairs", trade:"AR Joinery", plots:"27/28", day:2, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"23/24", day:5, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"29-31RP", day:6, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"53-55RP", day:10, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"56-57RP", day:11, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"29/30", day:14, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"31", day:18, status:"completed" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"1", day:21, status:"scheduled" },
        { task:"Joiner stairs", trade:"AR Joinery", plots:"2", day:24, status:"scheduled" },

        // 1st Fix — Joiner windows & doors
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"27", day:1, status:"completed" },
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"24", day:10, status:"completed" },
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"23", day:12, status:"completed" },
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"29", day:14, status:"completed" },
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"30", day:16, status:"completed" },
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"31", day:19, status:"completed" },
        { task:"Joiner windows & doors", trade:"AR Joinery", plots:"1", day:22, status:"scheduled" },

        // 1st Fix — Insulation walls
        { task:"Insulation walls", trade:"Max Energy", plots:"25/26", day:5, status:"completed" },
        { task:"Insulation walls", trade:"Max Energy", plots:"29/30", day:15, status:"scheduled" },
        { task:"Insulation walls", trade:"Max Energy", plots:"31", day:18, status:"scheduled" },
        { task:"Insulation walls", trade:"Max Energy", plots:"47-49", day:20, status:"scheduled" },

        // 1st Fix — Joiner 1st fix finish
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"26", day:0, status:"missed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"25", day:1, status:"missed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"27", day:3, status:"missed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"27", day:5, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"28", day:6, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"25", day:7, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"26", day:8, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"24", day:11, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"23", day:13, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"29", day:15, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"30", day:17, status:"completed" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"31", day:20, status:"scheduled" },
        { task:"Joiner 1st fix finish", trade:"AR Joinery", plots:"1", day:23, status:"scheduled" },

        // 1st Fix — Plumber 1st fix
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"25", day:0, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"27", day:2, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"28", day:4, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"26", day:6, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"24", day:8, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"23", day:10, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"43", day:12, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"44", day:14, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"29", day:16, status:"completed" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"30", day:18, status:"scheduled" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"31", day:20, status:"scheduled" },
        { task:"Plumber 1st fix", trade:"PB Plumbing", plots:"1", day:22, status:"scheduled" },

        // 1st Fix — Joiner service battens
        { task:"Joiner service battens", trade:"AR Joinery", plots:"27", day:3, status:"missed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"42", day:4, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"27", day:5, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"28", day:6, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"25", day:7, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"26", day:8, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"24", day:11, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"23", day:13, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"29-30", day:18, status:"completed" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"31", day:20, status:"scheduled" },
        { task:"Joiner service battens", trade:"AR Joinery", plots:"1", day:23, status:"scheduled" },

        // 1st Fix — Electrician 1st fix
        { task:"Electrician 1st fix", trade:"C Owen", plots:"27", day:6, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"28", day:8, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"26", day:10, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"25", day:12, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"24", day:14, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"23", day:16, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"29", day:19, status:"completed" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"31", day:21, status:"scheduled" },
        { task:"Electrician 1st fix", trade:"C Owen", plots:"1", day:23, status:"scheduled" },

        // 1st Fix Inspections
        { task:"1st Fix Inspection", trade:null, plots:"27", day:8, status:"completed" },
        { task:"1st Fix Inspection", trade:null, plots:"28", day:10, status:"completed" },
        { task:"1st Fix Inspection", trade:null, plots:"26", day:12, status:"completed" },
        { task:"1st Fix Inspection", trade:null, plots:"25", day:14, status:"completed" },
        { task:"1st Fix Inspection", trade:null, plots:"24", day:16, status:"completed" },
        { task:"1st Fix Inspection", trade:null, plots:"23", day:18, status:"completed" },
        { task:"1st Fix Inspection", trade:null, plots:"29", day:21, status:"scheduled" },
        { task:"1st Fix Inspection", trade:null, plots:"31", day:23, status:"scheduled" },

        // Plaster Fix — Tack (3 plots per assignment block)
        { task:"Tack", trade:"Ian Austin", plots:"27", day:9, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"27", day:10, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"27", day:11, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"28", day:12, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"28", day:13, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"28", day:14, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"26", day:15, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"26", day:16, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"26", day:17, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"25", day:18, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"25", day:19, status:"completed" },
        { task:"Tack", trade:"Ian Austin", plots:"25", day:20, status:"scheduled" },
        { task:"Tack", trade:"Ian Austin", plots:"24", day:21, status:"scheduled" },
        { task:"Tack", trade:"Ian Austin", plots:"24", day:22, status:"scheduled" },
        { task:"Tack", trade:"Ian Austin", plots:"24", day:23, status:"scheduled" },
        { task:"Tack", trade:"Ian Austin", plots:"23", day:24, status:"scheduled" },

        // Plaster Fix — Plaster
        { task:"Plaster", trade:"Ian Austin", plots:"27", day:12, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"27", day:13, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"27", day:14, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"28", day:15, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"28", day:16, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"28", day:17, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"26", day:18, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"26", day:19, status:"completed" },
        { task:"Plaster", trade:"Ian Austin", plots:"26", day:20, status:"scheduled" },
        { task:"Plaster", trade:"Ian Austin", plots:"25", day:21, status:"scheduled" },
        { task:"Plaster", trade:"Ian Austin", plots:"25", day:22, status:"scheduled" },
        { task:"Plaster", trade:"Ian Austin", plots:"25", day:23, status:"scheduled" },
        { task:"Plaster", trade:"Ian Austin", plots:"24", day:24, status:"scheduled" },

        // Plaster Fix — Clean out
        { task:"Clean out (plaster)", trade:"Clean", plots:"27", day:15, status:"completed" },
        { task:"Clean out (plaster)", trade:"Clean", plots:"28", day:18, status:"completed" },
        { task:"Clean out (plaster)", trade:"Clean", plots:"26", day:21, status:"scheduled" },
        { task:"Clean out (plaster)", trade:"Clean", plots:"25", day:24, status:"scheduled" },

        // 2nd Fix — Mist coat
        { task:"Mist coat", trade:null, plots:"27", day:16, status:"completed" },
        { task:"Mist coat", trade:null, plots:"28", day:19, status:"completed" },
        { task:"Mist coat", trade:null, plots:"26", day:22, status:"scheduled" },

        // 2nd Fix — Joiner 2nd fix
        { task:"Joiner 2nd fix", trade:"AR Joinery", plots:"27", day:17, status:"completed" },
        { task:"Joiner 2nd fix", trade:"AR Joinery", plots:"28", day:20, status:"scheduled" },
        { task:"Joiner 2nd fix", trade:"AR Joinery", plots:"26", day:23, status:"scheduled" },

        // 2nd Fix — Kitchen
        { task:"Kitchen", trade:null, plots:"27", day:18, status:"completed" },
        { task:"Kitchen", trade:null, plots:"28", day:21, status:"scheduled" },
        { task:"Kitchen", trade:null, plots:"26", day:24, status:"scheduled" },

        // 2nd Fix — Tiler
        { task:"Tiler", trade:null, plots:"27", day:18, status:"completed" },
        { task:"Tiler", trade:null, plots:"28", day:21, status:"scheduled" },
        { task:"Tiler", trade:null, plots:"26", day:24, status:"scheduled" },

        // 2nd Fix — Flooring for cylinder
        { task:"Flooring for cylinder", trade:null, plots:"27", day:19, status:"completed" },
        { task:"Flooring for cylinder", trade:null, plots:"28", day:22, status:"scheduled" },

        // 2nd Fix — Plumber 2nd fix
        { task:"Plumber 2nd fix", trade:"PB Plumbing", plots:"27", day:20, status:"scheduled" },
        { task:"Plumber 2nd fix", trade:"PB Plumbing", plots:"27", day:21, status:"scheduled" },
        { task:"Plumber 2nd fix", trade:"PB Plumbing", plots:"28", day:23, status:"scheduled" },
        { task:"Plumber 2nd fix", trade:"PB Plumbing", plots:"28", day:24, status:"scheduled" },

        // 2nd Fix — Electrician 2nd fix
        { task:"Electrician 2nd fix", trade:"C Owen", plots:"27", day:22, status:"scheduled" },

        // 2nd Fix — Elec test
        { task:"Elec test", trade:"C Owen", plots:"27", day:22, status:"scheduled" },

        // 2nd Fix — Plumber final
        { task:"Plumber final", trade:"PB Plumbing", plots:"27", day:23, status:"scheduled" },

        // 2nd Fix — Patcher
        { task:"Patcher", trade:"Ian Austin", plots:"27", day:24, status:"scheduled" },

        // 2nd Fix — Clean out
        { task:"Clean out (2nd fix)", trade:"Clean", plots:"27", day:24, status:"scheduled" },
    ],

    // Material orders from spreadsheet notes
    materialOrders: [
        { trade:"AR Joinery", item:"2nd fix materials (plots 23-30)", status:"ordered", note:"wc16/2" },
        { trade:null, item:"Tiler materials (plots 23-30)", status:"ordered", note:"wc16/2" },
        { trade:null, item:"Flooring for cylinder (plots 23-30)", status:"ordered", note:"wc16/2" },
    ],

    // For "Even Better" tier — simulated multi-site data
    sites: [
        { name:"Oakfield Phase 2", plots:9, completion:42, onTrack:true, risk:"low" },
        { name:"Riverside Gardens", plots:14, completion:68, onTrack:true, risk:"low" },
        { name:"Elm Park", plots:22, completion:15, onTrack:false, risk:"high" },
        { name:"Station Road", plots:6, completion:91, onTrack:true, risk:"low" },
        { name:"Church View", plots:18, completion:33, onTrack:false, risk:"medium" },
        { name:"Meadow Lane", plots:10, completion:55, onTrack:true, risk:"low" },
    ],

    // Simulated trade reliability data (for probabilistic forecasting)
    tradeReliability: {
        "AR Joinery":  { onTime: 0.78, avgSlipDays: 1.2, completedJobs: 47 },
        "Max Energy":  { onTime: 0.85, avgSlipDays: 0.8, completedJobs: 23 },
        "PB Plumbing": { onTime: 0.72, avgSlipDays: 1.5, completedJobs: 38 },
        "C Owen":      { onTime: 0.90, avgSlipDays: 0.5, completedJobs: 31 },
        "Ian Austin":  { onTime: 0.82, avgSlipDays: 1.0, completedJobs: 29 },
        "Clean":       { onTime: 0.95, avgSlipDays: 0.3, completedJobs: 52 },
    },

    // Simulated delay attribution data
    delayReasons: [
        { reason:"Trade no-show", count:12, daysCost:18, topTrade:"PB Plumbing" },
        { reason:"Materials late", count:8, daysCost:14, topTrade:null },
        { reason:"Weather", count:5, daysCost:7, topTrade:null },
        { reason:"Rework needed", count:4, daysCost:9, topTrade:"AR Joinery" },
        { reason:"Inspection fail", count:3, daysCost:6, topTrade:null },
        { reason:"Access issue", count:2, daysCost:3, topTrade:null },
    ],
};
