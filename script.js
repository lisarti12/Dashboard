document.addEventListener('DOMContentLoaded', () => {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxLine = document.getElementById('lineChart').getContext('2d');

    const barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [], // Placeholder, populated dynamically
            datasets: [{
                label: 'Market Cap (in billions)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    const lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: [], // Placeholder, populated dynamically
            datasets: [
                { label: 'Price', data: [], borderColor: 'rgba(54, 162, 235, 1)', fill: false }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Time (Days)' } },
                y: { title: { display: true, text: 'Price (USD)' }, beginAtZero: false }
            }
        }
    });

    let cachedData = null;
    let lastFetchTime = 0;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async function fetchCryptoData() {
        const now = Date.now();
        if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
            return cachedData;
        }

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true');
            const data = await response.json();
            cachedData = data;
            lastFetchTime = now;

            updateKpis(data);
            populateTable(data);

            // Show all data initially
            updateCharts(null, data);
            return data;
        } catch (error) {
            console.error('Error fetching cryptocurrency data:', error);
        }
    }

    function updateKpis(data) {
        document.getElementById('kpiBtcPrice').textContent = `$${data.bitcoin.usd.toFixed(0)}`;
        document.getElementById('kpiEthPrice').textContent = `$${data.ethereum.usd.toFixed(1)}`;
        document.getElementById('kpiDogePrice').textContent = `$${data.dogecoin.usd.toFixed(4)}`;
        document.getElementById('kpiSolPrice').textContent = `$${data.solana.usd.toFixed(2)}`;
    }

    function populateTable(data) {
        document.getElementById('btcMarketCap').textContent = `$${(data.bitcoin.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('btcPrice').textContent = `$${data.bitcoin.usd.toFixed(2)}`;
        document.getElementById('btcVolume').textContent = `$${(data.bitcoin.usd_24h_vol / 1e9).toFixed(2)}B`;

        document.getElementById('ethMarketCap').textContent = `$${(data.ethereum.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('ethPrice').textContent = `$${data.ethereum.usd.toFixed(2)}`;
        document.getElementById('ethVolume').textContent = `$${(data.ethereum.usd_24h_vol / 1e9).toFixed(2)}B`;

        document.getElementById('dogeMarketCap').textContent = `$${(data.dogecoin.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('dogePrice').textContent = `$${data.dogecoin.usd.toFixed(4)}`;
        document.getElementById('dogeVolume').textContent = `$${(data.dogecoin.usd_24h_vol / 1e9).toFixed(2)}B`;

        document.getElementById('solMarketCap').textContent = `$${(data.solana.usd_market_cap / 1e9).toFixed(2)}B`;
        document.getElementById('solPrice').textContent = `$${data.solana.usd.toFixed(2)}`;
        document.getElementById('solVolume').textContent = `$${(data.solana.usd_24h_vol / 1e9).toFixed(2)}B`;
    }

    function updateCharts(selectedCoin, data) {
        if (selectedCoin) {
            // Show data for selected coin
            const marketCap = data[selectedCoin].usd_market_cap / 1e9;
            const price = data[selectedCoin].usd;

            barChart.data.labels = [selectedCoin];
            barChart.data.datasets[0].data = [marketCap];
            barChart.update();

            lineChart.data.labels = ['Current']; // Replace with time series if available
            lineChart.data.datasets[0].data = [price];
            lineChart.update();
        } else {
            // Show data for all coins
            barChart.data.labels = ['Bitcoin', 'Ethereum', 'Dogecoin', 'Solana'];
            barChart.data.datasets[0].data = [
                data.bitcoin.usd_market_cap / 1e9,
                data.ethereum.usd_market_cap / 1e9,
                data.dogecoin.usd_market_cap / 1e9,
                data.solana.usd_market_cap / 1e9
            ];
            barChart.update();

            lineChart.data.labels = ['Bitcoin', 'Ethereum', 'Dogecoin', 'Solana'];
            lineChart.data.datasets[0].data = [
                data.bitcoin.usd,
                data.ethereum.usd,
                data.dogecoin.usd,
                data.solana.usd
            ];
            lineChart.update();
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    async function fetchHistoricalData(coinId) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365`);
            const data = await response.json();
            return data.prices;
        } catch (error) {
            console.error('Error fetching historical data:', error);
            return [];
        }
    }

    function updateLineChart(prices) {
        const labels = prices.map(price => new Date(price[0]).toLocaleDateString());
        const data = prices.map(price => price[1]);

        lineChart.data.labels = labels;
        lineChart.data.datasets[0].data = data;
        lineChart.update();
    }

    // Add event listener for table row click with debounce
    document.querySelectorAll('#cryptoTable tbody tr').forEach(row => {
        row.addEventListener('click', debounce(async function () {
            const selectedCoin = this.getAttribute('data-coin');
            const data = await fetchCryptoData(); // Fetch the latest data
            updateCharts(selectedCoin, data); // Update bar chart with selected coin's data

            // Fetch and update line chart with historical data
            const historicalPrices = await fetchHistoricalData(selectedCoin);
            updateLineChart(historicalPrices);
        }, 500)); // 500ms debounce
    });

    fetchCryptoData();

    // Fetch current volume data for multiple coins
    async function fetchCurrentVolumeData() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana&vs_currencies=usd&include_24hr_vol=true');
            const data = await response.json();
            console.log('Current volume data:', data); // Debug: Log current volume data
            return data;
        } catch (error) {
            console.error('Error fetching current volume data:', error);
            return {};
        }
    }

    fetchCurrentVolumeData().then(volumeData => {
        // Ensure the chart container exists
        if (!document.getElementById('drilldownChart')) {
            console.error('Chart container not found');
            return;
        }

        // Display volume data in a drilldown chart
        Highcharts.chart('drilldownChart', {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Cryptocurrency 24h Volume'
            },
            xAxis: {
                type: 'category'
            },
            yAxis: {
                title: {
                    text: 'Volume (in billions)'
                }
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    borderWidth: 0,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y:.2f}B'
                    }
                }
            },
            series: [{
                name: 'Cryptocurrencies',
                colorByPoint: true,
                data: [{
                    name: 'Bitcoin',
                    y: volumeData.bitcoin.usd_24h_vol / 1e9,
                    drilldown: null
                }, {
                    name: 'Ethereum',
                    y: volumeData.ethereum.usd_24h_vol / 1e9,
                    drilldown: null
                }, {
                    name: 'Dogecoin',
                    y: volumeData.dogecoin.usd_24h_vol / 1e9,
                    drilldown: null
                }, {
                    name: 'Solana',
                    y: volumeData.solana.usd_24h_vol / 1e9,
                    drilldown: null
                }]
            }],
            drilldown: {
                series: [] // No drilldown data for now
            }
        });
    });

    // Update the table and bar chart every 2 seconds
    setInterval(async () => {
        const data = await fetchCryptoData();
        if (data) {
            populateTable(data);
            updateCharts(null, data);
        }
    }, 60000);
});

