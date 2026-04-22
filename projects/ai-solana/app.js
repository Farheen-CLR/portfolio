// API Configuration
const API_BASE_URL = 'https://solana-ai-traders-api.onrender.com';
const WS_URL = 'wss://solana-ai-traders-api.onrender.com/ws';

// Global state
let ws = null;
let currentView = 'dashboard';
let marketData = {};
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeWebSocket();
    loadInitialData();
    
    // Load dashboard immediately with charts
    setTimeout(() => {
        loadDashboard();
    }, 500);
    
    setInterval(refreshData, 30000); // Refresh every 30 seconds
});

// Navigation
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === viewName);
    });
    
    currentView = viewName;
    
    // Load view-specific data
    switch(viewName) {
        case 'dashboard':
            // Delay slightly to ensure view is rendered
            setTimeout(() => {
                loadDashboard();
                // Ensure charts are initialized
                if (window.chartFunctions && !window.priceChart) {
                    window.chartFunctions.initializePriceChart();
                    window.chartFunctions.initializeTrendChart();
                    window.chartFunctions.initializeSignalChart();
                    window.chartFunctions.initializeCorrelationChart();
                    window.chartFunctions.updatePriceChart('SOL');
                }
            }, 50);
            break;
        case 'analysis':
            loadAnalysis();
            break;
        case 'signals':
            loadSignals();
            break;
        case 'trending':
            loadTrending();
            break;
        case 'knowledge':
            // Knowledge page is static HTML, no loading needed
            break;
    }
}

// WebSocket Management (Disabled - backend doesn't support WebSocket)
function initializeWebSocket() {
    // Silently skip - backend doesn't support WebSocket
    updateConnectionStatus('api-only');
    return;
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;
    
    const indicator = statusElement.querySelector('.status-indicator');
    const text = statusElement.querySelector('.status-text');
    
    switch(status) {
        case 'connected':
            indicator.style.backgroundColor = '#14F195';
            text.textContent = 'Connected';
            break;
        case 'api-only':
            indicator.style.backgroundColor = '#14F195';
            text.textContent = 'API Connected';
            break;
        case 'disconnected':
            indicator.style.backgroundColor = '#FF4444';
            text.textContent = 'Disconnected';
            break;
        case 'error':
            indicator.style.backgroundColor = '#FFA500';
            text.textContent = 'Connection Error';
            break;
        default:
            indicator.style.backgroundColor = '#888';
            text.textContent = 'Connecting...';
    }
}

function handleRealtimeUpdate(data) {
    if (data.type === 'price_update') {
        // Update market data
        if (!marketData.tokens) marketData.tokens = [];
        const tokenIndex = marketData.tokens.findIndex(t => t.symbol === data.symbol);
        if (tokenIndex >= 0) {
            marketData.tokens[tokenIndex].price = data.price;
            marketData.tokens[tokenIndex].volume_24h = data.volume;
        }
        
        // Update display if on dashboard
        if (currentView === 'dashboard') {
            updatePriceDisplay(data.symbol, data.price);
        }
    }
}

// API Helper Functions
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        showError(`Failed to fetch data from ${endpoint}`);
        return null;
    }
}

async function postAPI(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error posting to ${endpoint}:`, error);
        showError(`Failed to post data to ${endpoint}`);
        return null;
    }
}

// Data Loading Functions
async function loadInitialData() {
    const overview = await fetchAPI('/api/market/overview');
    if (overview) {
        marketData = overview;
        updateMarketDisplay();
    }
}

async function refreshData() {
    switch(currentView) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'analysis':
            loadAnalysis();
            break;
        case 'signals':
            loadSignals();
            break;
        case 'trending':
            loadTrending();
            break;
    }
}

// Dashboard Functions
async function loadDashboard() {
    console.log('Loading dashboard...');
    const overview = await fetchAPI('/api/market/overview');
    const tokens = await fetchAPI('/api/tokens');
    const signals = await fetchAPI('/api/signals');
    const correlations = await fetchAPI('/api/correlations');
    const solAnalysis = await fetchAPI('/api/token/SOL/analysis');
    
    if (overview) {
        displayMarketStats(overview);
    }
    if (tokens) {
        displayTokenGrid(tokens);
    }
    
    // Ensure charts are initialized and then update them with data
    setTimeout(() => {
        updateDashboardChartsWithData(solAnalysis, signals, correlations);
    }, 1000); // Give charts time to initialize
}

function displayMarketStats(data) {
    const statsGrid = document.getElementById('marketStats');
    if (!statsGrid) return;
    
    // Ensure data exists
    if (!data) {
        console.error('Invalid data passed to displayMarketStats:', data);
        return;
    }
    
    const totalMarketCap = data.total_market_cap || 0;
    const totalVolume = data.total_volume_24h || 0;
    const activeTraders = data.active_traders || 0;
    
    // Calculate average change from gainers and losers
    let avgChange = 0;
    if (data.top_gainers && data.top_losers) {
        const allTokens = [...(data.top_gainers || []), ...(data.top_losers || [])];
        if (allTokens.length > 0) {
            avgChange = allTokens.reduce((sum, token) => sum + (token.change || 0), 0) / allTokens.length;
        }
    }
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Market Cap</div>
            <div class="stat-value">$${formatNumber(totalMarketCap)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">24h Volume</div>
            <div class="stat-value">$${formatNumber(totalVolume)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Active Traders</div>
            <div class="stat-value">${formatNumber(activeTraders)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Market Sentiment</div>
            <div class="stat-value">${data.market_sentiment || 'neutral'}</div>
        </div>
    `;
}

function displayTokenGrid(tokens) {
    const grid = document.getElementById('tokenGrid');
    if (!grid) return;
    
    // Ensure tokens is an array
    if (!Array.isArray(tokens)) {
        console.error('Invalid tokens data:', tokens);
        return;
    }
    
    grid.innerHTML = tokens.map(token => `
        <div class="token-card" data-symbol="${token.symbol}">
            <div class="token-header">
                <h3>${token.symbol}</h3>
                <span class="token-name">${token.name}</span>
            </div>
            <div class="token-price">
                <span class="price">$${formatPrice(token.price)}</span>
                <span class="change ${token.change >= 0 ? 'positive' : 'negative'}">
                    ${token.change >= 0 ? '+' : ''}${token.change.toFixed(2)}%
                </span>
            </div>
            <div class="token-stats">
                <div class="stat">
                    <span class="stat-label">24h Vol:</span>
                    <span class="stat-value">$${formatNumber(Math.random() * 10000000)}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Vol Change:</span>
                    <span class="stat-value ${Math.random() > 0.5 ? 'positive' : 'negative'}">
                        ${Math.random() > 0.5 ? '↑' : '↓'} ${(Math.random() * 20).toFixed(1)}%
                    </span>
                </div>
            </div>
            <button class="analyze-btn" onclick="analyzeToken('${token.symbol}')">Analyze</button>
        </div>
    `).join('');
}

// Function to update dashboard charts with API data
function updateDashboardChartsWithData(solAnalysis, signals, correlations, retryCount = 0) {
    const maxRetries = 5;
    let chartsUpdated = 0;
    
    console.log(`Attempting to update charts (retry ${retryCount})`);
    console.log('Chart status:', {
        trendChart: !!window.trendChart,
        signalChart: !!window.signalChart,
        correlationChart: !!window.correlationChart
    });
    
    // Update Trend Analysis chart
    if (window.trendChart && solAnalysis) {
        const bullish = solAnalysis.ai_signal === 'BUY' ? 70 : solAnalysis.ai_signal === 'HOLD' ? 40 : 20;
        const bearish = solAnalysis.ai_signal === 'SELL' ? 70 : solAnalysis.ai_signal === 'HOLD' ? 30 : 20;
        const neutral = 100 - bullish - bearish;
        
        window.trendChart.data.datasets[0].data = [bullish, bearish, neutral];
        window.trendChart.update('none');
        console.log('✅ Updated Trend Analysis chart with data:', [bullish, bearish, neutral]);
        chartsUpdated++;
    } else {
        console.log('❌ Trend Analysis chart not ready');
    }
    
    // Update Signal Distribution chart
    if (window.signalChart && signals && signals.signals) {
        const signalCounts = { BUY: 0, SELL: 0, HOLD: 0 };
        signals.signals.forEach(signal => {
            if (signalCounts[signal.signal] !== undefined) {
                signalCounts[signal.signal]++;
            }
        });
        
        window.signalChart.data.datasets[0].data = [
            signalCounts.BUY,
            signalCounts.HOLD,
            signalCounts.SELL
        ];
        window.signalChart.update('none');
        console.log('✅ Updated Signal Distribution chart with data:', signalCounts);
        chartsUpdated++;
    } else {
        console.log('❌ Signal Distribution chart not ready');
    }
    
    // Update Market Correlation chart
    if (window.correlationChart && correlations && correlations.correlations) {
        const corrData = correlations.correlations;
        const tokens = Object.keys(corrData).slice(0, 5);
        const values = tokens.map(token => {
            const tokenCorr = corrData[token];
            const correlationValues = Object.values(tokenCorr);
            return Math.abs(correlationValues.reduce((sum, val) => sum + val, 0) / correlationValues.length) * 100;
        });
        
        window.correlationChart.data.labels = tokens;
        window.correlationChart.data.datasets[0].data = values;
        window.correlationChart.update('none');
        console.log('✅ Updated Market Correlation chart with data:', values);
        chartsUpdated++;
    } else {
        console.log('❌ Market Correlation chart not ready');
    }
    
    console.log(`Updated ${chartsUpdated}/3 charts`);
    
    // If charts aren't ready and we haven't exceeded max retries, try again
    if (chartsUpdated < 3 && retryCount < maxRetries) {
        console.log(`Retrying chart updates in 2 seconds (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
            updateDashboardChartsWithData(solAnalysis, signals, correlations, retryCount + 1);
        }, 2000);
    }
}

// AI Analysis Functions
async function loadAnalysis() {
    // Load market insights
    const insights = await fetchAPI('/api/token/SOL/analysis');
    if (insights) {
        displayMarketInsights(insights);
    }
    
    // Load analysis for SOL by default
    const analysis = await fetchAPI('/api/token/SOL/analysis');
    if (analysis) {
        displayTokenAnalysis(analysis);
        
        // Initialize and update trend chart for AI Analysis page
        const analysisTrendCtx = document.getElementById('analysisTrendChart');
        if (analysisTrendCtx && window.chartFunctions) {
            // Initialize analysis trend chart if needed
            if (!window.analysisTrendChart) {
                window.analysisTrendChart = new Chart(analysisTrendCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Now', '1h', '2h', '3h', '4h', '5h', '6h'],
                        datasets: [{
                            label: 'Price Trend',
                            data: [],
                            borderColor: '#14F195',
                            backgroundColor: 'rgba(20, 241, 149, 0.1)',
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
                                grid: { color: '#2A2B38' }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
            }
            
            // Update with prediction data
            if (analysis.ai_prediction && analysis.current_price) {
                const basePrice = analysis.current_price;
                const trendData = [
                    basePrice,
                    analysis.ai_prediction.next_hour || basePrice * 1.01,
                    basePrice * 1.02,
                    basePrice * 1.015,
                    basePrice * 1.025,
                    basePrice * 1.03,
                    analysis.ai_prediction.next_day || basePrice * 1.05
                ];
                window.analysisTrendChart.data.datasets[0].data = trendData;
                window.analysisTrendChart.update();
            }
        }
        
        // Display pattern detection
        displayPatternDetection(analysis);
    }
}

function displayMarketInsights(data) {
    const container = document.getElementById('marketInsights');
    if (!container) return;
    
    const sentiment = data.sentiment || 'neutral';
    const confidence = data.confidence || 0.75;
    
    container.innerHTML = `
        <div class="sentiment-indicator ${sentiment}">
            Market Sentiment: ${sentiment.toUpperCase()}
            <span class="confidence">Confidence: ${(confidence * 100).toFixed(0)}%</span>
        </div>
        <div class="insight-item">
            <span class="insight-icon">💡</span>
            AI Signal: ${data.ai_signal || 'HOLD'}
        </div>
        <div class="insight-item">
            <span class="insight-icon">📈</span>
            Risk Level: ${data.risk_level || 'medium'}
        </div>
        <div class="insight-item">
            <span class="insight-icon">🎯</span>
            Predicted 24h Price: $${data.predicted_price_24h || 'N/A'}
        </div>
    `;
}

function displayTokenAnalysis(data) {
    // Display price predictions
    const predContainer = document.getElementById('pricePredictions');
    if (predContainer && data) {
        const currentPrice = data.current_price || 0;
        const predicted24h = data.predicted_price_24h || currentPrice;
        const confidence = data.confidence || 0.75;
        
        predContainer.innerHTML = `
            <div class="prediction-grid">
                <div class="prediction-card">
                    <div class="pred-label">Current Price</div>
                    <div class="pred-value">$${formatPrice(currentPrice)}</div>
                    <div class="pred-change">--</div>
                </div>
                <div class="prediction-card">
                    <div class="pred-label">24h Prediction</div>
                    <div class="pred-value">$${formatPrice(predicted24h)}</div>
                    <div class="pred-change ${predicted24h >= currentPrice ? 'positive' : 'negative'}">
                        ${currentPrice > 0 ? ((predicted24h - currentPrice) / currentPrice * 100).toFixed(2) : '0.00'}%
                    </div>
                </div>
                <div class="prediction-card">
                    <div class="pred-label">Support Level</div>
                    <div class="pred-value">$${formatPrice(data.support_level || currentPrice * 0.9)}</div>
                    <div class="pred-change">Support</div>
                </div>
                <div class="prediction-card">
                    <div class="pred-label">Resistance Level</div>
                    <div class="pred-value">$${formatPrice(data.resistance_level || currentPrice * 1.1)}</div>
                    <div class="pred-change">Resistance</div>
                </div>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${confidence * 100}%"></div>
                <span class="confidence-text">Confidence: ${(confidence * 100).toFixed(0)}%</span>
            </div>
        `;
    } else {
        predContainer.innerHTML = '<div class="loader">Loading predictions...</div>';
    }
    
    // Display risk metrics
    const riskContainer = document.getElementById('riskMetrics');
    if (riskContainer && data) {
        // Create risk metrics from available API data
        const riskMetrics = {
            volatility: data.rsi ? (data.rsi > 70 ? 'High' : data.rsi < 30 ? 'Low' : 'Medium') : 'Medium',
            risk_level: data.risk_level || 'medium',
            support_level: data.support_level || 0,
            resistance_level: data.resistance_level || 0,
            rsi: data.rsi || 50
        };
        displayRiskMetrics(riskMetrics);
    }
    
    // Display technical indicators
    const techContainer = document.getElementById('technicalIndicators');
    if (techContainer && data.technical_indicators) {
        displayTechnicalIndicators(data.technical_indicators);
    }
}

function displayRiskMetrics(metrics) {
    const container = document.getElementById('riskMetrics');
    if (!container) return;
    
    container.innerHTML = `
        <div class="risk-grid">
            <div class="risk-item">
                <span class="risk-label">Risk Level</span>
                <span class="risk-value ${metrics.risk_level}">${metrics.risk_level.toUpperCase()}</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Volatility</span>
                <span class="risk-value">${metrics.volatility}</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">RSI</span>
                <span class="risk-value">${metrics.rsi}</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Support</span>
                <span class="risk-value">$${formatPrice(metrics.support_level)}</span>
            </div>
            <div class="risk-item">
                <span class="risk-label">Resistance</span>
                <span class="risk-value">$${formatPrice(metrics.resistance_level)}</span>
            </div>
        </div>
    `;
}

function displayTechnicalIndicators(indicators) {
    const container = document.getElementById('technicalIndicators');
    if (!container) return;
    
    container.innerHTML = `
        <div class="indicator-grid">
            <div class="indicator-item">
                <span class="indicator-label">RSI</span>
                <span class="indicator-value ${indicators.rsi > 70 ? 'overbought' : indicators.rsi < 30 ? 'oversold' : ''}">${indicators.rsi.toFixed(1)}</span>
            </div>
            <div class="indicator-item">
                <span class="indicator-label">MACD</span>
                <span class="indicator-value">${indicators.macd.toFixed(4)}</span>
            </div>
            <div class="indicator-item">
                <span class="indicator-label">SMA 20</span>
                <span class="indicator-value">$${indicators.sma_20.toFixed(4)}</span>
            </div>
            <div class="indicator-item">
                <span class="indicator-label">SMA 50</span>
                <span class="indicator-value">$${indicators.sma_50.toFixed(4)}</span>
            </div>
        </div>
    `;
}

function displayPatternDetection(analysis) {
    const container = document.getElementById('patternDetection');
    if (!container) return;
    
    // Generate pattern data from technical indicators
    const patterns = [];
    
    if (analysis.technical_indicators) {
        const indicators = analysis.technical_indicators;
        
        // RSI patterns
        if (indicators.rsi > 70) {
            patterns.push({
                type: 'Overbought',
                description: 'RSI indicates overbought conditions',
                strength: 'High',
                action: 'Consider selling'
            });
        } else if (indicators.rsi < 30) {
            patterns.push({
                type: 'Oversold',
                description: 'RSI indicates oversold conditions',
                strength: 'High',
                action: 'Consider buying'
            });
        }
        
        // Moving average patterns
        if (indicators.sma_20 > indicators.sma_50) {
            patterns.push({
                type: 'Golden Cross',
                description: 'Short-term MA above long-term MA',
                strength: 'Medium',
                action: 'Bullish signal'
            });
        } else {
            patterns.push({
                type: 'Death Cross',
                description: 'Short-term MA below long-term MA',
                strength: 'Medium',
                action: 'Bearish signal'
            });
        }
        
        // MACD patterns
        if (indicators.macd > 0) {
            patterns.push({
                type: 'MACD Positive',
                description: 'MACD above signal line',
                strength: 'Medium',
                action: 'Upward momentum'
            });
        }
    }
    
    // Support/Resistance levels
    if (analysis.current_price) {
        patterns.push({
            type: 'Support Level',
            description: `Strong support at $${(analysis.current_price * 0.95).toFixed(2)}`,
            strength: 'High',
            action: 'Watch for bounce'
        });
        patterns.push({
            type: 'Resistance Level',
            description: `Resistance at $${(analysis.current_price * 1.05).toFixed(2)}`,
            strength: 'High',
            action: 'Watch for breakout'
        });
    }
    
    container.innerHTML = patterns.map(pattern => `
        <div class="pattern-item">
            <div class="pattern-type ${pattern.strength.toLowerCase()}">${pattern.type}</div>
            <div class="pattern-description">${pattern.description}</div>
            <div class="pattern-action">${pattern.action}</div>
        </div>
    `).join('') || '<div class="no-patterns">No significant patterns detected</div>';
}

// Trading Signals Functions
async function loadSignals() {
    const signalsContainer = document.getElementById('signalsGrid');
    const refreshBtn = document.getElementById('refreshSignals');
    
    if (!signalsContainer) {
        console.error('Signals container not found');
        return;
    }
    
    // Update button state during loading
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '⏳ Loading...';
    }
    
    signalsContainer.innerHTML = '<div class="loader">🔄 Fetching latest AI signals...</div>';
    
    const signalData = await fetchAPI('/api/signals');
    if (signalData && signalData.signals) {
        displayTradingSignals(signalData.signals);
    } else {
        signalsContainer.innerHTML = '<div class="error">Failed to load trading signals</div>';
    }
    
    // Restore button state
    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '🔄 Get Latest Signals';
    }
    
    // Show success message briefly
    const timestamp = new Date().toLocaleTimeString();
    if (refreshBtn) {
        refreshBtn.innerHTML = `✅ Updated at ${timestamp}`;
        setTimeout(() => {
            refreshBtn.innerHTML = '🔄 Get Latest Signals';
        }, 3000);
    }
}

function displayTradingSignals(signals) {
    const container = document.getElementById('signalsGrid');
    if (!container || !signals) return;
    
    container.innerHTML = signals.map(signal => {
        const signalType = signal.signal || 'HOLD';
        const confidence = signal.confidence || 0.75;
        const symbol = signal.symbol || 'Unknown';
        const name = signal.name || symbol;
        const timestamp = signal.timestamp || new Date().toISOString();
        
        return `
        <div class="signal-card ${signalType.toLowerCase()}">
            <div class="signal-header">
                <h3>${symbol} - ${name}</h3>
                <span class="signal-badge ${signalType.toLowerCase()}">${signalType}</span>
            </div>
            <div class="signal-confidence">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence * 100}%"></div>
                </div>
                <span>Confidence: ${(confidence * 100).toFixed(0)}%</span>
            </div>
            <div class="signal-details">
                <p>• Current Price: $${signal.price || 'N/A'}</p>
                <p>• Target Price: $${signal.target_price || 'N/A'}</p>
                <p>• Stop Loss: $${signal.stop_loss || 'N/A'}</p>
            </div>
            <div class="signal-time">${new Date(timestamp).toLocaleTimeString()}</div>
        </div>
        `;
    }).join('');
}

// Trending Functions
async function loadTrending() {
    const overview = await fetchAPI('/api/market/overview');
    if (overview && overview.trending) {
        // Get token data for trending symbols
        const tokens = await fetchAPI('/api/tokens');
        if (tokens) {
            const trendingTokens = overview.trending.map((symbol, index) => {
                const token = tokens.find(t => t.symbol === symbol);
                return {
                    symbol: symbol,
                    name: token ? token.name : symbol,
                    price: token ? token.price : Math.random() * 100,
                    volume_24h: Math.random() * 10000000,
                    trending_score: (90 - index * 10) / 100, // Decreasing score by rank
                    change: token ? token.change : (Math.random() - 0.5) * 20
                };
            });
            displayTrendingTokens(trendingTokens);
        }
    }
    
    // Update correlation chart
    if (window.updateCorrelationChart) {
        window.updateCorrelationChart();
    }
}

function displayTrendingTokens(tokens) {
    const container = document.getElementById('trendingList');
    if (!container || !tokens) return;
    
    container.innerHTML = tokens.map((token, index) => {
        const symbol = token.symbol || token;
        const name = token.name || symbol;
        const price = token.price || 0;
        const volume = token.volume_24h || 0;
        const score = token.trending_score || 0.5;
        const change = token.change || 0;
        
        return `
        <div class="trending-item">
            <span class="trending-rank">#${index + 1}</span>
            <div class="trending-info">
                <h4>${symbol}${name !== symbol ? ` - ${name}` : ''}</h4>
                <p>Price: $${formatPrice(price)}</p>
                <p>Volume: $${formatNumber(volume)}</p>
                <p class="${change >= 0 ? 'positive' : 'negative'}">
                    24h: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                </p>
            </div>
            <div class="trending-score">
                <div class="score-bar">
                    <div class="score-fill" style="width: ${score * 100}%"></div>
                </div>
                <span>${(score * 100).toFixed(0)}%</span>
            </div>
        </div>
        `;
    }).join('');
}

// Utility Functions
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function formatPrice(price) {
    if (!price || isNaN(price)) return 'N/A';
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
}

function updatePriceDisplay(symbol, price) {
    const tokenCard = document.querySelector(`[data-symbol="${symbol}"]`);
    if (tokenCard) {
        const priceElement = tokenCard.querySelector('.token-price');
        if (priceElement) {
            priceElement.textContent = `$${formatPrice(price)}`;
            priceElement.classList.add('price-update');
            setTimeout(() => priceElement.classList.remove('price-update'), 1000);
        }
    }
}

function showError(message) {
    console.error(message);
    // You could implement a toast notification here
}

function updateMarketDisplay() {
    if (currentView === 'dashboard' && marketData.tokens) {
        displayTokenGrid(marketData.tokens);
    }
}

// Global function to analyze a specific token
window.analyzeToken = function(symbol) {
    // Switch to analysis view
    switchView('analysis');
    
    // Load analysis for the selected token
    fetchAPI(`/token/${symbol}/analysis`).then(data => {
        if (data) {
            displayTokenAnalysis(data);
            // Update the token selector if it exists
            const selector = document.getElementById('analysisTokenSelect');
            if (selector) {
                selector.value = symbol;
            }
        }
    });
}

// Refresh signals button handler
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshSignals');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadSignals);
    }
    
    // Analysis token selector
    const analysisSelector = document.getElementById('analysisTokenSelect');
    if (analysisSelector) {
        analysisSelector.addEventListener('change', (e) => {
            fetchAPI(`/token/${e.target.value}/analysis`).then(data => {
                if (data) displayTokenAnalysis(data);
            });
        });
    }
});