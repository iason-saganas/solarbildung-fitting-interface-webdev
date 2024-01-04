import wixWindow from 'wix-window';
import wixWindowFrontend from 'wix-window-frontend';

import {
    checkDemoKey,
    grabDemoDataFromMasterCSV
} from 'backend/custom-media-backend'

import {
    fetchPowerAndTimeDataForDay_VictronSolution,
    postHttpRequest,
    findBasicSchoolInformationFromID_VictronSolution,
    getAllEnabledDates_VictronSolution
} from 'backend/custom-http'

import {
    zip,
    create_latex_param,
    format_time,
    format_time_short,
    convert_time_string_to_int,
    format_time_short_with_slash,
    calculate_month_difference,
    add_months_to_date,
    convert_string_to_unix_timestamp,
    swap_elements_of_arr_based_on_index,
    create_geogebra_command_string
} from 'public/graphs-custom-helper-functions.js'

import {
    global_information_window_log_in_success,
    global_information_window_log_in_failure,
    checkmark,
    crossmark,
    show_loader,
    hide_loader,
    change_graph_style_to_bar,
    change_graph_style_to_point,
    reset_results_from_fit_and_hide_texts,
    initialize_fit_results_texts,
    show_consumption_fit_dials,
    hide_consumption_fit_dials,
    wipe_interface_clean,
    hide_weekly_dials_show_daily_dials,
    hide_daily_dials_show_weekly_dials
} from 'public/graphs-element-manipulation-functions.js'



/**

 N A M I N G   C O N V E N T I O N S

 -   Small helper functions from the file 'public/graphs-custom-helper-functions.js':       snake_case
 -   Stylistic function from the file 'public/graphs-element-manipulation-functions.js':    snake_case
 -   File names and paths:                                                                  kebab-case
 -   Important backend functions (file path starts with 'backend/...'):                     camelCase
 -   Mutable global variables:                                                              camelCase
 -   Variables and constants:                                                               camelCase
 -   Functions that represent data solutions specific to the customer are
 distinguished by and underscore and then the name, e.g.
 'getAllEnabledDates_VictronSolution'.


 */


/**

 D E F I N I T I O N   O F   G L O B A L   V A R I A B L E S

 This is the information that gets pushed into the pages html interface. For example:
 Upon choosing a date (globalYArray, globalXArray) or upon executing a fit (globalGenerationOptimalParametersArray).
 */

var globalXArray = []                // timestamp array. looks like [ 1212415315, 12124153113, 1212415316, ... ]
var globalYArray = []                // generation array. looks like [ [ 1, 2, 3, 4, ... ] ]
var globalZArray = []               // consumption array. looks like [ [ 1, 2, 3, 4, ... ] ]
var globalGenerationOptimalParametersArray = []          // generation parameters array
var globalConsumptionOptimalParametersArray = []  // consumption parameters array
var useDemoData = false               // inputted ID is equal to the demo ID => true, else false
var existsNonTrivialZData = false   // did the data solution (VRM API / demo data) return consumption data? If no, show 'inject generic consumption data?' option
var calendarMode = 'daily'             // One of 'daily', 'weekly'. Determines whether daily data or weekly aggregates are shown. Is updated via the 'CalendarModeTool' element.
var customerSolution = 'Victron'


/**

 I M P O R T A N T   N A M E S ,  R E F E R E N C E S
 */

/**
 Python Fitting Script:             :   The python script sitting at https://iason2ctrl.pythonanywhere.com/dummyAPI (as of 22.06.2023)
 that uses scipy to find the best fit parameters for some chosen mathematical
 function and some PV Data
 ErzeugungsPopt                     :   Those parameters that are returned by the python fitting script, fitting the
 PV-Generation data. Originate from popt,_ = sc.optimize.curve_fit( . . . ) .
 Html1                              :   The base html object in the wix page containing chart js code displaying all data and fits.
 Polynomial.js                      :   A reconstruct of the polynomial.js library by https://dongheenam.info/posts/polynomials-in-javascript/
 used in Html1 to render polynomial graphs. Is to be replaced a better version (Numerical errors
 for polynomials of degree 10 or higher)
 Victron Energy                     :   Refers to the victron energy "vrm" api, from which PV data is recovered.
 https://vrm.victronenergy.com/login
 Wix Velo Api                       :   This interface. Includes backend files.
 HTML interface                     :   Refers to the pure css and html objects on the webpage itself, e.g. the 'ChartJsDaily' (chart js plotter) object.
 ChartJsDaily                              :   The chart js plotter (pure html/css).
 Global information window          :   A custom-element-div that has a sticky position at the beginning of the page and displays various messages when needed.
 */



/*

                            B A S I C   F U N C T I O N S
    Important functions that cannot be pushed into backend or public files since they directly reference elements of the html interface of
    the current webpage.
*/





/*
 * Dependent on function 'returnPowerData(debug)', which needs to be on this code site.
 * Calls 'returnPowerData(debug)' and then posts queried time and generation data to 'ChartJsDaily' (chart js plotter) object.
 * @param   None
 * @return  None
 */
function pushGraphDataToPlotter(isDemo, chartJsElement){
    returnPowerData(false, isDemo, customerSolution).then(dictOfXYValues=>{
        if (!isDemo){
            chartJsElement.postMessage(["Time and generation data, non-demo.",dictOfXYValues])
        }
        else if (isDemo){
            const dictOfXYZValues = dictOfXYValues
            chartJsElement.postMessage(["Time, generation and consumption data, demo.",dictOfXYZValues])
        }
    })
}

/* NOTE OF 08.08.23: This workflow can obviously be reduced via directly sending the browser information to the 'ChartJsDaily' object
 * and it then executing the download directly instead of sending a message back to the wix velo api.
 * On ready this function listens to messages coming from the 'ChartJsDaily' object (chart js plotter). When there exists graph data in 'ChartJsDaily'
 * object, and the 'jpgButton' object was clicked, the function 'setDownloadJPGLink()' is activated, which orders the 'ChartJsDaily' object to post
 * back a base64 encoded image string onto the wix velo api, which is caught by this function. This function then determines whether the current browser
 * is chrome or non-chrome and communicates back to the 'ChartJsDaily' object, which then executes the download via a hot-link based on which browser is currently used.
 * @param   None
 * @return  None
 */
function getBase64data(){
    // check if base64 image data is already available
    $w("#ChartJsDaily").onMessage(event => {
        let receivedData = event.data;
        //const externalURL = myGetDownloadUrlFunction(receivedData)
        //externalURL.then((results)=>{$w('#jpgButton').link=results})
        // Created anchor element and bestow it with URi Link
        let userAgent = navigator.userAgent;
        if(userAgent.match(/chrome|chromium|crios/i)){
            $w("#ChartJsDaily").postMessage([receivedData,"Packet: Base64 image data, please download.","chrome"])}
        else {
            $w("#ChartJsDaily").postMessage([receivedData,"Packet: Base64 image data, please download.","non-chrome"])}
    });
}

/* The function that is activated on_click of the 'jpgButton' object. It orders the 'ChartJsDaily' object to post back a base64 image string
 * of the existing image data. The base64 string is sent to the function 'getBase64data()'.
 * @param   None
 * @return  None
 */
function setDownloadJPGLink(){
    $w("#ChartJsDaily").postMessage(["post base64 back to velo!","first callback"])
}

/*  The VRM Api query data function, catching time stamps and generation data for the current constraints on the web page (date, installation).
 *  Hides/shows necessary accessories.
 * @param   {bool}      debug                 :   If true, various debug statements are printed.
 * @return  {object}    DictOfXandYvalues     :   A dictionary object containing timestamps and generation (y-) values for the given date.
 */
function returnPowerData(debug, is_demo, customerSolution){
    $w("#copyGenPoptButton").hide()


    initialize_fit_results_texts($w("#EnergieKontrollErgebnis"), $w("#AbweichungDesIntegrals"), $w("#Nullstellen"), $w("#GrenzenFitintervall"))
    wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))

    const date = $w("#datePicker").value




    if (!is_demo && customerSolution==='Victron'){
        let YesterdayTimeStamp = date.getTime() - (1 * 86400000);
        let yesterDate = new Date(YesterdayTimeStamp);
        const installation_id = $w("#radioGroupInstallations").value
        // date format should be month day year for timestamp() function date.setDate(date.getDate() - 1)
        const correctedDateCurrent = (date.getMonth()+1).toString() + "/" + date.getDate().toString() + "/" + date.getFullYear().toString() + " " + "23:59:59"
        const correctedDateDayBefore = (yesterDate.getMonth()+1).toString() + "/" + yesterDate.getDate().toString() + "/" + yesterDate.getFullYear().toString() + " " + "23:59:59"



        return fetchPowerAndTimeDataForDay_VictronSolution(debug,installation_id,convert_string_to_unix_timestamp(correctedDateDayBefore),convert_string_to_unix_timestamp(correctedDateCurrent)).then(DictOfXandYvalues=>{
            const lengthOfPowerData = Object.keys(DictOfXandYvalues).length


            if (lengthOfPowerData<50 || DictOfXandYvalues=="NoData" || Math.max(...Object.values(DictOfXandYvalues))<7){
                /*$w("#errorGroup").show()
                $w("#HTTPupdateBox").hide()*/
                //console.log("The returned data list is empty or too small. It is set manually to []")
                return []
            }
            else {
                /*$w("#htmlLoadingCircle").postMessage(["click toggle button"])
                setTimeout(()=>{ $w("#HTTPupdateBox").hide() },1000);
                setTimeout(()=>{ $w("#htmlLoadingCircle").postMessage(["untoggle"]) },1200);*/
                globalXArray.length = 0
                globalYArray.length = 0
                for (const key of Object.keys(DictOfXandYvalues)){globalXArray.push(+key)}
                globalYArray.push(Object.values(DictOfXandYvalues))
                $w("#ChartJsDaily").postMessage(["UniversalXarrayUpdate",globalXArray.map(el=>convert_time_string_to_int(format_time(el)))])
                var csv = "Zeitstempel;"+"Leistung in Watt"+"\n"
                const XandYzip = zip([globalXArray.map(x=>'='+'"'+format_time_short(x).toString()+'"'),globalYArray[0]])


                for (const i of XandYzip){
                    csv += i.join(';')
                    csv += "\n"
                }
                var csvFile = new Blob([csv], {type: "text/csv"});
                $w("#DownloadCSVhtml").postMessage(["Store csv blob",csvFile])
                console.log("dict of x and y values -->", DictOfXandYvalues)
                return DictOfXandYvalues
            }
        })
    }
    else if (is_demo){



        globalXArray.length = 0
        globalYArray.length = 0
        globalZArray.length = 0
        const date_in_correct_format = format_time_short_with_slash(convert_string_to_unix_timestamp(date))
        const month = date_in_correct_format.split("/")[1]


        return grabDemoDataFromMasterCSV(month).then(data => {

            const line_by_line_data = data.split("\n").map(el=>el.replace(/(\r\n|\n|\r)/gm, "")); // split data line by line and remove extra '\r' breaks
            for (const line of line_by_line_data){
                const timestamp_of_data = line.split(" ")[0]            // something like 01/05/2023 (day/month/year)

                if (timestamp_of_data==date_in_correct_format){

                    // the x data is this element
                    var xData_unedited = line.split(",")[0]        // but 'convert_string_to_unix_timestamp()' needs (month/day/year) so swap month and day
                    xData_unedited = xData_unedited.split("")
                    swap_elements_of_arr_based_on_index(xData_unedited, 0, 3)
                    swap_elements_of_arr_based_on_index(xData_unedited, 1, 4)
                    const xData_edited = xData_unedited.join("")
                    const xData = convert_string_to_unix_timestamp(xData_edited)
                    const yData = line.split(",")[1]
                    const y2Data = line.split(",")[2]   // consumption data
                    globalXArray.push(xData)
                    globalYArray.push(yData)
                    globalZArray.push(y2Data)
                }
            }

            globalYArray = [globalYArray] // put another set of brackets around anything that represents power values (convention)
            globalZArray = [globalZArray]

            $w("#ChartJsDaily").postMessage(["UniversalXarrayUpdate",globalXArray.map(el=>convert_time_string_to_int(format_time(el)))])

            let language = wixWindowFrontend.multilingual.currentLanguage; // "en" or "es" or "de"
            if (language=="es"){
                var csv = "Registró temporal;"+"Generacíon de energía en vatios;"+"Consumo de energía en vatios"+"\n"
            }
            else if (language=="en"){
                csv = "Timestamp;"+"Generation power in Watts;"+"Consumption power in Watts"+"\n"
            }
            else if (language=="de"){
                var csv = "Zeitstempel;"+"Erzeugung in Watt;"+"Verbrauch in Watt"+"\n"
            }

            const YandY2zip = zip([globalYArray[0], globalZArray[0]])

            const XandYAndY2zip_for_csv = zip([globalXArray.map(x=>'='+'"'+format_time_short(x).toString()+'"'), YandY2zip])
            const XandYAndY2zip = zip([globalXArray, YandY2zip])

            for (const i of XandYAndY2zip_for_csv){
                csv += i[0]+";"+i[1][0]+";"+i[1][1]
                csv += "\n"
            }
            var csvFile = new Blob([csv], {type: "text/csv"});
            $w("#DownloadCSVhtml").postMessage(["Store csv blob",csvFile])

            const map_for_dict_creation = new Map(XandYAndY2zip)
            const DictOfXandYandY2values = Object.fromEntries(map_for_dict_creation);


            return DictOfXandYandY2values
        })
    }
}

function update_calendar_based_on_mode(){
    // pass
}




/*

                            L I S T E N E R   F U N C T I O N S

*/



$w.onReady(function () {

    /*

                            S T Y L I S T I C   M A N I P U L A T I O N S
    */

    // since not default, hide the weekly and show the daily dials
    hide_weekly_dials_show_daily_dials($w("#ColumnStripGenerationWeekly"),$w("#ColumnStripConsumptionWeekly"),$w("#ColumnStripGenerationDaily"),$w("#ColumnStripConsumptionDaily"))

    /*

                            H A N D L I N G   O F   C U S T O M   T O O L B A R   C H O I C E S
    The custom toolbar is made up of the elements: ['CalendarModeTool', 'ExportDataTool', ]. If a choice is made, i.e. a dropdown selected
    from any of those elements, a custom event 'DropdownChoice' is dispatched which is registered here and its value (the index of the selected
    element) is read and handled.
    */

    $w('#CalendarModeTool').on('DropdownChoice', (data) => {
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice == 0){
            calendarMode = 'daily'
            hide_weekly_dials_show_daily_dials($w("#ColumnStripGenerationWeekly"),$w("#ColumnStripConsumptionWeekly"),$w("#ColumnStripGenerationDaily"),$w("#ColumnStripConsumptionDaily"))
            // function that needs to be implemented :update_calendar_based_on_mode(calendarMode)
        }
        else if (index_of_selected_choice == 1){
            calendarMode = 'weekly'
            hide_daily_dials_show_weekly_dials($w("#ColumnStripGenerationWeekly"),$w("#ColumnStripConsumptionWeekly"),$w("#ColumnStripGenerationDaily"),$w("#ColumnStripConsumptionDaily"))
            // update_calendar_based_on_mode(calendarMode)
        }
    })


    $w("#ExportDataTool").on('DropdownChoice', (data)=>{
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice == 0){
            download_JPG()
        }
        else if (index_of_selected_choice == 1){
            download_CSV()
        }
    })

    $w("#ChangeGraphTypeTool").on('DropdownChoice', (data)=>{
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice == 0){
            set_point_graph()
        }
        else if (index_of_selected_choice == 1){
            set_bar_graph()
        }
    })

    $w("#CopyToClipboardTool").on('DropdownChoice', (data)=>{
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice == 0){
            copy_parameter_list_generation()
        }
        else if (index_of_selected_choice == 1){
            copy_parameter_list_consumption()
        }
        else if (index_of_selected_choice == 2){
            copy_geogebra_code()
        }
    })




    $w("#optionOverviewGray").hide()            // Hide the overview option gray span, since the blue version is the default
    // $w("#errorGroup").hide()                    // Hide the error box
    $w("#radioGroupInstallations").disable();   // This is going to be enabled with the initialize_workspace function
    getBase64data();                            // This NEEDS to be here for the JPG communication to work properly!!

});


export function FitOptionButton_click(event) {



    $w("#optionOverviewGray").show()
    $w("#optionOverviewBlue").hide()
    $w("#OptionFitBlue").show()
    $w("#OptionFitGray").hide()

    $w("#ResultBox").show()
    $w("#FitButton").show()
    change_graph_style_to_point($w("#ChartJsDaily"))
}


export function OptionInformationButton_click(event) {



    $w("#optionOverviewGray").show()
    $w("#optionOverviewBlue").hide()
    $w("#OptionFitBlue").hide()
    $w("#OptionFitGray").show()

    $w("#ResultBox").hide()
    $w("#FitButton").hide()


}


export function FitButton_click(event) {

    $w("#HourGlassAnimationHTML").show()
    $w("#copyGenPoptButton").hide()
    //$w("#EnergieKontrollErgebnis").text = "."
    $w("#AbweichungDesIntegrals").text = "."
    $w("#Nullstellen").text = "."
    $w("#GrenzenFitintervall").text = "."
    $w("#functionFitTextHTML").postMessage(["Clear pre existing information!"])
    $w("#functionConsumptionFitTextHTML").postMessage(["Clear pre existing information!"])
    $w("#ParameterGenCodeHTML").postMessage(["Clear pre existing information!"])
    $w("#ParameterConsumptionCodeHTML").postMessage(["Clear pre existing information!"])
    //$w("#NumericalInstablityGroup").hide()

    // make the text fields that are filled with information once the python server responds with the fit information visible now
    //$w("#EnergieKontrollErgebnis").show()
    $w("#AbweichungDesIntegrals").show()
    $w("#Nullstellen").show()
    $w("#GrenzenFitintervall").show()


    var functionName = $w("#FunctionChoiceDropDown").value
    if (functionName=="polynomialFunctionOfDegreeN"){
        var polynomialDegree = $w("#PolynomGradSlider").value
    }
    else if(functionName=="constantFunction"){
        var polynomialDegree = 0
    }
    else if(functionName=="linearFunction"){
        var polynomialDegree = 1
    }
    else if(functionName =="quadraticFunction"){
        var polynomialDegree = 2
    }
    const use_consumption = $w("#FitConsumptionCheckBox").checked
    if (use_consumption){
        var polynomialDegreeOfConsumption = $w("#PolynomgradSliderVerbrauch").value
    }
    else{
        var polynomialDegreeOfConsumption = -1 // placeholder value. Not used since in this cases use_consumption==false. Also: clear existing consumption fits.
    }

    const yData = [globalYArray[0].map(el=>parseFloat(el))]  // again, its convention to put y values into additional brackets, the map functions ensures that no strings are passed but actual floats
    const xData = globalXArray.map(el=>convert_time_string_to_int(format_time(el)))
    const y2Data = [globalZArray[0].map(el=>parseFloat(el))] // consumption data

    var GesammelteParameter = {CallingFrom: "LiveSolarData", Debug : true, Function: functionName, PolynomialDegree : polynomialDegree, PolynomialDegreeOfConsumption : polynomialDegreeOfConsumption,
        XData : xData, YData : yData, Y2Data: y2Data, UseConsumption: use_consumption}

    postHttpRequest("https://iason2ctrl.pythonanywhere.com/dummyAPI",GesammelteParameter).then((HTTPresponse)=>{

        var language = wixWindowFrontend.multilingual.currentLanguage; // "en" or "es" or "de"

        $w("#HourGlassAnimationHTML").hide()
        console.log("message from fit server received:")
        console.log(HTTPresponse)
        const JSONresponse = JSON.parse(HTTPresponse)

        const numericalInstability = JSONresponse["warning_numerical_instability"].toString()
        const erzeugungsPOPT = Object.values(JSONresponse["generation_parameters"])
        if (JSONresponse["consumption_parameters"]!==null){
            var consumption_parameters = Object.values(JSONresponse["consumption_parameters"])
        }
        globalGenerationOptimalParametersArray.length=0
        globalGenerationOptimalParametersArray.push(erzeugungsPOPT) // so that copy to clipboard button can grab the data

        globalConsumptionOptimalParametersArray.length=0
        globalConsumptionOptimalParametersArray.push(consumption_parameters) // so that copy to clipboard button can grab the data

        let aStar = JSONresponse["left_fit_bound_time"]
        let bStar = JSONresponse["right_fit_bound_time"]
        const chosenFunction = $w("#FunctionChoiceDropDown").value
        $w("#ChartJsDaily").postMessage([`POPT GEN.${chosenFunction}`,aStar,bStar,erzeugungsPOPT])
        if (use_consumption){
            $w("#ChartJsDaily").postMessage([`POPT CONSUMPTION.Polynomial`,0,24,consumption_parameters])
        }

        if (language=="es"){
            var left = "azquierda"
            var right = "derecha"
            var and = "y"
        }
        else if (language=="de"){
            var left = "links"
            var right = "rechts"
            var and = "und"
        }
        else if (language=="en"){
            var left = "left"
            var right = "right"
            var and = "and"
        }


        const functionName = JSONresponse["function_generation_name"]


        aStar = aStar.toString()+ ` h (${left}) ${and} `
        bStar = bStar.toString()+ ` h (${right})`


        const latexStringGen = JSONresponse["function_name_generation_latex_string"]
        const latexStringConsumption = JSONresponse["function_name_consumption_latex_string"]
        if (JSONresponse["generation_roots"]!=undefined && JSONresponse["generation_roots"][0]!=undefined){
            var rootLeft = JSONresponse["generation_roots"][0].toString()+ ` h (${left})`
        }
        if (JSONresponse["generation_roots"]!=undefined && JSONresponse["generation_roots"][1]!=undefined){
            var rootRight = JSONresponse["generation_roots"][1].toString() + ` h (${right})`
            rootLeft += ` ${and} ` + rootRight
        }
        const help = JSONresponse["polynomial_degree_generation"]


        if (help<3 && help!=null){
            if (language=="es"){var rootLeft = "Sin cálculo de raíces de la función para grado de polinomio <3."}
            else if (language=="de"){var rootLeft = "Für Polygrad < 3 keine Nullstellen Berechnung."}
            else if (language=="en"){var rootLeft = "Roots not calculated for polynomial degrees <2."}
            var rootRight = ""
        }

        if (functionName=="Gaussian"){
            var rootLeft ="- - -"
        }

        // TEST TEST TEST TEST

        wixWindow.copyToClipboard(create_geogebra_command_string(globalXArray, globalYArray, globalZArray,latexStringGen.replace(/\$/g,""), latexStringConsumption.replace(/\$/g,""))) // get rid of dollar signs needed for mathjax

        const actualEnergySum = (Math.round((JSONresponse["approximated_total_energy"] + Number.EPSILON) * 100) / 100).toFixed(2).toString()+" Wh"
        const abweichungDesIntegrals = (100*((Math.round((JSONresponse["energy_quotient"] + Number.EPSILON) * 10000) / 10000))).toFixed(2).toString()+" %"

        $w("#copyGenPoptButton").show()
        if (use_consumption){
            $w("#copyConsumptionPoptButton").show()
        }
        $w("#EnergieKontrollErgebnis").text = actualEnergySum
        $w("#AbweichungDesIntegrals").text = abweichungDesIntegrals
        $w("#Nullstellen").text = rootLeft  // == rootLeft + rootRight if (rootRight)
        $w("#GrenzenFitintervall").text = aStar + bStar
        $w("#functionFitTextHTML").postMessage([latexStringGen])
        $w("#ParameterGenCodeHTML").postMessage([create_latex_param(functionName,erzeugungsPOPT)])
        if (use_consumption){
            $w("#ParameterConsumptionCodeHTML").postMessage([create_latex_param("Polynomial",consumption_parameters)])
            $w("#functionConsumptionFitTextHTML").postMessage([latexStringConsumption])
        }
        if (numericalInstability=="true"){
            //$w("#NumerischInstabil").text = "Numerisch instabil."
            //$w("#NumericalInstablityGroup").show()
        }
        else{
            //$w("#NumericalInstablityGroup").hide()
        }
    })
}






export function FunctionChoiceDropDown_change(event) {
    $w("#copyGenPoptButton").hide()

    reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
    wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))

    // enable fit Button
    $w("#FitButton").enable()

    //$w("#LatexHTML").postMessage([$w("#FunctionChoiceDropDown").value])

    if ($w("#FunctionChoiceDropDown").value=="polynomialFunctionOfDegreeN"){
        $w("#PolynomGradSlider").show()
        $w("#ErzeugungPolynomGradSliderBegleitText").show()
    }
    else {
        $w("#PolynomGradSlider").hide()
        $w("#ErzeugungPolynomGradSliderBegleitText").hide()
    }
}


export function datePicker_change(event) {
    pushGraphDataToPlotter(useDemoData)
    $w("#ChartJsDaily").postMessage(["Please clear any existing fits."])
    reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
}

export function radioGroupInstallations_change(event) {
    $w("#errorGroup").hide()
    pushGraphDataToPlotter(useDemoData)
}

export function OverviewOptionButton_click(event) {
    $w("#optionOverviewGray").hide()
    $w("#optionOverviewBlue").show()
    $w("#OptionFitBlue").hide()
    $w("#OptionFitGray").show()
    $w("#OptionGroupInfoBlue").hide()
    $w("#OptionGroupInfoGray").show()

    $w("#ResultBox").hide()
    $w("#FitButton").hide()

    $w("#box6").hide()
    $w("#box11").show()

    change_graph_style_to_bar($w("#ChartJsDaily"))
    $w("#ChartJsDaily").postMessage(["Please clear any existing fits."])
}





export function InitializeWorkspaceWithIdButton_click(event) {

    show_loader($w('#LoadingDots1'))
    const id = $w("#InputID").value

    // check first if the inputted ID equals the demo ID
    checkDemoKey(id).then(is_demo => {

        if (!is_demo){

            useDemoData = false
            // not a demo => Initialize school from ID normally

            if (customerSolution==='Victron'){
                findBasicSchoolInformationFromID_VictronSolution(false,id).then(data =>{

                    hide_loader($w('#LoadingDots1'))

                    if (Object.keys(data).length==0){
                        // Failure: No data registered with inputted ID
                        crossmark($w('#CrossmarkHTML1'))
                        global_information_window_log_in_failure($w('#GlobalInformationWindow'))
                        return null
                    }
                    else {
                        // Success -> Style
                        checkmark($w('#CheckmarkHTML1'))
                        global_information_window_log_in_success($w('#GlobalInformationWindow'))
                        $w("#radioGroupInstallations").enable()

                        $w("#NameDerSchule").text = data[0].installationName.split(",")[0]+", "+ data[0].installationName.split(",")[1]
                        let radioOptions = []
                        for (const i of Object.keys(data)){
                            radioOptions.push({"label": data[i].installationName.split(",")[2], "value": data[i].installationID.toString()})
                        }
                        if (Object.keys(data).length>1){
                            radioOptions.push({"label": "Summe (in Bearb.)", "value": "000000"})
                        }

                        $w("#radioGroupInstallations").options = radioOptions;

                        const sysCreatedTimestamp = convert_string_to_unix_timestamp(data[0].installationCreationDate)
                        const sysCreatedDate = new Date(format_time(sysCreatedTimestamp));
                        $w("#datePicker").minDate = sysCreatedDate
                        // In format_time(arg), arg has to be a unix timestamp, i.e. in seconds, although it is later converted into milliseconds
                        // So to use this function, we convert the milliseconds the js function Date.now() gives us into seconds.
                        var monthsPassedSinceCreation = calculate_month_difference(new Date(format_time(sysCreatedTimestamp)), new Date(format_time(Date.now()/1000)))
                        //console.log("moths passed since creation: ",monthsPassedSinceCreation)
                        monthsPassedSinceCreation = +(monthsPassedSinceCreation.toString())
                        const fullFiveMonthsToAdd = Math.floor(monthsPassedSinceCreation/5)
                        //console.log("full five months to add:", fullFiveMonthsToAdd)

                        if ((monthsPassedSinceCreation/5)%1!=0){
                            //console.log("there exists remainder months to add")
                            var RemainderFiveMonthsToAdd = (monthsPassedSinceCreation/5)%1
                            //console.log("Remainder months: ",RemainderFiveMonthsToAdd)
                        }

                        var startEndArray = []
                        if (fullFiveMonthsToAdd!=0){
                            for (const i of [...Array(fullFiveMonthsToAdd).keys()]){
                                if (i==0){startEndArray.push([sysCreatedTimestamp,convert_string_to_unix_timestamp(add_months_to_date(sysCreatedDate,5*(i+1)))])}
                                if (i>0){startEndArray.push([startEndArray[i-1][1],convert_string_to_unix_timestamp(add_months_to_date(new Date(format_time(startEndArray[i-1][0])),5*(i+1)))])}

                            }}
                        //console.log("start end array:", format_time(startEndArray[0][0]),format_time(startEndArray[0][1]), startEndArray)
                        /*if (RemainderFiveMonthsToAdd){
                            startEndArray = [[startEndArray[startEndArray.length-1][1],convert_string_to_unix_timestamp(AddMonthsToDate(new Date(format_time(startEndArray[startEndArray.length-1][1])),Math.ceil(5*RemainderFiveMonthsToAdd)-1))]]
                            console.log("start end array:", format_time(startEndArray[0][0]),format_time(startEndArray[0][1]), startEndArray)
                        }*/

                        getAllEnabledDates_VictronSolution(id,startEndArray).then(results=>{
                            //console.log("RESULTS FROM FETCH: ",results)
                            var enabledDates = []
                            for (const i of results) {
                                const date = new Date(format_time(i))
                                enabledDates.push({
                                    startDate: date,
                                    endDate: date
                                })
                            }
                            $w("#datePicker").enabledDateRanges = enabledDates
                            //console.log("enabled dates are --> ",enabledDates)
                            $w("#datePicker").value = enabledDates[enabledDates.length-1]["startDate"]
                        })

                    }}
                )
            }
            else if (customerSolution === 'UnitedKingdomMongoDB'){
                // pass, implement in the future
            }


        }


        else if (is_demo){

            // is the demo; Grab the data from the master demo csv data instead of using the VRM api.
            useDemoData = true
            checkmark($w('#CheckmarkHTML1'))
            global_information_window_log_in_success($w('#GlobalInformationWindow'))

            let language = wixWindowFrontend.multilingual.currentLanguage; // "en" or "es" or "de"
            if (language=="es"){
                var radio_label = "Techado"
            }
            else if (language=="en"){
                var radio_label = "Roof"
            }
            else if (language=="de"){
                var radio_label = "Dach"
            }


            $w("#radioGroupInstallations").enable()
            var radioOptions = [{"label": `${radio_label}`, "value":"000000"}]
            $w("#radioGroupInstallations").options = radioOptions;
            $w("#radioGroupInstallations").selectedIndex = 0 // sets "roof" to be auto-selected for demo data


            var enabledDates = []
            enabledDates.push({
                startDate: new Date(format_time(convert_string_to_unix_timestamp('01/01/2022 00:00'))),
                endDate: new Date(format_time(convert_string_to_unix_timestamp('12/31/2022 23:59')))
            })
            $w("#datePicker").enabledDateRanges = enabledDates
            $w("#datePicker").value = new Date(format_time(convert_string_to_unix_timestamp('06/20/2022 00:01')))


            hide_loader($w('#LoadingDots1'))
            checkmark($w('#CheckmarkHTML1'))

            $w("#NameDerSchule").text = "Demo"

            pushGraphDataToPlotter(useDemoData)
            $w("#ChartJsDaily").postMessage(["Please clear any existing fits."])

        }
    })



}



export function xlsButton_click(event) {
    const name = $w("#NameDerSchule").text.split(",")[0]
    if (!useDemoData){
        var installation = $w("#radioGroupInstallations").options[$w("#radioGroupInstallations").selectedIndex].label}
    else if (useDemoData){
        var installation = ""
    }
    const date = $w("#datePicker").value
    const correctedDate = date.getDate().toString() + "/" + (date.getMonth()+1).toString() +  "/" + date.getFullYear().toString()

    $w("#DownloadCSVhtml").postMessage(["Download CSV File",name+installation+ " " +correctedDate])
}


export function jpgButton_click(event) {
    setDownloadJPGLink()
}

export async function copyGenPoptButton_click(event) {
    wixWindow.copyToClipboard(`${globalGenerationOptimalParametersArray}`)
        .then( () => {
            console.log("copied generation parameters to clipboard.")
        } )
        .catch( (err) => {
            console.log("An error has occured when copying the generation parameters to the clipboard. Error log -->" ,err)
        } );

}





export function FitConsumptionCheckBox_change(event) {
    const fit_consumption = $w("#FitConsumptionCheckBox").checked
    if (!fit_consumption){
        hide_consumption_fit_dials($w("#PolynomgradSliderVerbrauch"), $w("#VerbrauchPolynomGradSliderBegleitText"),  $w("#TooltipTrigger2"),$w("#functionConsumptionFitTextHTML"), $w("#ParameterConsumptionCodeHTML"),$w("#functionLatexImageConsumption"))
    }
    else if (fit_consumption){
        show_consumption_fit_dials($w("#PolynomgradSliderVerbrauch"), $w("#VerbrauchPolynomGradSliderBegleitText"),  $w("#TooltipTrigger2"),$w("#functionConsumptionFitTextHTML"), $w("#ParameterConsumptionCodeHTML"),$w("#functionLatexImageConsumption"))
    }
}



export function copyConsumptionPoptButton_click(event) {
    wixWindow.copyToClipboard(`${globalConsumptionOptimalParametersArray}`)
        .then( () => {
            console.log("copied consumption parameters to clipboard.")
        } )
        .catch( (err) => {
            console.log("An error has occured when copying the generation parameters to the clipboard. Error log -->" ,err)
        } );

}


export function TooltipTrigger1_mouseIn(event) {
    $w("#TooltipGroup1").show()
}


export function TooltipTrigger1_mouseOut(event) {
    $w("#TooltipGroup1").hide()
}


export function TooltipTrigger2_mouseIn(event) {
    $w("#TooltipGroup2").show()
}


export function TooltipTrigger2_mouseOut(event) {
    $w("#TooltipGroup2").hide()
}

export function ClearExistingFitsButton_click(event) {
    hide_consumption_fit_dials($w("#PolynomgradSliderVerbrauch"), $w("#VerbrauchPolynomGradSliderBegleitText"),  $w("#TooltipTrigger2"),$w("#functionConsumptionFitTextHTML"), $w("#ParameterConsumptionCodeHTML"),$w("#functionLatexImageConsumption"))
    reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
    wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))
}

/**
 *	Adds an event handler that runs when the element is clicked.
 [Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
 *	 @param {$w.MouseEvent} event
 */
export function text98_click(event) {
    $w("#section8").collapse()
    $w("#section9").expand()
}


export function FunctionChoiceConsumptionDropdown_change(event) {
    const choice = $w("#FunctionChoiceConsumptionDropdown").selectedIndex
    if (choice==1){
        $w("#PolynomgradSliderVerbrauch").show()
    }
}

