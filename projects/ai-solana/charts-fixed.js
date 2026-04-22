// Fixed chart initialization that works with the existing app
const API_BASE = 'https://solana-ai-traders-api.onrender.com';

// Wait for both DOM and other scripts to load
window.addEventListener('load', () => {
    console.log('Charts-fixed.js loaded, API_BASE:', API_BASE);
    console.log('Starting chart initialization...');
    
    // Small delay to ensure everything is ready
    setTimeout(() => {
        console.log('Initializing charts after delay...');
        // Check which view is active and initialize appropriate charts
        const dashboardView = document.getElementById('dashboard');
        const analysisView = document.getElementById('analysis');
        const signalsView = document.getElementById('signals');
        const trendingView = document.getElementById('trending');
        
        if (dashboardView && dashboardView.classList.contains('active')) {
            initializeDashboardCharts();
        } else if (analysisView && analysisView.classList.contains('active')) {
            initializeAnalysisTrendChart();
        } else if (signalsView && signalsView.classList.contains('active')) {
            initializeSignalAnalysisChart();
        } else if (trendingView && trendingView.classList.contains('active')) {
            initializeTrendingCorrelationChart();
        }
    }, 1000);
});

function initializeDashboardCharts() {
    // Prevent multiple initializations
    if (window.chartsInitializing) {
        console.log('Charts already initializing, skipping...');
        return;
    }
    
    window.chartsInitializing = true;
    console.log('Starting dashboard charts initialization...');
    
    // Initialize additional dashboard charts
    initializeTrendAnalysis();
    initializeSignalDistribution();
    initializeMarketCorrelation();
    
    // Mark initialization complete
    setTimeout(() => {
        window.chartsInitializing = false;
        console.log('Dashboard charts initialization complete');
    }, 2000);
    
    // Market chart is handled by dashboard.js to prevent canvas conflicts
    // createMarketChart(); // DISABLED - dashboard.js handles this
    
    /* PRICE CHART DISABLED - Dashboard.js handles price chart
    // Initialize Price Chart
    const priceCanvas = document.getElementById('priceChart');
    if (priceCanvas && typeof Chart !== 'undefined') {
        console.log('Creating price chart...');
        
        // Destroy existing chart if it exists
        if (window.mainPriceChart && typeof window.mainPriceChart.destroy === 'function') {
            window.mainPriceChart.destroy();
        }
        
        const ctx = priceCanvas.getContext('2d');
        window.mainPriceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price (USD)',
                    data: [],
                    borderColor: '#14F195',
                    backgroundColor: 'rgba(20, 241, 149, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        
        // Load data for price chart
        loadPriceData('SOL');
    }
    
    // Market chart handled elsewhere
    createMarketChart();
    
    // Setup token selector
    const tokenSelect = document.getElementById('tokenSelect');
    if (tokenSelect) {
        tokenSelect.addEventListener('change', (e) => {
            loadPriceData(e.target.value);
        });
    }
    */ // END OF PRICE CHART SECTION
}

function createMarketChart() {
    // Get the market chart canvas that now exists in HTML
    const marketCanvas = document.getElementById('marketChart');
    
    if (marketCanvas && typeof Chart !== 'undefined') {
        console.log('Creating market chart...');
        
        // Destroy existing chart if it exists
        if (window.marketChart && typeof window.marketChart.destroy === 'function') {
            window.marketChart.destroy();
        }
        
        const ctx = marketCanvas.getContext('2d');
        window.marketChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Token Prices',
                    data: [],
                    backgroundColor: [
                        'rgba(20, 241, 149, 0.6)',
                        'rgba(153, 69, 255, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(20, 241, 149, 1)',
                        'rgba(153, 69, 255, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        
        // Load market data
        loadMarketData();
    }
}

async function loadPriceData(symbol) {
    try {
        console.log(`Loading price data for ${symbol}...`);
        const response = await fetch(`${API_BASE}/api/token/${symbol}/analysis`);
        const data = await response.json();
        
        if (window.mainPriceChart && data.price_history && Array.isArray(data.price_history)) {
            const hours = 24;
            const labels = data.price_history.slice(-hours).map(item => {
                const date = new Date(item.time);
                return date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            });
            const prices = data.price_history.slice(-hours).map(item => item.price);
            
            window.mainPriceChart.data.labels = labels;
            window.mainPriceChart.data.datasets[0].data = prices;
            window.mainPriceChart.update();
            console.log('Price chart updated successfully');
        }
    } catch (error) {
        console.error('Error loading price data:', error);
    }
}

async function loadMarketData() {
    try {
        console.log('Loading market overview data...');
        const tokensResponse = await fetch(`${API_BASE}/api/tokens`);
        const tokens = await tokensResponse.json();
        
        if (window.marketChart && tokens && Array.isArray(tokens)) {
            const labels = tokens.map(t => t.symbol);
            const prices = tokens.map(t => t.price);
            
            window.marketChart.data.labels = labels;
            window.marketChart.data.datasets[0].data = prices;
            window.marketChart.update();
            console.log('Market chart updated successfully with tokens:', labels);
        }
    } catch (error) {
        console.error('Error loading market data:', error);
    }
}

// Initialize Trend Analysis Chart
function initializeTrendAnalysis() {
    const trendCanvas = document.getElementById('trendChart');
    if (trendCanvas && typeof Chart !== 'undefined') {
        console.log('Creating trend analysis chart...');
        
        // Destroy existing chart if it exists
        if (window.trendChart && typeof window.trendChart.destroy === 'function') {
            console.log('Destroying existing trend chart');
            window.trendChart.destroy();
            window.trendChart = null;
        }
        
        const ctx = trendCanvas.getContext('2d');
        window.trendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Bullish Signals', 'Bearish Signals', 'Neutral'],
                datasets: [{
                    label: 'Signal Strength',
                    data: [65, 20, 15],
                    backgroundColor: [
                        'rgba(20, 241, 149, 0.8)',
                        'rgba(255, 107, 107, 0.8)',
                        'rgba(255, 217, 61, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        loadTrendData();
    }
}

// Initialize Signal Distribution Chart
function initializeSignalDistribution() {
    const signalCanvas = document.getElementById('signalChart');
    if (signalCanvas && typeof Chart !== 'undefined') {
        console.log('Creating signal distribution chart...');
        
        // Destroy existing chart if it exists
        if (window.signalChart && typeof window.signalChart.destroy === 'function') {
            console.log('Destroying existing signal chart');
            window.signalChart.destroy();
            window.signalChart = null;
        }
        
        const ctx = signalCanvas.getContext('2d');
        window.signalChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Buy', 'Hold', 'Sell'],
                datasets: [{
                    data: [40, 35, 25],
                    backgroundColor: [
                        'rgba(20, 241, 149, 0.8)',
                        'rgba(255, 217, 61, 0.8)',
                        'rgba(255, 107, 107, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#888',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
        loadSignalData();
    }
}

// Initialize Market Correlation Chart
function initializeMarketCorrelation() {
    const correlationCanvas = document.getElementById('correlationChart');
    if (correlationCanvas && typeof Chart !== 'undefined') {
        console.log('Creating market correlation chart...');
        
        // Destroy existing chart if it exists
        if (window.correlationChart && typeof window.correlationChart.destroy === 'function') {
            console.log('Destroying existing correlation chart');
            window.correlationChart.destroy();
            window.correlationChart = null;
        }
        
        const ctx = correlationCanvas.getContext('2d');
        window.correlationChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['SOL', 'USDC', 'RAY', 'BONK', 'SRM'],
                datasets: [{
                    label: 'Correlation Strength',
                    data: [100, 20, 75, 45, 60],
                    borderColor: '#14F195',
                    backgroundColor: 'rgba(20, 241, 149, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#14F195',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#14F195'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#888'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: '#888',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
        loadCorrelationData();
    }
}

// Load trend analysis data
async function loadTrendData() {
    try {
        const response = await fetch(`${API_BASE}/api/token/SOL/analysis`);
        const data = await response.json();
        
        if (window.trendChart && data) {
            // Generate trend data based on AI signal and sentiment
            let bullish = 40, bearish = 30, neutral = 30;
            
            if (data.ai_signal === 'BUY' && data.sentiment === 'bullish') {
                bullish = 70; bearish = 15; neutral = 15;
            } else if (data.ai_signal === 'SELL' && data.sentiment === 'bearish') {
                bullish = 10; bearish = 70; neutral = 20;
            } else if (data.sentiment === 'bullish') {
                bullish = 60; bearish = 20; neutral = 20;
            } else if (data.sentiment === 'bearish') {
                bullish = 20; bearish = 60; neutral = 20;
            }
            
            window.trendChart.data.datasets[0].data = [bullish, bearish, neutral];
            window.trendChart.update();
            console.log('Trend analysis chart updated with real data');
        }
    } catch (error) {
        console.log('Using default trend data:', error);
    }
}

// Load signal distribution data
async function loadSignalData() {
    try {
        const response = await fetch(`${API_BASE}/api/signals`);
        const data = await response.json();
        
        if (window.signalChart && data && data.signals) {
            // Count signal types from the signals array
            let buyCount = 0, holdCount = 0, sellCount = 0;
            
            data.signals.forEach(signal => {
                if (signal.signal === 'BUY') buyCount++;
                else if (signal.signal === 'SELL') sellCount++;
                else holdCount++;
            });
            
            // Calculate percentages
            const total = data.signals.length;
            const buyPercent = Math.round((buyCount / total) * 100);
            const holdPercent = Math.round((holdCount / total) * 100);
            const sellPercent = Math.round((sellCount / total) * 100);
            
            window.signalChart.data.datasets[0].data = [buyPercent, holdPercent, sellPercent];
            window.signalChart.update();
            console.log('Signal distribution chart updated with real data');
        }
    } catch (error) {
        console.log('Using default signal data:', error);
    }
}

// Load correlation data
async function loadCorrelationData() {
    try {
        const response = await fetch(`${API_BASE}/api/correlations`);
        const data = await response.json();
        
        if (window.correlationChart && data && data.correlations) {
            // Extract correlation data for visualization
            const tokens = Object.keys(data.correlations);
            const correlationValues = [];
            
            // Get correlation values for the first token with all others
            const baseToken = tokens[0];
            if (data.correlations[baseToken]) {
                tokens.forEach(token => {
                    if (token !== baseToken) {
                        correlationValues.push(Math.abs(data.correlations[baseToken][token] || 0) * 100);
                    }
                });
                
                // Update chart with correlation data
                window.correlationChart.data.labels = tokens.slice(1);
                window.correlationChart.data.datasets[0].data = correlationValues;
                window.correlationChart.update();
                console.log('Market correlation chart updated with real data');
            }
        }
    } catch (error) {
        console.log('Using default correlation data:', error);
    }
}

// Initialize AI Analysis Trend Chart
function initializeAnalysisTrendChart() {
    const analysisTrendCanvas = document.getElementById('analysisTrendChart');
    if (analysisTrendCanvas && typeof Chart !== 'undefined') {
        console.log('Creating AI analysis trend chart...');
        
        // Destroy existing chart if it exists
        if (window.analysisTrendChart && typeof window.analysisTrendChart.destroy === 'function') {
            window.analysisTrendChart.destroy();
        }
        
        const ctx = analysisTrendCanvas.getContext('2d');
        window.analysisTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1h', '4h', '8h', '12h', '16h', '20h', '24h'],
                datasets: [{
                    label: 'Bullish Score',
                    data: [45, 52, 58, 65, 70, 68, 72],
                    borderColor: '#14F195',
                    backgroundColor: 'rgba(20, 241, 149, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                }, {
                    label: 'Bearish Score',
                    data: [55, 48, 42, 35, 30, 32, 28],
                    borderColor: '#FF4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#888' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        loadAnalysisTrendData();
    }
}

// Load AI analysis trend data
async function loadAnalysisTrendData() {
    try {
        const response = await fetch(`${API_BASE}/api/token/SOL/analysis`);
        const data = await response.json();
        
        if (window.analysisTrendChart && data) {
            // Update with real trend data if available
            console.log('AI analysis trend chart updated');
        }
    } catch (error) {
        console.log('Using default analysis trend data');
    }
}

// Initialize Signal Analysis Chart for Trading Signals page
function initializeSignalAnalysisChart() {
    const signalAnalysisCanvas = document.getElementById('signalAnalysisChart');
    if (signalAnalysisCanvas && typeof Chart !== 'undefined') {
        console.log('Creating signal analysis chart...');
        
        // Destroy existing chart if it exists
        if (window.signalAnalysisChartObj && typeof window.signalAnalysisChartObj.destroy === 'function') {
            window.signalAnalysisChartObj.destroy();
        }
        
        const ctx = signalAnalysisCanvas.getContext('2d');
        window.signalAnalysisChartObj = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'],
                datasets: [{
                    label: 'Signal Strength',
                    data: [8, 12, 15, 5, 2],
                    backgroundColor: [
                        'rgba(20, 241, 149, 0.9)',
                        'rgba(20, 241, 149, 0.6)',
                        'rgba(255, 217, 61, 0.8)',
                        'rgba(255, 107, 107, 0.6)',
                        'rgba(255, 107, 107, 0.9)'
                    ],
                    borderColor: [
                        'rgba(20, 241, 149, 1)',
                        'rgba(20, 241, 149, 1)',
                        'rgba(255, 217, 61, 1)',
                        'rgba(255, 107, 107, 1)',
                        'rgba(255, 107, 107, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y} signals`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#888',
                            stepSize: 5
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        loadSignalAnalysisData();
    }
}

// Load signal analysis data
async function loadSignalAnalysisData() {
    try {
        const response = await fetch(`${API_BASE}/api/signals`);
        const data = await response.json();
        
        if (window.signalAnalysisChartObj && data) {
            // Process signals to count by strength
            let strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0;
            
            if (Array.isArray(data)) {
                data.forEach(signal => {
                    if (signal.confidence > 0.8 && signal.signal === 'buy') strongBuy++;
                    else if (signal.signal === 'buy') buy++;
                    else if (signal.signal === 'hold') hold++;
                    else if (signal.confidence > 0.8 && signal.signal === 'sell') strongSell++;
                    else if (signal.signal === 'sell') sell++;
                });
            }
            
            // Update chart if we have data
            if (strongBuy + buy + hold + sell + strongSell > 0) {
                window.signalAnalysisChartObj.data.datasets[0].data = [strongBuy, buy, hold, sell, strongSell];
                window.signalAnalysisChartObj.update();
            }
        }
    } catch (error) {
        console.log('Using default signal analysis data');
    }
}

// Initialize Trending Correlation Chart
function initializeTrendingCorrelationChart() {
    const trendingCorrelationCanvas = document.getElementById('trendingCorrelationChart');
    if (trendingCorrelationCanvas && typeof Chart !== 'undefined') {
        console.log('Creating trending correlation chart...');
        
        // Destroy existing chart if it exists
        if (window.trendingCorrelationChartObj && typeof window.trendingCorrelationChartObj.destroy === 'function') {
            window.trendingCorrelationChartObj.destroy();
        }
        
        const ctx = trendingCorrelationCanvas.getContext('2d');
        window.trendingCorrelationChartObj = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['SOL', 'USDC', 'RAY', 'BONK', 'SRM', 'ORCA'],
                datasets: [{
                    label: 'Price Correlation',
                    data: [100, 15, 85, 45, 65, 55],
                    borderColor: '#14F195',
                    backgroundColor: 'rgba(20, 241, 149, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#14F195',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#14F195'
                }, {
                    label: 'Volume Correlation',
                    data: [100, 25, 70, 60, 50, 40],
                    borderColor: '#9945FF',
                    backgroundColor: 'rgba(153, 69, 255, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: '#9945FF',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#9945FF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#888',
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.r}%`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#888',
                            backdropColor: 'transparent'
                        },
                        grid: { 
                            color: 'rgba(255, 255, 255, 0.1)',
                            circular: true
                        },
                        pointLabels: {
                            color: '#14F195',
                            font: { 
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
        loadTrendingCorrelationData();
    }
}

// Load trending correlation data
async function loadTrendingCorrelationData() {
    try {
        const response = await fetch(`${API_BASE}/api/market/overview`);
        const data = await response.json();
        
        if (window.trendingCorrelationChartObj && data && data.tokens) {
            // Calculate some mock correlations based on price changes
            const correlations = data.tokens.map(token => {
                // Generate correlation values based on price change
                const baseCorr = 50 + (token.price_change_24h || 0) * 2;
                return Math.max(0, Math.min(100, baseCorr));
            });
            
            // Update chart with calculated correlations
            if (correlations.length > 0) {
                window.trendingCorrelationChartObj.data.datasets[0].data = correlations;
                // Generate volume correlations (slightly different)
                const volCorrelations = correlations.map(c => Math.max(0, Math.min(100, c + (Math.random() - 0.5) * 20)));
                window.trendingCorrelationChartObj.data.datasets[1].data = volCorrelations;
                window.trendingCorrelationChartObj.update();
            }
        }
    } catch (error) {
        console.log('Using default trending correlation data');
    }
}

// Also reinitialize when switching to dashboard, analysis, signals, or trending
document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.view === 'dashboard') {
                setTimeout(() => {
                    if (!window.mainPriceChart || !window.mainMarketChart) {
                        initializeDashboardCharts();
                    }
                }, 100);
            } else if (btn.dataset.view === 'analysis') {
                setTimeout(() => {
                    initializeAnalysisTrendChart();
                }, 100);
            } else if (btn.dataset.view === 'signals') {
                setTimeout(() => {
                    initializeSignalAnalysisChart();
                }, 100);
            } else if (btn.dataset.view === 'trending') {
                setTimeout(() => {
                    initializeTrendingCorrelationChart();
                }, 100);
            }
        });
    });
});

console.log('Charts-fixed.js loaded');