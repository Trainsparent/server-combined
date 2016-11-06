function populateTable(station){
    populateTableImpl(station);
}

function populateTableImpl(station1) {
    
    var r = new XMLHttpRequest();
    r.open("GET", "https://huxley.apphb.com/all/"+station1+"/10?accessToken=2eddeea6-ec45-408b-99cb-8ef5b1d3d6cb", true);
    r.onreadystatechange = function () {
        if (r.readyState != 4 || r.status != 200) return;
        var resp = JSON.parse(r.response).trainServices;
        var timetable = document.getElementById("timetable");
        while (timetable.hasChildNodes()) {
            timetable.removeChild(timetable.lastChild);
        }
        //getDelays(station1,resp[0].crs,resp[0].std);
        for (var i = 0; i < resp.length; i++) {
            var div = document.createElement("div");
            div.className = "bs-callout bs-callout-success";
            div.id = "callout-navbar-mobile-caveats";
            var row = document.createElement("div");
            row.className = "row";
            var col1 = document.createElement("div");
            col1.className = "col-sm-6 col-md-3";
            var col2 = document.createElement("div");
            col2.className = "col-sm-6 col-md-9";
            var header = document.createElement("h4");
            header.innerText = resp[i].origin[0].locationName + " to " + resp[i].destination[0].locationName;
            var para = document.createElement("p");
            para.innerText = "Scheduled arrival time: "+resp[i].sta + " Estimated arrival time: "+resp[i].eta;
            if (!(resp[i].sta===resp[i].eta)&&(!(resp[i].eta==="On time"))){
                if (resp[i].eta==="Cancelled"){
                    div.className = "bs-callout bs-callout-danger";
                } else {
                    div.className = "bs-callout bs-callout-warning";
                }
                
            }
            var graphContainer = document.createElement("div");

            var graph = document.createElement("canvas");
            graphContainer.style.width = "100%";
            graphContainer.style.height = "400px";
            col1.appendChild(header);
            col1.appendChild(para);
            graphContainer.appendChild(graph);
            col2.appendChild(graphContainer);
            row.appendChild(col1);
            row.appendChild(col2);
            div.appendChild(row);
            timetable.appendChild(div);
            var myChart = new Chart(graph, {
                type: 'line',
                data: {
                    labels: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],
                    datasets: [{
                        label: 'Minutes Delayed',
                        data: [0,5,9,12,14,15,14,13,12,11.5,9,7,5,2.5,0],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }
    };
    r.send();
}