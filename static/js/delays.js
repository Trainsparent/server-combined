function getPrediction(loc_from, loc_to, datetime) {
    var posting = $.get('/predict', {'from_loc':loc_from,'to_loc':loc_to,'on_date':datetime});
    posting.done(function( data ) {
        console.log(data)
    });
}

function gethist(loc_from, loc_to, on_date, to_date) {
    var posting = $.get('/hist', {'from_loc':loc_from,'to_loc':loc_to,'on_date':on_date,'to_date':to_date});
    posting.done(function( data ) {
        console.log(data)
    });
}

function getDelays(from, to, time) {
    var date = new Date('2000', '01', '01', time.substring(0, 2), time.substring(2, 4), '00');
    var metricsURL = "https://hsp-prod.rockshore.net/api/v1/servicemetrics";
    var earlierDate = new Date(date.getTime() - 30 * 60000);
    var laterDate = new Date(date.getTime() - 30 * 60000);
    var earlierDateString = pad(earlierDate.getHours, 2) + pad(earlierDate.getMinutes, 2);
    var laterDateString = pad(laterDate.getHours, 2) + pad(laterDate.getMinutes, 2);
    var metricsJSON = { "from_loc": from, "to_loc": to, "from_time": earlierDateString, "to_time": laterDateString, "from_date": "2015-11-01", "to_date": "2016-11-01", "days": "WEEKDAY" };

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", metricsURL, true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.setRequestHeader("Authorization", "Basic YmVuLm94bGV5QGdtYWlsLmNvbTo2YU1eT2sjbldWITYxcXJD");
    xmlhttp.onreadystatechange = function () { //Call a function when the state changes.
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

            var json = JSON.parse(xmlhttp.responseText);
            getDelayTimes(from, json);
        }
    };
    xmlhttp.send(metricsJSON);

}

function getDelayTimes(from, json) {
    //{"header":{"from_location":"BTN","to_location":"VIC"},"Services":[{"serviceAttributesMetrics":{"origin_location":"BTN","destination_location":"VIC","gbtt_ptd":"0712","gbtt_pta":"0823","toc_code":"GX","matched_services":"22","rids":["201607013361753","201607043443704","201607053476745","201607063509720","201607073542776","201607083576104","201607113655905","201607123688803","201607133721523","201607143753853","201607153786784","201607183867325","201607193900306","201607203933268","201607213966380","201607223999497","201607254080396","201607264113381","201607274146318","201607284179251","201607294212242","201608014293529"]},"Metrics":[{"tolerance_value":"0","num_not_tolerance":"5","num_tolerance":"17","percent_tolerance":"77","global_tolerance":true}]},{"serviceAttributesMetrics":{"origin_location":"BTN","destination_location":"VIC","gbtt_ptd":"0729","gbtt_pta":"0839","toc_code":"GX","matched_services":"22","rids":["201607013361763","201607043443714","201607053476755","201607063509730","201607073542786","201607083576113","201607113655914","201607123688812","201607133721532","201607143753862","201607153786793","201607183867334","201607193900315","201607203933277","201607213966389","201607223999506","201607254080406","201607264113391","201607274146328","201607284179261","201607294212252","201608014293539"]},"Metrics":[{"tolerance_value":"0","num_not_tolerance":"7","num_tolerance":"15","percent_tolerance":"68","global_tolerance":true}]},{"serviceAttributesMetrics":{"origin_location":"BTN","destination_location":"VIC","gbtt_ptd":"0744","gbtt_pta":"0855","toc_code":"GX","matched_services":"22","rids":["201607013361777","201607043443727","201607053476769","201607063509743","201607073542799","201607083576126","201607113655926","201607123688825","201607133721544","201607143753874","201607153786806","201607183867346","201607193900328","201607203933289","201607213966401","201607223999519","201607254080418","201607264113404","201607274146340","201607284179273","201607294212265","201608014293551"]},"Metrics":[{"tolerance_value":"0","num_not_tolerance":"14","num_tolerance":"8","percent_tolerance":"36","global_tolerance":true}]}]}

    var detailsURL = "https://hsp-prod.rockshore.net/api/v1/serviceDetails";
    var ids = json.Services[0].serviceAttributesMetrics.rids;
    var delays = {};
    var index = 0;
    for (var i = 0; i < ids.length; i++) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", detailsURL, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.setRequestHeader("Authorization", "Basic YmVuLm94bGV5QGdtYWlsLmNvbTo2YU1eT2sjbldWITYxcXJD")
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var json = JSON.parse(xhr.responseText);
                var locs = json.serviceAttributesDetails.locations;

                for (var j = 0; j < locs.length; j++) {
                    if (locs[j].location === from) {
                        var actual_td = new Date('2000', '01', '01', locs[j].actual_td.substring(0, 2), locs[j].actual_td.substring(2, 4), '00');
                        var gbtt_ptd = new Date('2000', '01', '01', locs[j].gbtt_ptd.substring(0, 2), locs[j].gbtt_ptd.substring(2, 4), '00');
                        delays[index] = actual_td.getTime() - gbtt_ptd.getTime();
                        index++;
                    }
                }
                console.log(delays);
                console.log(json.email + ", " + json.password)
            }
        }
        xhr.send("{\"rid\":\"" + ids[i] + "\"}");
    }
    
    //{"serviceAttributesDetails":{"date_of_service":"2016-07-29","toc_code":"GX","rid":"201607294212242","locations":[{"location":"BTN","gbtt_ptd":"0712","gbtt_pta":"","actual_td":"0711","actual_ta":"","late_canc_reason":""},{"location":"PRP","gbtt_ptd":"0717","gbtt_pta":"0716","actual_td":"0717","actual_ta":"0715","late_canc_reason":""},{"location":"BUG","gbtt_ptd":"0727","gbtt_pta":"0726","actual_td":"0726","actual_ta":"0724","late_canc_reason":""},{"location":"HHE","gbtt_ptd":"0733","gbtt_pta":"0732","actual_td":"0734","actual_ta":"0732","late_canc_reason":""},{"location":"GTW","gbtt_ptd":"0749","gbtt_pta":"0747","actual_td":"0751","actual_ta":"0744","late_canc_reason":""},{"location":"VIC","gbtt_ptd":"","gbtt_pta":"0823","actual_td":"","actual_ta":"0823","late_canc_reason":""}]}}

}

function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length - size);
}