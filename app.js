// Executive Data Visualization Dashboard Logic - Pure Bar Charts for All Individual Filter Selections

let rawData = [];
let filteredData = [];
let charts = {};

const prioColorMap = {
  'High': '#ef4444',
  'Medium': '#f59e0b',
  'Low': '#10b981'
};

const serviceColorMap = {
  'Broadband': '#2563eb',
  'Mobile': '#8b5cf6',
  'TV': '#06b6d4',
  'Landline': '#10b981'
};

const issueColorMap = {
  'Slow Internet': '#2563eb',
  'Installation Delay': '#10b981',
  'No Signal': '#ec4899',
  'Billing Error': '#8b5cf6',
  'Dropped Calls': '#f97316',
  'Service Outage': '#06b6d4'
};

const statusColorMap = {
  'Resolved': '#10b981',
  'In Progress': '#f59e0b',
  'Escalated': '#f97316',
  'SLA Breached': '#ef4444'
};

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }
  Chart.defaults.font.family = "'Segoe UI', 'Plus Jakarta Sans', sans-serif";
  Chart.defaults.font.weight = '700';
  Chart.defaults.color = '#334155';

  await loadDataset();
  applyFilters();
});

async function loadDataset() {
  try {
    const response = await fetch('telecom_network_cleaned.csv');
    if (!response.ok) throw new Error('Failed to fetch CSV file');
    const csvText = await response.text();
    parseCSV(csvText);
  } catch (e) {
    console.warn('Falling back to telemetry generator:', e);
    generateTelemetryData();
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length <= 1) {
    generateTelemetryData();
    return;
  }

  rawData = [];
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 10) continue;

    rawData.push({
      id: cols[0],
      month: cols[1],
      week: weeks[(i - 1) % 4],
      region: cols[2],
      netType: cols[3],
      issueType: cols[4],
      priority: cols[5],
      status: cols[6],
      respTime: parseFloat(cols[7]) || 10,
      resolTime: parseFloat(cols[8]) || 30,
      csat: parseFloat(cols[9]) || 3.5
    });
  }
}

function generateTelemetryData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const regions = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];
  const netTypes = ['Broadband', 'Mobile', 'TV', 'Landline'];
  const issueTypes = ['Slow Internet', 'Installation Delay', 'No Signal', 'Billing Error', 'Dropped Calls', 'Service Outage'];
  const priorities = ['High', 'Medium', 'Low'];
  const statuses = ['Resolved', 'In Progress', 'Escalated', 'SLA Breached'];

  rawData = [];
  for (let i = 1; i <= 5000; i++) {
    const month = months[Math.floor(Math.random() * months.length)];
    const week = 'Week ' + (1 + Math.floor(Math.random() * 4));
    const reg = regions[Math.floor(Math.random() * regions.length)];
    const ntype = netTypes[Math.floor(Math.random() * netTypes.length)];
    const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    const prio = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const respTime = parseFloat((5 + Math.random() * 15).toFixed(2));
    const resolTime = parseFloat((respTime + Math.random() * 60).toFixed(2));
    const csat = parseFloat(Math.max(1.0, Math.min(5.0, 5 - (respTime / 20 + resolTime / 60))).toFixed(2));

    rawData.push({
      id: `TKT-${i}`,
      month: month,
      week: week,
      region: reg,
      netType: ntype,
      issueType: issue,
      priority: prio,
      status: status,
      respTime: respTime,
      resolTime: resolTime,
      csat: csat
    });
  }
}

function resetAllFilters() {
  document.getElementById('slice-month').value = 'All';
  document.getElementById('slice-status').value = 'All';
  document.getElementById('slice-tech').value = 'All';
  document.getElementById('slice-region').value = 'All';
  document.getElementById('slice-priority').value = 'All';
  document.getElementById('slice-issue').value = 'All';
  applyFilters();
}

function applyFilters() {
  const month = document.getElementById('slice-month').value;
  const status = document.getElementById('slice-status').value;
  const tech = document.getElementById('slice-tech').value;
  const region = document.getElementById('slice-region').value;
  const priority = document.getElementById('slice-priority').value;
  const issue = document.getElementById('slice-issue').value;

  filteredData = rawData.filter(d => {
    const matchMonth = (month === 'All' || d.month === month);
    const matchStatus = (status === 'All' || d.status === status);
    const matchTech = (tech === 'All' || d.netType === tech);
    const matchRegion = (region === 'All' || d.region === region);
    const matchPriority = (priority === 'All' || d.priority === priority);
    const matchIssue = (issue === 'All' || d.issueType === issue);
    return matchMonth && matchStatus && matchTech && matchRegion && matchPriority && matchIssue;
  });

  updateKPIs();
  updateCharts();
}

function updateKPIs() {
  const total = filteredData.length;
  if (total === 0) {
    document.getElementById('kpi-total').innerText = '0';
    document.getElementById('kpi-resp').innerText = '0.00';
    document.getElementById('kpi-resol').innerText = '0.00';
    document.getElementById('kpi-csat').innerText = '0.00';
    return;
  }

  const avgResp = filteredData.reduce((a, b) => a + b.respTime, 0) / total;
  const avgResol = filteredData.reduce((a, b) => a + b.resolTime, 0) / total;
  const avgCSAT = filteredData.reduce((a, b) => a + b.csat, 0) / total;

  ['kpi-total', 'kpi-resp', 'kpi-resol', 'kpi-csat'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.transform = 'scale(1.12)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 280);
  });

  document.getElementById('kpi-total').innerText = total.toLocaleString();
  document.getElementById('kpi-resp').innerText = avgResp.toFixed(2);
  document.getElementById('kpi-resol').innerText = avgResol.toFixed(2);
  document.getElementById('kpi-csat').innerText = avgCSAT.toFixed(2);
}

// Robust chart renderer keeping existing canvas element intact with 3D pop animations
function renderChart(chartKey, canvasId, type, data, options) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const box = canvas.parentElement;
  if (box && box.classList) {
    box.classList.remove('chart-pop-3d');
    void box.offsetWidth; // Trigger reflow for keyframe restart
    box.classList.add('chart-pop-3d');
  }

  if (charts[chartKey]) {
    try {
      charts[chartKey].destroy();
    } catch (e) {
      console.warn(`Error destroying ${chartKey}:`, e);
    }
    charts[chartKey] = null;
  }

  // Inject 3D smooth transition animation default options
  const defaultAnimOptions = {
    animation: {
      duration: 1050,
      easing: 'easeInOutQuart'
    }
  };

  const mergedOptions = Object.assign({}, defaultAnimOptions, options);
  if (options && options.animation) {
    mergedOptions.animation = Object.assign({}, defaultAnimOptions.animation, options.animation);
  }

  charts[chartKey] = new Chart(canvas, { type, data, options: mergedOptions });
}

// Helper for DataLabels on Cartesian Charts (Bar, Column, Line)
function getCartesianDataLabels(color = '#0f172a', align = 'top', anchor = 'end') {
  return {
    display: true,
    color: color,
    anchor: anchor,
    align: align,
    offset: 2,
    font: { weight: '800', size: 12 },
    formatter: (val) => {
      const num = Number(val);
      return (!isNaN(num) && num >= 0) ? num.toLocaleString() : '0';
    }
  };
}

// Helper for DataLabels on Radial / Circular Charts (Pie, Doughnut, PolarArea)
function getRadialDataLabels() {
  return {
    display: true,
    color: '#ffffff',
    textStrokeColor: '#0f172a',
    textStrokeWidth: 2,
    font: { weight: '800', size: 11 },
    formatter: (val, ctx) => {
      const num = Number(val);
      if (isNaN(num) || num <= 0) return '';
      let dataset = (ctx && ctx.dataset && Array.isArray(ctx.dataset.data)) ? ctx.dataset.data : [];
      let total = dataset.reduce((a, b) => a + (Number(b) || 0), 0);
      let pct = total > 0 ? Math.round((num / total) * 100) + '%' : '';
      return `${num.toLocaleString()}\n(${pct})`;
    }
  };
}

function updateCharts() {
  const selectedMonth = document.getElementById('slice-month').value;
  const selectedStatus = document.getElementById('slice-status').value;
  const selectedTech = document.getElementById('slice-tech').value;
  const selectedRegion = document.getElementById('slice-region').value;
  const selectedPriority = document.getElementById('slice-priority').value;
  const selectedIssue = document.getElementById('slice-issue').value;

  const layoutPadding = { top: 16, right: 16, bottom: 8, left: 8 };

  // ==========================================
  // 1. Visual 1: Issue Type Chart (BAR CHART FOR INDIVIDUAL)
  // ==========================================
  const titleIssues = document.getElementById('title-issues');
  if (selectedIssue !== 'All') {
    if (titleIssues) titleIssues.innerText = `[${selectedIssue}] Tickets by Service Type`;
    const services = ['Broadband', 'Mobile', 'TV', 'Landline'];
    const counts = { Broadband: 0, Mobile: 0, TV: 0, Landline: 0 };
    filteredData.forEach(d => { if (counts[d.netType] !== undefined) counts[d.netType]++; });

    renderChart('issues', 'chartIssues', 'bar', {
      labels: services,
      datasets: [{
        label: 'Tickets',
        data: services.map(s => counts[s]),
        backgroundColor: services.map(s => serviceColorMap[s] || '#2563eb'),
        borderRadius: 8
      }]
    }, {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: layoutPadding },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#0f172a', 'top', 'end')
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        x: { grid: { display: false } }
      }
    });
  } else {
    if (titleIssues) titleIssues.innerText = `Total Ticket by Issue Type`;
    const allIssues = ['Slow Internet', 'Installation Delay', 'No Signal', 'Billing Error', 'Dropped Calls', 'Service Outage'];
    const counts = {};
    allIssues.forEach(i => counts[i] = 0);
    filteredData.forEach(d => { if (counts[d.issueType] !== undefined) counts[d.issueType]++; });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(s => s[0]);
    const dataVals = sorted.map(s => s[1]);

    renderChart('issues', 'chartIssues', 'bar', {
      labels: labels,
      datasets: [{
        label: 'Tickets',
        data: dataVals,
        backgroundColor: labels.map(l => issueColorMap[l] || '#2563eb'),
        borderRadius: 8
      }]
    }, {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 36, bottom: 8, left: 8 } },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#1e293b', 'end', 'end')
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        y: { grid: { display: false } }
      }
    });
  }

  // ==========================================
  // 2. Visual 2: Priority Chart (BAR CHART FOR INDIVIDUAL)
  // ==========================================
  const titlePriority = document.getElementById('title-priority');
  if (selectedPriority !== 'All') {
    if (titlePriority) titlePriority.innerText = `[${selectedPriority}] Priority Tickets by Resolution Status`;
    const statuses = ['Resolved', 'In Progress', 'Escalated', 'SLA Breached'];
    const counts = { 'Resolved': 0, 'In Progress': 0, 'Escalated': 0, 'SLA Breached': 0 };
    filteredData.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });

    renderChart('priority', 'chartPriority', 'bar', {
      labels: statuses,
      datasets: [{
        label: 'Tickets',
        data: statuses.map(s => counts[s]),
        backgroundColor: statuses.map(s => statusColorMap[s] || '#f59e0b'),
        borderRadius: 8
      }]
    }, {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: layoutPadding },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#0f172a', 'top', 'end')
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        x: { grid: { display: false } }
      }
    });
  } else {
    if (titlePriority) titlePriority.innerText = `Total Ticket by Priority`;
    const priorities = ['High', 'Medium', 'Low'];
    const counts = { High: 0, Medium: 0, Low: 0 };
    filteredData.forEach(d => { if (counts[d.priority] !== undefined) counts[d.priority]++; });

    renderChart('priority', 'chartPriority', 'doughnut', {
      labels: priorities,
      datasets: [{
        data: priorities.map(p => counts[p]),
        backgroundColor: priorities.map(p => prioColorMap[p] || '#f59e0b'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 14
      }]
    }, {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right' },
        datalabels: getRadialDataLabels()
      }
    });
  }

  // ==========================================
  // 3. Visual 3: Service Type Chart (BAR CHART FOR INDIVIDUAL)
  // ==========================================
  const titleTech = document.getElementById('title-tech');
  if (selectedTech !== 'All') {
    if (titleTech) titleTech.innerText = `[${selectedTech}] Tickets by Issue Type`;
    const issues = ['Slow Internet', 'Installation Delay', 'No Signal', 'Billing Error', 'Dropped Calls', 'Service Outage'];
    const counts = {};
    issues.forEach(i => counts[i] = 0);
    filteredData.forEach(d => { if (counts[d.issueType] !== undefined) counts[d.issueType]++; });

    renderChart('techPie', 'chartTechPie', 'bar', {
      labels: issues,
      datasets: [{
        label: 'Tickets',
        data: issues.map(i => counts[i]),
        backgroundColor: issues.map(i => issueColorMap[i] || '#2563eb'),
        borderRadius: 6
      }]
    }, {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 36, bottom: 8, left: 8 } },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#1e293b', 'end', 'end')
      },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        y: { grid: { display: false } }
      }
    });
  } else {
    if (titleTech) titleTech.innerText = `Total Ticket by Service Type`;
    const services = ['Broadband', 'Mobile', 'TV', 'Landline'];
    const counts = { Broadband: 0, Mobile: 0, TV: 0, Landline: 0 };
    filteredData.forEach(d => { if (counts[d.netType] !== undefined) counts[d.netType]++; });

    renderChart('techPie', 'chartTechPie', 'pie', {
      labels: services,
      datasets: [{
        data: services.map(s => counts[s]),
        backgroundColor: services.map(s => serviceColorMap[s] || '#2563eb'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 14
      }]
    }, {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        datalabels: getRadialDataLabels()
      }
    });
  }

  // ==========================================
  // 4. Visual 4: Region Zone Chart (BAR CHART FOR INDIVIDUAL ZONE)
  // ==========================================
  const titleRegion = document.getElementById('title-region');
  if (selectedRegion !== 'All') {
    if (titleRegion) titleRegion.innerText = `[${selectedRegion}] Tickets by Service Type`;
    const services = ['Broadband', 'Mobile', 'TV', 'Landline'];
    const counts = { Broadband: 0, Mobile: 0, TV: 0, Landline: 0 };
    filteredData.forEach(d => { if (counts[d.netType] !== undefined) counts[d.netType]++; });

    renderChart('region', 'chartRegion', 'bar', {
      labels: services,
      datasets: [{
        label: 'Tickets',
        data: services.map(s => counts[s]),
        backgroundColor: services.map(s => serviceColorMap[s] || '#8b5cf6'),
        borderRadius: 8
      }]
    }, {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: layoutPadding },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#0f172a', 'top', 'end')
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        x: { grid: { display: false } }
      }
    });
  } else {
    if (titleRegion) titleRegion.innerText = `Total Ticket by Region Zone`;
    const regions = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];
    const counts = { 'North Zone': 0, 'South Zone': 0, 'East Zone': 0, 'West Zone': 0, 'Central Zone': 0 };
    filteredData.forEach(d => { if (counts[d.region] !== undefined) counts[d.region]++; });

    renderChart('region', 'chartRegion', 'radar', {
      labels: regions,
      datasets: [{
        label: 'Tickets',
        data: regions.map(r => counts[r]),
        backgroundColor: 'rgba(139, 92, 246, 0.25)',
        borderColor: '#8b5cf6',
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        borderWidth: 2.5
      }]
    }, {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        datalabels: {
          display: true,
          color: '#1e293b',
          anchor: 'end',
          align: 'top',
          offset: 4,
          font: { weight: '800', size: 11 },
          formatter: (val) => {
            const num = Number(val);
            return (!isNaN(num) && num > 0) ? num.toLocaleString() : '';
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          angleLines: { color: 'rgba(0,0,0,0.1)' },
          pointLabels: { font: { size: 11, weight: '700' }, color: '#475569' }
        }
      }
    });
  }

  // ==========================================
  // 5. Visual 5: Status Chart (BAR CHART FOR INDIVIDUAL STATUS)
  // ==========================================
  const titleStatus = document.getElementById('title-status');
  if (selectedStatus !== 'All') {
    if (titleStatus) titleStatus.innerText = `[${selectedStatus}] Tickets by Priority Level`;
    const priorities = ['High', 'Medium', 'Low'];
    const counts = { High: 0, Medium: 0, Low: 0 };
    filteredData.forEach(d => { if (counts[d.priority] !== undefined) counts[d.priority]++; });

    renderChart('status', 'chartStatus', 'bar', {
      labels: priorities,
      datasets: [{
        label: 'Tickets',
        data: priorities.map(p => counts[p]),
        backgroundColor: priorities.map(p => prioColorMap[p] || '#10b981'),
        borderRadius: 8
      }]
    }, {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: layoutPadding },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#0f172a', 'top', 'end')
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        x: { grid: { display: false } }
      }
    });
  } else {
    if (titleStatus) titleStatus.innerText = `Total Ticket by Resolution Status`;
    const statuses = ['Resolved', 'In Progress', 'Escalated', 'SLA Breached'];
    const counts = { 'Resolved': 0, 'In Progress': 0, 'Escalated': 0, 'SLA Breached': 0 };
    filteredData.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });

    renderChart('status', 'chartStatus', 'polarArea', {
      labels: statuses,
      datasets: [{
        data: statuses.map(s => counts[s]),
        backgroundColor: statuses.map(s => statusColorMap[s] || 'rgba(245, 158, 11, 0.85)'),
        borderWidth: 1.5
      }]
    }, {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        datalabels: getRadialDataLabels()
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { display: false }
        }
      }
    });
  }

  // ==========================================
  // 6. Visual 6: Monthly Chart (BAR CHART FOR INDIVIDUAL MONTH)
  // ==========================================
  const titleMonthly = document.getElementById('title-monthly');
  if (selectedMonth !== 'All') {
    if (titleMonthly) titleMonthly.innerText = `[${selectedMonth}] Tickets by Weekly Breakdown`;
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const counts = [0, 0, 0, 0];
    filteredData.forEach(d => {
      const idx = weeks.indexOf(d.week);
      if (idx !== -1) counts[idx]++;
    });

    renderChart('monthly', 'chartMonthly', 'bar', {
      labels: weeks,
      datasets: [{
        label: 'Tickets',
        data: counts,
        backgroundColor: ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981'],
        borderRadius: 8
      }]
    }, {
      indexAxis: 'x',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: layoutPadding },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#0f172a', 'top', 'end')
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        x: { grid: { display: false } }
      }
    });
  } else {
    if (titleMonthly) titleMonthly.innerText = `Total Ticket by Month Name`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = new Array(12).fill(0);
    filteredData.forEach(d => {
      const idx = months.indexOf(d.month);
      if (idx !== -1) counts[idx]++;
    });

    renderChart('monthly', 'chartMonthly', 'line', {
      labels: months,
      datasets: [{
        label: 'Total Ticket',
        data: counts,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.18)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#06b6d4',
        pointRadius: 6,
        pointHoverRadius: 9
      }]
    }, {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: layoutPadding },
      plugins: {
        legend: { display: false },
        datalabels: getCartesianDataLabels('#0284c7', 'top', 'end')
      },
      scales: {
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, beginAtZero: true, grace: '12%' },
        x: { grid: { display: false } }
      }
    });
  }
}

