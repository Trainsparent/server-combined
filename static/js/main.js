function onloadPage(){
    getInitialLocation();
    populateTable("vic");
    gethist('CBG','LST','2016-10-10 08:08','2016-11-06 10:08')
    getPrediction('CBG', 'LST', '2016-11-01 <12></12>:35')
}