// Leaflet map setup
var map = L.map('map', {
  center: [41.2033, -77.1945],
  zoom: 7
});

var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(map);


///////////////////////////////////////////////
/// GLOBAL VARIABLES //////////////////////////
///////////////////////////////////////////////

// Variables related to creating user points (markers):
var addressMarkerExists = false;
var dropMarkerExists = false;
var userPoint;
var marker;
var drawnLayerID;


// variables related to SQL calls & active layers
var sql_Code_Layer;
var globalLayerValue;
var selectedRadioButton = "default";


// these are global variables that reference the user's options
// var anyMarkers;
// var districtLevelCalled;
// var yearCalled;


// LIKELY BEST TO SWITCH SOME OF THESE TO LEVELS OF ONE STATE VARIABLE
var userCurrentState = {
  'anyMarkers': false,
  'districtLevelCalled': "Congressional",
  'yearCalled': "2012",
  'name': "2011 Congressional Districts"
 };


///////////////////////////////////////////////
/// SETTING UP DATA QUERY FUNCTIONs ///////////
///////////////////////////////////////////////

// SADLY THIS SWITCH VERSION DID NOT WORK, MOVED TO AN IF/ELSE STATEMENT
// Possible District Layers:
// var possibleDistricts = {
//   "C": "Congressional",
//   "UH": "Upper_House",
//   "LH": "Lower_House"
// };
//
// var possibleYears = {
//   '2012': 2012,
//   '2001': 2001,
// };

// var findingSQL_DistrictYear = function(userState) {
//    switch (userState.districtLevelCalled && userState.yearCalled) {
//      case possibleDistricts.C &&  possibleYears["2001"] : return {dataName: "C_2001", sql_from: "pa_congressional_districts_2010"};
//      case possibleDistricts.C &&  possibleYears["2012"] : return {dataName: "C_2012", sql_from: "blocklevelfinalcongressionalplan21dec2011"};
//      case possibleDistricts.UH &&  possibleYears["2001"] : return {dataName: "UH_2001", sql_from: "pa_senate_districts_2001"};
//      case possibleDistricts.UH &&  possibleYears["2012"] : return {dataName: "UH_2012", sql_from: "finalsenateplan2012"};
//      case possibleDistricts.LH &&  possibleYears["2001"] : return {dataName: "LH_2001", ql_from: "pa_house_districts_2001_1"};
//      case possibleDistricts.LH &&  possibleYears["2012"] : return {dataName: "LH_2012", sql_from: "house2012final"};
//      default: return {};
//    }
//    console.log( {} );
//    return {};
//  };
 // reference re: multiple vairables in switch function: http://stackoverflow.com/questions/9235152/can-i-use-a-case-switch-statement-with-two-variables


 var findingSQL_DistrictYear = function(userState) {
   var sql_calls = {};
   if (userState.districtLevelCalled == "Congressional" && userState.yearCalled == 2012){
      sql_calls = {dataName: "2011 Congressional Districts", sql_from: "blocklevelfinalcongressionalplan21dec2011_1"};
    } else if(userState.districtLevelCalled == "Congressional" && userState.yearCalled == 2001){
      sql_calls = {dataName: "2002 Congressional Districts", sql_from: "pa_congressional_districts_2010"};
    }   else if(userState.districtLevelCalled == "Upper_House" && userState.yearCalled == 2012){
      sql_calls = {dataName: "2012 PA Senate Districts", sql_from: "finalsenateplan2012"};
    }   else if(userState.districtLevelCalled == "Upper_House" && userState.yearCalled == 2001){
      sql_calls = {dataName: "2001 PA Senate Districts", sql_from: "pa_senate_districts_2001_1"};
    }   else if(userState.districtLevelCalled == "Lower_House" && userState.yearCalled == 2012){
    sql_calls = {dataName: "2012 PA House Districts", sql_from: "house2012final_1"};
  }   else if (userState.districtLevelCalled == "Lower_House" && userState.yearCalled == 2001){
     sql_calls = {dataName: "2001 PA House Districts", sql_from: "pa_house_districts_2001_1"};
   } else {console.log("This dataset cannot be displayed");}
   console.log("sql output from sql if else statement", sql_calls );
   return sql_calls;
 };



// District Carto SQL-Call Function:
var helperSQL = "SELECT * FROM" + " ";

var sql_Call_Function = function(sqlCall) { //, dataNameforLater
  console.log("sqlCall variable in function", sqlCall);
  // console.log("dataNameforLater variable in function", dataNameforLater);
  console.log("what will be the sql call in function", helperSQL + sqlCall);
  console.log("sql_Code_Layer", sql_Code_Layer);
  // removing existing map layers
  // if (sql_Code_Layer) {map.removeLayer(sql_Code_Layer);} else {} //any layers created through the same sql function
  // if (initialSelectedData) {map.removeLayer(initialSelectedData);} else {}// any layers created by the initial call

if (globalLayerValue) {map.removeLayer(globalLayerValue);} else {}// any layers created by the initial call

  //setting the sql call to carto
  sql_Code_Layer = cartodb.createLayer(map, {
    user_name: 'laurenpr',
    type: 'cartodb',
    legends:true,
    sublayers: [{
      sql: helperSQL + sqlCall,
      cartocss: "#layer {  polygon-fill: #e1aa28;  polygon-opacity: 0.9;  line-width: 1;  line-color: #ffffff;  line-opacity: 0.5;}",
      // cssCall,
  }]
}, {https: true,})
  .done(function(data) {
    console.log("data as called in the SQL function", data);
    globalLayerValue = data;
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
  .addTo(map);

  console.log("new sql query", sql_Code_Layer);
  return sql_Code_Layer;
};


///////////////////////////////////////////////
/// HANDLING MARKERS //////////////////////////
///////////////////////////////////////////////

var filterFunction_MarkerZoom = function(){
  // Only run this marker filter if there is a marker on the map
  if (addressMarkerExists === true || dropMarkerExists === true){

    // call the global html marker that should have any current marker's lat & lng
    var latitude = $('#lat').val();
    var longitude = $('#lng').val();
    console.log("lat, lng", latitude, longitude);


    // query the current userState
    var sql_variables = findingSQL_DistrictYear(userCurrentState);
    console.log("sql_variables from marker", sql_variables);

    // console.log("sql_variables from marker - dataName", sql_variables.dataName);
    // var dataname_currentlayer = sql_variables.dataName;

    visibleLayer = globalLayerValue.getSubLayer(0);
    console.log("visble layer", visibleLayer);

    // Fit map to data bounds - decided not to include this as it makes it harder to then click on another location.
    // perhaps in the future it would be nice to include if there were more chart and things that appeared for each district.

    visibleLayer.setCartoCSS("#layer {polygon-fill: #4abdac;  polygon-opacity: 0.9;  polygon-gamma: 0.5;  line-color: #FFF;  line-width: 1;  line-opacity: 0.5;  line-comp-op: soft-light}" );
    console.log("changed css with address marker");

    console.log("sql_variables from address marker - sql_from", sql_variables.sql_from);
    visibleLayer.setSQL("SELECT p.* FROM " + sql_variables.sql_from +" AS p  WHERE ST_Contains (p.the_geom, ST_SetSRID(ST_Point("+ longitude +", "+ latitude +"),4326))");
    console.log("changed set SQL with address marker");

  } else {}

};

///////////////////////////////////////////////
/// SETTING UP VISUAL FUNCTION ////////////////
///////////////////////////////////////////////

var showingCorrectLegend = function() {
  if (selectedRadioButton == "default"){
    $("#legend_districts").show();
    $("#legend_Party").hide();
    $("#legend_fillerVariable").hide();
  } else if (selectedRadioButton == "gerrymanderingFillerVariable"){
    $("#legend_districts").hide();
    $("#legend_Party").hide();
    $("#legend_fillerVariable").show();
  } else if (selectedRadioButton == "party"){
    $("#legend_districts").hide();
    $("#legend_Party").show();
    $("#legend_fillerVariable").hide();
  } else {
    $("#legend_districts").show();
    $("#legend_Party").hide();
    $("#legend_fillerVariable").hide();
  }
};

var findingSQL_CSSColor = function(radioID) {
  var sql_calls = {};
  if (radioID == "party"){
     sql_calls = {columnColorCSS: "ramp([party], (#374C70, #9D1309), ('D', 'R'), '='"};
  } else if (radioID == "gerrymanderingFillerVariable"){
    sql_calls = {columnColorCSS: "ramp([leg_distri], (#ffffd4, #fed98e, #fe9929, #d95f0e, #993404), quantiles"};
  }
  //more values would be added here if I had actually finished the gerrymandering analysis
  else {console.log("This variable cannot be displayed");}
  console.log("sql output from sql if else statement", sql_calls );
  return sql_calls;
};

var function_updateCSS = function(specificCSS){

    visibleLayer = globalLayerValue.getSubLayer(0);
    console.log("visible layer", visibleLayer);

    // update the Carto css
    visibleLayer.setCartoCSS("#layer { polygon-fill:" + specificCSS + "); line-width: 1; line-color: #FFF; line-opacity: 0.5; }" );
    console.log("changed css with radio button");

};


///////////////////////////////////////////////
// THIS IS WHERE THE DOCUMENT IS EVOKED
///////////////////////////////////////////////

$(document).ready(function() {


///////////////////////////////////////////////
/// INITIAL SQL QUERY TO MAKE START-UP MAP ////
///////////////////////////////////////////////

// initial select "call down" of data, setting defaults
var initialSQL = cartodb.createLayer(map, {
    user_name: 'laurenpr',
    type: 'cartodb',
    legends:true,
    sublayers: [{
      //change your sql below
      sql: "SELECT * FROM blocklevelfinalcongressionalplan21dec2011_1",
      //change your cartocss below. you can copy it from the CartoDB Editor and remove the line breaks.
      cartocss: "#layer {  polygon-fill: #e1aa28;  polygon-opacity: 0.9;  polygon-gamma: 0.5;  line-color: #FFF;  line-width: 1;  line-opacity: 0.5;  line-comp-op: soft-light;}"
  }]
}, {https: true,})
  .done(function(data) {
    console.log("this comes from the initial SQL Call", data);
    globalLayerValue = data;
    console.log("data as iniitally called", data);
  })
  .error(function(errors) {
    // errors contains a list of errors
    console.log("errors:" + errors);
  })
  .addTo(map);

  $('#datasetName').text("2011 Congressional Districts");


///////////////////////////////////////////////
/// THIS IS THE OPTION TO DRAG IN A MARKER ////
///////////////////////////////////////////////

  // Leaflet draw setup
  var drawnItem = new L.FeatureGroup();
  map.addLayer(drawnItem);

  //  // Initialise the draw control and pass it the FeatureGroup of editable layers
  var drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItem
    },
    draw: {
      rectangle: false,
      polyline: false,
      polygon: false,
      circle: false,
      marker: true
    }
  });


  // var drawnLayerID;
  map.addControl(drawControl);
  map.on('draw:created', function (e) {
    console.log("dropMarkerExists BEFORE", dropMarkerExists);
    if (addressMarkerExists === true){map.removeLayer(marker);} else {} //removes any existing points created by address geolocation

    var type = e.layerType;
    var layer = e.layer;
    // console.log('draw created:', e);

    if (type === 'marker') {
      $('#lat').val(layer._latlng.lat);
      $('#lng').val(layer._latlng.lng);
      // console.log(layer._latlng.lat);
      // console.log(layer._latlng.lng);

    }

    // I prefer map.flyTo but this does not appear to be supported with carto in this iteration (planned adition from what I was reading)
    map.panTo(new L.LatLng(layer._latlng.lat, layer._latlng.lng));
    dropMarkerExists = true;
    console.log("dropMarkerExists AFTER", dropMarkerExists);
    filterFunction_MarkerZoom();


    // if (drawnLayerID) { map.removeLayer(map._layers[drawnLayerID]);
    // }

    map.addLayer(layer);
    drawnLayerID = layer._leaflet_id;
    console.log("layer._leaflet_id", layer._leaflet_id);
  });


  ///////////////////////////////////////////////
  /// THIS IS THE OPTION TO TYPE IN A ADDRESS////
  ///////////////////////////////////////////////

  /* Every time a key is lifted while typing in the #address input, disable
   * the #calculate button if no text is in the input
   */

  $('#address').keyup(function(e) {
    if ($('#address').val().length === 0) {
      $('#calculate').attr('disabled', true);
    } else {
      $('#calculate').attr('disabled', false);
    }
  });

  // click handler for the "calculate" button
  $("#calculate").click(function(e) {
    var address = $('#address').val();
    console.log(address);

    // $.ajax("https://search.mapzen.com/v1/search?api_key=mapzen-wQZCNQv&text="+address+"&focus.point.lat=39.952583&focus.point.lon=-75.1652&boundary.country= USA").done(
    $.ajax("http://search.mapzen.com/v1/search?api_key=mapzen-wQZCNQv&text="+address+"&focus.point.lat=39.952583&focus.point.lon=-75.1652&size=1").done(
      function(mapInfoforAddress) {
        console.log("map info from ajax", mapInfoforAddress);
        var userPoint = mapInfoforAddress.features[0].geometry; // returns the first point on the list of potential answers

        // Cleaning up any existing markers
        // if (typeof(marker)!=='undefined'){map.removeLayer(marker);} else {} //removes any existing points created by address geolocation
        if (addressMarkerExists === true){map.removeLayer(marker);} else {} //removes any existing points created by address geolocation
        if (dropMarkerExists === true) {map.removeLayer(map._layers[drawnLayerID]);} else {} // removes any points created by dragging over a marker

// THERE IS AN ERROR THAT ARISES WHEN YOU CREATE A DRAG, THEN ADDRESS MARKER, THEN DRAG MARKER AGAIN
// (WON'T GO BACK TO ADDRESS MARKER), IT GIVES THIS ERROR:
// "cartodb.js:7 Uncaught TypeError: Cannot read property '_leaflet_id' of undefined"

        // creating a new marker & setting global marker variable to true
        marker = L.marker([userPoint.coordinates[1] , userPoint.coordinates[0]]).addTo(map);
        map.panTo(new L.LatLng(userPoint.coordinates[1], userPoint.coordinates[0]));
        addressMarkerExists = true;

        $('#lat').val(userPoint.coordinates[1]);
        $('#lng').val(userPoint.coordinates[0]);

        filterFunction_MarkerZoom();

      });
    });

    ///////////////////////////////////////////////////////////////////////
    /// THIS IS HOW THE APP RESPONDES TO FILTERING DATA ON BUTTON CLICKS //
    ///////////////////////////////////////////////////////////////////////

    var activeTimelineButton;
    console.log("1st call activeTimelineButton", activeTimelineButton);

    // layer.on('click', function (event)
    $("#timeline_buttons").on('click', function () {
    // note: .on('click') seems to work better than .click for the timeline buttons, not sure why...
    // $("#timeline_buttons").click(function() {
      console.log("button clicked!");
      console.log("before timeline click", userCurrentState);
      // first find which button was clicked
      var clickedBtGroup_timeline = $('timeline_buttons').each(function(){
          $(this);
      });
      console.log("clickedBtGroup_timeline", clickedBtGroup_timeline);
      activeTimelineButton = clickedBtGroup_timeline.context.activeElement.id;
      console.log("activeTimelineButton", activeTimelineButton);

      // then update global relevant variable(s) (userState)
      userCurrentState.yearCalled = activeTimelineButton;
      console.log("after timeline click", userCurrentState);

      // second, evoke carto SQL based on filter parameters
      var sql_variables = findingSQL_DistrictYear(userCurrentState);
      console.log("sql_variables from timeline", sql_variables);
      console.log("sql_variables from timeline - sql_from", sql_variables.sql_from);
      console.log("sql_variables from timeline - sqdataNamel_from", sql_variables.dataName);
      sql_Call_Function(sql_variables.sql_from);

      // finally update name of dataset in view
      $('#datasetName').text(userCurrentState.name = sql_variables.dataName);

      // update legend
      selectedRadioButton = "default";
      showingCorrectLegend();
    });


    var activeDistrictButton;

    console.log("1st call activeDistrictButton", activeDistrictButton);
    console.log("before district click", userCurrentState);

    $("#districtlevel_buttons").click(function() {
      // first find which button was clicked
      var clickedBtGroup_district = $('radioButtons').each(function(){
          $(this);  //.context.activeElement.id
      });
      console.log("districtlevel_buttons", clickedBtGroup_district);
      activeDistrictButton = clickedBtGroup_district.context.activeElement.id;
      console.log("activeDistrictButton", activeDistrictButton);

      // then update global relevant variable(s) (userState)
      userCurrentState.districtLevelCalled = activeDistrictButton;
      console.log("after district click", userCurrentState);


      // second, evoke carto SQL based on filter parameters
      var sql_variables = findingSQL_DistrictYear(userCurrentState);
      console.log("sql_variables from district", sql_variables);
      console.log("sql_variables from district - sql_from", sql_variables.sql_from);
      console.log("sql_variables from district - sqdataNamel_from", sql_variables.dataName);
      sql_Call_Function(sql_variables.sql_from);

      // finally update name of dataset in view
      $('#datasetName').text(userCurrentState.name = sql_variables.dataName);

      // update legend
      selectedRadioButton = "default";
      showingCorrectLegend();

    });

    ////////////////////////////////////////////////////////////////////
    /// THIS IS THE OPTION TO CHANGE THE GERRYMANDERING CSS ////////////
    ////////////////////////////////////////////////////////////////////

    $("input[name='gerrymandering']").change(function(){
      console.log("something happened");
      selectedRadioButton = $('input[name=gerrymandering]:checked').val();
      console.log("radio button was clicked - version 1", selectedRadioButton);

      var newCSS = findingSQL_CSSColor(selectedRadioButton);
      console.log("potentially new css", newCSS.columnColorCSS);
      function_updateCSS(newCSS.columnColorCSS);
      console.log("did this function run??");

      showingCorrectLegend();
    });

});
