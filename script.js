// Initialize the map, centered on Melbourne
var map = L.map('map', {
    scrollWheelZoom: false,  // Disable scroll zoom
    zoomControl: true  // Keep zoom control buttons enabled
}).setView([-37.8136, 144.9631], 11.5);

// Add the CartoDB Positron tiles to the map (similar to Folium)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CartoDB'
}).addTo(map);

// Category color mapping
var categoryColors = {
    'BIRTH': '#63a3db',  // Blue
    'DEATH': '#f46868',  // Red
    'MARRIAGE': '#66cc66',  // Green
    'BAR MITZVAH': '#ffd700',  // Yellow
    'ENGAGEMENT': '#d8b0ff'  // Purple
};

var markers = {};  // To keep track of markers by their year
var timer = null;  // Holds reference to the interval for play/pause
var currentYear = 1935;  // Initial year

// Function to generate the popup HTML based on the category and data
function generatePopupHtml(category, row) {
    if (category === 'BIRTH') {
        return `
            <div style="font-family: Arial; font-size: 14px;">
                <b>Birth: ${row['Name']}</b><br>
                <i>Parents:</i> ${row['Parents']}<br>
                <i>Place of birth:</i> ${row['Location']}<br>
                <i>Date of notice:</i> ${row['Date']}<br>
            </div>
        `;
    } else if (category === 'DEATH') {
        return `
            <div style="font-family: Arial; font-size: 14px;">
                <b>Death: ${row['Name']}</b><br>
                <i>Place of death:</i> ${row['Location']}<br>
                <i>Date of notice:</i> ${row['Date']}<br>
            </div>
        `;
    } else if (category === 'BAR MITZVAH') {
        return `
            <div style="font-family: Arial; font-size: 14px;">
                <b>Bar Mitzvah: ${row['Name']}</b><br>
                <i>Parents:</i> ${row['Parents']}<br>
                <i>Bar mitzvah location:</i> ${row['Location']}<br>
                <i>Date of notice:</i> ${row['Date']}<br>
            </div>
        `;
    } else if (category === 'ENGAGEMENT') {
        return `
            <div style="font-family: Arial; font-size: 14px;">
                <b>Engagement: ${row['Name']}</b><br>
                <i>Parents:</i> ${row['Parents']}<br>
                <i>Fiance:</i> ${row['Fiance']}<br>
                <i>Address:</i> ${row['Location']}<br>
                <i>Date of notice:</i> ${row['Date']}<br>
            </div>
        `;
    } else { // MARRIAGE
        return `
            <div style="font-family: Arial; font-size: 14px;">
                <b>Marriage: ${row['Name']}</b><br>
                <i>Residence:</i> ${row['Address']}<br>
                <i>Wedding location:</i> ${row['Location']}<br>
                <i>Date of notice:</i> ${row['Date']}<br>
            </div>
        `;
    }
}

// Function to add points to the map
function addPointToMap(lat, lon, category, row) {
    var popupHtml = generatePopupHtml(category, row);
    var marker = L.circleMarker([lat, lon], {
        color: categoryColors[category],
        fillColor: categoryColors[category],
        fillOpacity: 0.8,
        radius: 3  // Smaller radius
    }).bindPopup(popupHtml);

    // Store markers in an object based on their year for easy removal
    var year = new Date(row['Date']).getFullYear();
    if (!markers[year]) {
        markers[year] = [];
    }
    markers[year].push(marker);
}

// Function to parse CSV and extract data
function loadCSV(file, category) {
    Papa.parse(file, {
        download: true,
        header: true,
        complete: function(results) {
            results.data.forEach(function(row) {
                if (row['Coordinates'] && row['Date']) {
                    // Parse coordinates
                    var coords = row['Coordinates'].split(', ');
                    var lat = parseFloat(coords[0].trim());
                    var lon = parseFloat(coords[1].trim());

                    if (!isNaN(lat) && !isNaN(lon)) {
                        addPointToMap(lat, lon, category, row);
                    } else {
                        console.error(`Invalid coordinates: ${row['Coordinates']}`);
                    }
                } else {
                    console.error(`Missing coordinates or date in row: ${JSON.stringify(row)}`);
                }
            });
        },
        error: function(error) {
            console.error('Error loading CSV:', error);
        }
    });
}

// Load each dataset
loadCSV('data/births.csv', 'BIRTH');
loadCSV('data/deaths.csv', 'DEATH');
loadCSV('data/marriages.csv', 'MARRIAGE');
loadCSV('data/engagements.csv', 'ENGAGEMENT');
loadCSV('data/barmitzvah.csv', 'BAR MITZVAH');

// Function to remove all markers
function clearMap() {
    Object.keys(markers).forEach(function(year) {
        markers[year].forEach(function(marker) {
            map.removeLayer(marker);
        });
    });
}

// Function to update the map based on the current year and show points for two extra years
function updateMapForYear(year) {
    clearMap();  // Remove all markers

    // Show markers for the current year, and two years afterward
    for (var i = year; i <= year + 2; i++) {
        if (markers[i]) {
            markers[i].forEach(function(marker) {
                marker.addTo(map);
            });
        }
    }
}

// Function to update the year display
function updateYearDisplay(year) {
    document.getElementById('currentYear').innerText = year;
    currentYear = parseInt(year);
    updateMapForYear(currentYear);
}

// Function to animate the map by incrementing the year
function animatePointsByYear() {
    if (currentYear < 1960) {
        currentYear++;
        document.getElementById('dateSlider').value = currentYear;
        updateYearDisplay(currentYear);
    } else {
        pauseAnimation();  // Stop when reaching the last year
    }
}

// Function to start the animation
function playAnimation() {
    if (!timer) {
        timer = setInterval(animatePointsByYear, 1000);  // Change speed if needed
    }
}

// Function to pause the animation
function pauseAnimation() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// Initialize the map with points for the initial year
updateMapForYear(currentYear);


