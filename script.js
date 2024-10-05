// Initialize the map, centered on Melbourne
var map = L.map('map', {
    scrollWheelZoom: false,  // Disable scroll zoom
    zoomControl: true,
    zoomSnap: 0.01,          // Allow finer control over zoom (fractional zooms)
    zoomDelta: 0.01          // Set the smallest zoom increment// Keep zoom control buttons enabled
}).setView([-37.8506, 144.9631], 11.3);

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

var markers = {};  // To keep track of markers by their date
var timer = null;  // Holds reference to the interval for play/pause
var currentDate = new Date("1935-01-01");  // Initial date

// Convert date to timestamp and set slider bounds
const startDate = new Date("1935-01-01").getTime();
const endDate = new Date("1959-12-31").getTime();
document.getElementById('dateSlider').min = startDate;
document.getElementById('dateSlider').max = endDate;
document.getElementById('dateSlider').value = startDate;

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

function addPointToMap(lat, lon, category, row) {
    var popupHtml = generatePopupHtml(category, row);
    var marker = L.circleMarker([lat, lon], {
        color: categoryColors[category],
        fillColor: categoryColors[category],
        fillOpacity: 0.8,
        radius: 2  // Smaller radius
    }).bindPopup(popupHtml);

    // Store markers in an object based on their date for easy removal
    var eventDate = new Date(row['Date']).getTime();  // Parse date to timestamp
    console.log(`Adding marker at ${lat}, ${lon} for date ${row['Date']}`);  // Debug log for coordinates
    if (!markers[eventDate]) {
        markers[eventDate] = [];
    }
    markers[eventDate].push(marker);
}

// Function to load data and add markers from CSV
function loadCSV(file, category) {
    Papa.parse(file, {
        download: true,
        header: true,
        complete: function(results) {
            results.data.forEach(function(row) {
                if (row['Coordinates'] && row['Date']) {
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
        }
    });
}

// Load data for all events
loadCSV('data/births.csv', 'BIRTH');
loadCSV('data/deaths.csv', 'DEATH');
loadCSV('data/marriages.csv', 'MARRIAGE');
loadCSV('data/engagements.csv', 'ENGAGEMENT');
loadCSV('data/barmitzvah.csv', 'BAR MITZVAH');

function clearMap() {
    Object.keys(markers).forEach(function(date) {
        markers[date].forEach(function(marker) {
            map.removeLayer(marker);
        });
    });
}

function updateMapForDate(date) {
    clearMap();

    var threeYearsAgo = new Date(date);
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    Object.keys(markers).forEach(function(dateKey) {
        var eventDate = new Date(parseInt(dateKey));
        if (eventDate >= threeYearsAgo && eventDate <= date) {
            console.log(`Showing marker for event on ${eventDate}`);  // Debug log for date filtering
            markers[dateKey].forEach(function(marker) {
                marker.addTo(map);
            });
        }
    });
}

// Function to update the date display
function updateDateDisplay(timestamp) {
    currentDate = new Date(parseInt(timestamp));
    document.getElementById('currentDate').innerText = currentDate.toISOString().split('T')[0];
    updateMapForDate(currentDate);
}

// Function to animate the map day by day
function animateMapByDay() {
    if (currentDate.getTime() < endDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        document.getElementById('dateSlider').value = currentDate.getTime();
        updateDateDisplay(currentDate.getTime());
    } else {
        pauseAnimation();  // Stop at the end
    }
}

// Function to start the animation
function playAnimation() {
    if (!timer) {
        timer = setInterval(animateMapByDay, 0.5);  // Adjust speed (~1 year per second)
    }
}

// Function to pause the animation
function pauseAnimation() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

// Initialize the map with points for the initial day
updateDayDisplay(0);  // Initialize the map to the first day (1935-01-01)


