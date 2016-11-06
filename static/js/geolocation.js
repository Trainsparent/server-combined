function getInitialLocation(){
            $.get("https://huxley.apphb.com/crs", function (data, status) {
                var dropdown = document.getElementById("nearestStation");
                while (dropdown.hasChildNodes()) {
                    dropdown.removeChild(dropdown.lastChild);
                }
                for (var i = 0; i < data.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = data[i].crsCode;
                    opt.textContent = data[i].stationName + " (" + data[i].crsCode + ")";
                    dropdown.appendChild(opt);
                }
            });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, function () {
            $.get("https://huxley.apphb.com/crs", function (data, status) {
                var dropdown = document.getElementById("nearestStation");
                while (dropdown.hasChildNodes()) {
                    dropdown.removeChild(dropdown.lastChild);
                }
                for (var i = 0; i < data.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = data[i].crsCode;
                    opt.textContent = data[i].stationName + " (" + data[i].crsCode + ")";
                    dropdown.appendChild(opt);
                }
            });
        });
    }
}
function showPosition(position) {
    $.get("https://data.gov.uk/data/api/service/transport/naptan_railway_stations/nearest?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude
        , function (data, status) {
            var dropdown = document.getElementById("nearestStation");
            while (dropdown.hasChildNodes()) {
                    dropdown.removeChild(dropdown.lastChild);
                }
            for (var i = 0; i < data.result.length; i++) {
                var opt = document.createElement("option");
                opt.value = data.result[i].crscode;
                opt.textContent = data.result[i].stationname + " (" + data.result[i].crscode + ")";
                dropdown.appendChild(opt);
            }
            populateTable(data.result[0].crscode);
        });

}