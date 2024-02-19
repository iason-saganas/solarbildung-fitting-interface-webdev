/*
*
* ----------------------------------------------------------
* F I T T I N G    I N T E R F A C E    V E R S I O N    2.0
* ----------------------------------------------------------
*
* @ Creator:        Iason Saganas
* @ Code support:   Felix B.
* @ For:            Solar For Schools Bildung gGmbH
* @ Thanks:         Everyone that gave constructive criticism and feedback
*
* ----------------------------------------------------------
*
* Workflow and structure of this code. The code is organized in six sections:
*
* 1. Imports
* 2. Definition of naming conventions
* 3. Definition of global variables
* 4. Basic functions. MOST IMPORTANT: 'returnPowerData()'
* 5. On ready listener function of this document
* 6. Specific $w('#ElementOnThisPage') listener functions (_click, _change, etc.). MOST IMPORTANT: 'InitializeWorkspaceWithIdButton_click()' and 'FitButton_click()'.
*
*
* The user inputs an ID in the input field "$w('InputID')". The ID determines which Site and which customer solution to present data for.
* Current customer solutions are the Victron Cloud (DE), MongoDB (UK) and demo data (UK Foxfield-School).
* On hitting the send button, the listener function 'InitializeWorkspaceWithIdButton_click()' is called.
*
*
* ==> I N I T I A L I Z A T I O N
*
* Send form $w('InputID').
*   --> InitializeWorkspaceWithIdButton_click() call
*       --> customerSolution = findWhichCustomerSolution() call
*           const workspaceSolutions = [InitializeWorkspace_DemoSolution ,InitializeWorkspace_VictronSolution, InitializeWorkspace_UKMongoDBSolution]
*           const solutionNames = ['Victron', 'UKMongoDB']
*           find the index of 'customerSolution' in the array 'solutionNames' and execute the function in the array
*           'workspaceSolutions' that lies at that index.
*               --> pushGraphDataToPlotter(useDemoData, chartJsDailyInstance, costumerSolutionName) call
*
*
* ==> D A T A    P L O T
*
* $w('DailyDatePicker').onChange or $w('#RadioInstallationOptions').onchange
*   --> pushGraphToDataPlotter(date) call
*       --> returnPowerData(date, customerSolution) call
*
*
* ==> F I T T I N G    S E T T I N G S:
*
* --> FitButton_click() call
*
* */


import wixWindow from 'wix-window';
import wixWindowFrontend from 'wix-window-frontend';

import {
    checkDemoKey,
    grabDemoDataFromMasterCSV
} from 'backend/custom-media-backend'

import {
    returnTimeAndPowerArrays_VictronSolution_Daily,
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
    create_geogebra_command_string,
    findWhichCustomerSolution
} from 'public/graphs-custom-helper-functions.js'

import {
    global_information_window_log_in_success_generic,
    global_information_window_log_in_failure,
    checkmark,
    crossmark,
    downloadCSV,
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
    hide_daily_dials_show_weekly_dials,
    global_information_window_new_installation_chosen,
    runScriptButtonStylisticChanges,
    runScriptButtonGetInterfaceParameters,
    global_information_window_parameters_copied,
    global_information_window_geogebra_code_copied
} from 'public/graphs-element-manipulation-functions.js'

import {
    createAndStoreCsvBlobInButton_GeneralSolution_Daily,
    findAndProcessData_DemoSolution_Daily,
    InitializeWorkspace_DemoSolution_Daily
} from "public/data-solutions/demo";

import {
    adjustDatesForOtherInstallations_VictronSolution_Daily,
    findAndProcessData_VictronSolution_Daily,
    InitializeWorkspace_VictronSolution_Daily
} from "public/data-solutions/victron";

import {
    InitializeWorkspace_UKMongoDBSolution_Daily
} from "public/data-solutions/united-kingdom-mongoDB";



/**

 N A M I N G   C O N V E N T I O N S

 -   Small helper functions from the file 'public/graphs-custom-helper-functions-by-felix.js':       snake_case
 -   Stylistic function from the file 'public/graphs-element-manipulation-functions-by-felix.js':    snake_case
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

 This is the information that gets pushed into the pages html interface, for example:
 Upon choosing a date (globalYArray, globalXArray) or upon executing a fit (globalGenerationOptimalParametersArray).

 Descriptions:

 -  globalXArray:                                   Timestamp array. looks like [ 1212415315, 12124153113, 1212415316, ... ]
 -  globalYArray:                                   Generation array. looks like [ [ 1, 2, 3, 4, ... ] ]
 -  globalZArray:                                   Consumption array. looks like [ [ 1, 2, 3, 4, ... ] ]
 -  globalGenerationOptimalParametersArray:         Generation parameters array
 -  globalConsumptionOptimalParametersArray:        Consumption parameters array
 -  globalCalendarMode:                             One of 'daily', 'weekly'. Determines whether daily data or weekly aggregates are shown.
 Is updated via the 'CalendarModeTool' element.
 -  globalCustomerSolution:                         Stores the current in-use customer solution in a global variable.
 -  globalInstallationInformationObject:            This is a dictionary that contains information about different installations of a site. The
 information is grabbed throughout various http calls and therefore expensive to retrieve, therefore
 stored here after first retrieval. Keys of object:
 -   'idOfCurrentlySelectedInstallation'
 -  isChromium                                      Whether or not the browser is chromium based. Information gotten from an in-page HTML element because of
 missing wix functionality.

 */

var globalXArray = []
var globalYArray = []
var globalZArray = []
var globalGenerationOptimalParametersArray = []
var globalConsumptionOptimalParametersArray = []
var existsNonTrivialZData = false
var globalCalendarMode = 'daily'
var globalCustomerSolution = 'Victron'
var globalInstallationInformationObject = {}
var isChromium = null // Boolean
var geogebraCommand = null



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
    Central functions dealing with pulling and presenting data on the interface.
*/



/**
 * Pushes a command to the chartJsElement instance to update the figure with the provided data.
 *
 * @param   {Element} chartJsElement  :   Something like $w('#ChartJsDaily') or $W('#ChartJsWeekly')
 * @param   {object} dataDictionary   :   A dictionary containing tuples or triples (if z is included) of time, power and consumption data (if any).
 *
 * @return  {void}
 */
function pushGraphDataToPlotter(chartJsElement, dataDictionary){
    if (globalCustomerSolution !== 'Demo'){
        // dict contains x and y values
        chartJsElement.postMessage(["Time, generation and possibly consumption data, non-demo.",dataDictionary])
    }
    else if (globalCustomerSolution === 'Demo'){
        // dict contains x, y and z values
        chartJsElement.postMessage(["Time, generation and consumption data, demo.",dataDictionary])
    }
}


/** The customer-specific query data function, catching time stamps and generation data for the current constraints on the web page (date, installation).
 *  Hides/shows some necessary accessories. Activates one of the functions 'findAndProcessData_<CustomerSolution>_Daily', dependent on the currently
 *  in-use customer-solution, which is set by the global variable 'customerSolution' (as of 06.01.24). The retrieved object acts as the argument
 *  'dataDictionary' for the function 'pushGraphDataToPlotter()'.
 *
 * @param   {boolean}   debug                 :     If true, various debug statements are printed.
 * @param   {object}    date                  :     The currently picked daily datetime object grabbed as '$w("#DailyDatePicker").value'.
 * @param   {string}    SiteID                :     The installation id to look data for if any, passed as a string.
 *
 * @return  {Promise<object>}                 :     A promise that resolves to a data dictionary object containing triples of x, y and z values (if any) (time, generation, consumption (if any)).
 */
function returnPowerData(debug, date, SiteID){

    initialize_fit_results_texts($w("#EnergieKontrollErgebnis"), $w("#AbweichungDesIntegrals"), $w("#Nullstellen"), $w("#GrenzenFitintervall"))
    wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))

    // Solving a bug by setting hours of datetime object from '00:00:000' to noon. Otherwise, somewhere in the chain of the function calls in the backend a millisecond is subtracted,
    // giving us the data of the day before the actual date.
    date.setHours(12, 0, 0 , 0)

    const dataSolutions = [()=>{
        return findAndProcessData_DemoSolution_Daily(date, $w("#ChartJsDaily"), $w("#DownloadCSVhtml"))
    },
        () => {
            return findAndProcessData_VictronSolution_Daily(date, SiteID, $w("#ChartJsDaily"), $w("#DownloadCSVhtml"))
        },
        () => {
            // pass, UKMongoDB data solution
        }]

    const solutionNames = ['Demo', 'Victron', 'UKMongoDB']
    const indexOfFunctionToExecute = solutionNames.indexOf(globalCustomerSolution) // global variable

    // execute customer-specific data solution function
    return dataSolutions[indexOfFunctionToExecute]()

}

/**
 * Combines the data gathering function 'returnPowerData(datepicker.value)' with the function pushing the data to the plotter
 * and some stylistic manipulations.
 * */
function findAndFillWithData_Daily(){
    show_loader($w('#Loader2Daily'), isChromium)
    const currentlySelectedDate = $w('#DailyDatePicker').value
    returnPowerData(false, currentlySelectedDate, $w("#radioGroupInstallations").value).then(dataDictionary => {
        hide_loader($w('#Loader2Daily'), isChromium)
        pushGraphDataToPlotter($w("#ChartJsDaily"), dataDictionary)
        $w("#ChartJsDaily").postMessage(["Clear any existing fits.", []])
        $w("#ChartJsDaily").postMessage(["Send back well-defined X,Y and Z values.", []])
    })
    reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
}


function update_calendar_based_on_mode(){
    // pass
}




/*

                            L I S T E N E R   F U N C T I O N S

*/



$w.onReady(function () {

    /*

                            C O M M U N I C A T I O N   W I T H   P A G E   C U S T O M   H T M L   E L E M E N T S
    */

    $w('#ChartJsDaily').onMessage( event => {
        const command = event.data[0]
        const context = event.data[1]
        if (command === "Update universal consumption array 'globalZArray'. Context includes current XArray and YArray for convenience."){
            // now that Z (consumption) data was calculated inside the chart js html element, update the global
            // ZArray variable and construct the blob for the complete CSV data.
            const [X, Y, Z] = context
            globalZArray.length = 0
            globalZArray = [Z]
            createAndStoreCsvBlobInButton_GeneralSolution_Daily($w("#DownloadCSVhtml"),X, [Y],  [Z])
        }
        else if (command === "Update global variables X, Y and Z."){
            const [X, Y, Z] = context
            globalXArray.length = 0
            globalYArray.length = 0
            globalZArray.length = 0

            globalXArray = X // this looks like: [1.03, 1.12, 1.2 etc.]
            globalYArray = Y // this looks like: [{x: 1707955320, y: 0}], so no extra brackets needed
            globalZArray = Z // this looks like [{x: 1707955320, y: 21}], so no extra brackets needed
        }
    })


    /*

                            G E T T I N G   B R O W S E R   I N F O
    */

    $w("#getBrowserInfoHTML").postMessage("Get browser info.")
    $w("#getBrowserInfoHTML").onMessage( (event) => {
        let browser_info = event.data;
        isChromium =  browser_info.isChromium;
        hide_loader($w('#Loader2Daily'), isChromium)
        hide_loader($w('#Loader1'), isChromium)
    } );


    /*

                            S T Y L I S T I C   M A N I P U L A T I O N S
    */

    // since not default, hide the weekly and show the daily dials and charts
    hide_weekly_dials_show_daily_dials($w("#ColumnStripGenerationWeekly"),$w("#ColumnStripConsumptionWeekly"),$w("#ColumnStripGenerationDaily"),$w("#ColumnStripConsumptionDaily"))
    $w('#FittingInterfaceColumnStripChartJSWeekly').collapse()
    /*

                            H A N D L I N G   O F   C U S T O M   T O O L B A R   C H O I C E S
    The custom toolbar is made up of the elements: ['CalendarModeTool', 'ExportDataTool', ]. If a choice is made, i.e. a dropdown selected
    from any of those elements, a custom event 'DropdownChoice' is dispatched which is registered here and its value (the index of the selected
    element) is read and handled.
    */

    $w('#CalendarModeTool').on('DropdownChoice', (data) => {
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice === 0){
            globalCalendarMode = 'daily'
            hide_weekly_dials_show_daily_dials($w("#ColumnStripGenerationWeekly"),$w("#ColumnStripConsumptionWeekly"),$w("#ColumnStripGenerationDaily"),$w("#ColumnStripConsumptionDaily"))
            // function that needs to be implemented :update_calendar_based_on_mode(calendarMode)
        }
        else if (index_of_selected_choice === 1){
            globalCalendarMode = 'weekly'
            hide_daily_dials_show_weekly_dials($w("#ColumnStripGenerationWeekly"),$w("#ColumnStripConsumptionWeekly"),$w("#ColumnStripGenerationDaily"),$w("#ColumnStripConsumptionDaily"))
            // update_calendar_based_on_mode(calendarMode)
        }
    })


    $w("#ExportDataTool").on('DropdownChoice', (data)=>{
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice === 0){
            downloadCSV($w("#NameDerSchule").text.split(",")[0], $w("#radioGroupInstallations"), $w("#DailyDatePicker").value)
        }
        else if (index_of_selected_choice === 1){
            $w("#ChartJsDaily").postMessage(['Download Png.', [isChromium]])
        }
    })

    $w("#ChangeGraphTypeTool").on('DropdownChoice', (data)=>{
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice === 0){
            $w('#ChartJsDaily').postMessage(["Change graph to point style.", []])
        }
        else if (index_of_selected_choice === 1){
            $w('#ChartJsDaily').postMessage(["Change graph to bar style.",[]])
        }
    })

    // Clear all button functionality
    $w("#ClearAllButton").on('IconButtonClick', (data) => {
        hide_consumption_fit_dials($w("#PolynomialDegreeSliderGeneration"), $w("#VerbrauchPolynomGradSliderBegleitText"),  $w("#TooltipTrigger2"),$w("#functionConsumptionFitTextHTML"), $w("#ParameterConsumptionCodeHTML"),$w("#functionLatexImageConsumption"))
        reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
        wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))
    })

    $w("#RunScriptButton").on('IconButtonClick', (data) => {
        // EXECUTE SCRIPT

        // enable clear all and copy data to clipboard icon buttons
        $w("#ClearAllButton").setAttribute('deactivated', 'false')
        $w("#CopyToClipboardTool").setAttribute('deactivated', 'false')

        // set style
        runScriptButtonStylisticChanges(isChromium)

        // get interface settings
        const [functionNameGeneration, useConsumption, polynomialDegreeGeneration, polynomialDegreeConsumption] = runScriptButtonGetInterfaceParameters()
        const xData = globalXArray
        const yData = globalYArray.map(XYTupleAsDict => XYTupleAsDict.y)
        const zDataDType = typeof(globalZArray[0])
        let zData = null
        if (zDataDType === 'string'){
            // data was generated randomly from chart html element
            zData = globalZArray.map(consumptionString => parseFloat(consumptionString))
        }
        else {
            // data was read from pre-built xls files => dtype is object [{x: timestamp, y:value}]
            zData = globalZArray.map(XZTupleAsDict => XZTupleAsDict.y)
        }


        console.log("Ich fütter ein: ", xData, [yData], [zData])

        let collectedInterfaceSettings = {
            CallingFrom: "LiveSolarData",
            Debug : true,
            Function: functionNameGeneration,
            PolynomialDegree : polynomialDegreeGeneration,
            PolynomialDegreeOfConsumption : polynomialDegreeConsumption,
            XData : xData,
            YData : [yData],
            Y2Data: [zData],
            UseConsumption: useConsumption
        }

        // run python script via HTTP request
        // runScriptButtonExecuteHTTP(collectedInterfaceSettings)

        postHttpRequest("https://iason2ctrl.pythonanywhere.com/dummyAPI",collectedInterfaceSettings).then((HTTPresponse)=>{

            hide_loader($w("#Loader2Daily"),isChromium)

            // var language = wixWindowFrontend.multilingual.currentLanguage; // "en" or "es" or "de" // CORRECT THIS
            let language = "de"

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
            const chosenFunction = $w("#FunctionChoiceGenerationDropDown").value
            $w("#ChartJsDaily").postMessage([`POPT GEN.${chosenFunction}`,aStar,bStar,erzeugungsPOPT])
            if (useConsumption){
                $w("#ChartJsDaily").postMessage([`POPT CONSUMPTION.Polynomial`,0,24,consumption_parameters])
            }

            let left = null
            let right = null
            let and = null

            if (language==="es"){
                left = "azquierda";
                right = "derecha"
                and = "y"
            }
            else if (language==="de"){
                left = "links";
                right = "rechts"
                and = "und"
            }
            else if (language==="en"){
                left = "left";
                right = "right"
                and = "and"
            }


            const functionName = JSONresponse["function_generation_name"]


            aStar = aStar.toString()+ ` h (${left}) ${and} `
            bStar = bStar.toString()+ ` h (${right})`

            let rootLeft = null
            let rootRight = null


            const latexStringGen = JSONresponse["function_name_generation_latex_string"]
            const latexStringConsumption = JSONresponse["function_name_consumption_latex_string"]
            if (JSONresponse["generation_roots"]!=undefined && JSONresponse["generation_roots"][0]!=undefined){
                rootLeft = JSONresponse["generation_roots"][0].toString()+ ` h (${left})`
            }
            if (JSONresponse["generation_roots"]!=undefined && JSONresponse["generation_roots"][1]!=undefined){
                rootRight = JSONresponse["generation_roots"][1].toString() + ` h (${right})`
                rootLeft += ` ${and} ` + rootRight
            }
            const help = JSONresponse["polynomial_degree_generation"]


            if (help<3 && help!=null){
                if (language=="es"){rootLeft = "Sin cálculo de raíces de la función para grado de polinomio <3."}
                else if (language=="de"){rootLeft = "Für Polygrad < 3 keine Nullstellen Berechnung."}
                else if (language=="en"){rootLeft = "Roots not calculated for polynomial degrees <2."}
                rootRight = ""
            }

            if (functionName=="Gaussian"){
                rootLeft ="- - -"
            }


            let latexConsumptionContribution = ""
            if (useConsumption){
                latexConsumptionContribution = latexStringConsumption.replace(/\$/g,"")
            }
            geogebraCommand = create_geogebra_command_string(globalXArray, globalYArray, globalZArray,latexStringGen.replace(/\$/g,""), latexConsumptionContribution) // get rid of dollar signs needed for mathjax

            const actualEnergySum = (Math.round((JSONresponse["approximated_total_energy"] + Number.EPSILON) * 100) / 100).toFixed(2).toString()+" Wh"
            const abweichungDesIntegrals = (100*((Math.round((JSONresponse["energy_quotient"] + Number.EPSILON) * 10000) / 10000))).toFixed(2).toString()+" %"

            $w("#EnergieKontrollErgebnis").text = actualEnergySum
            $w("#AbweichungDesIntegrals").text = abweichungDesIntegrals
            $w("#Nullstellen").text = rootLeft  // == rootLeft + rootRight if (rootRight)
            $w("#GrenzenFitintervall").text = aStar + bStar
            $w("#functionFitTextHTML").postMessage([latexStringGen])
            $w("#ParameterGenCodeHTML").postMessage([create_latex_param(functionName,erzeugungsPOPT)])
            if (useConsumption){
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



    })

    $w("#CopyToClipboardTool").on('DropdownChoice', (data)=>{
        const index_of_selected_choice = data.detail
        if (index_of_selected_choice === 0){
            wixWindow.copyToClipboard(`${globalGenerationOptimalParametersArray}`)
            global_information_window_parameters_copied($w("#GlobalInformationWindow"))
        }
        else if (index_of_selected_choice === 1){
            wixWindow.copyToClipboard(`${globalConsumptionOptimalParametersArray}`)
            global_information_window_parameters_copied($w("#GlobalInformationWindow"))
        }
        else if (index_of_selected_choice === 2){
            wixWindow.copyToClipboard(geogebraCommand)
            global_information_window_geogebra_code_copied($w("#GlobalInformationWindow"))
        }
    })




    $w("#radioGroupInstallations").disable();   // This is going to be enabled with the initialize_workspace function

});







export function DailyDatePicker_change(event) {
    findAndFillWithData_Daily()
}

export function radioGroupInstallations_change(event) {
    const selectedInstallationIDString = $w('#radioGroupInstallations').value
    if (selectedInstallationIDString === '000000'){
        // unique identifier for sum of all installations. Not implemented in the current version of the fitting interface (Version 2.0)
    }
    else{
        const newID = selectedInstallationIDString
        const oldID = globalInstallationInformationObject['idOfCurrentlySelectedInstallation']

        const storedEnabledDates = globalInstallationInformationObject[`enabledDateRanges_ID_${newID}`]
        const storedDisabledDates = globalInstallationInformationObject[`disabledDateRanges_ID_${newID}`]

        // First, look whether the variable 'globalInstallationInformationObject' has some information stored about the selected ID
        if ( storedEnabledDates && storedDisabledDates){
            // data exists! Store old ID information and update date ranges by clearing all and then using stored data.

            globalInstallationInformationObject[`enabledDateRanges_ID_${oldID}`] = $w('#DailyDatePicker').enabledDateRanges
            globalInstallationInformationObject[`disabledDateRanges_ID_${oldID}`] = $w('#DailyDatePicker').disabledDateRanges


            $w('#DailyDatePicker').disabledDateRanges = []
            $w('#DailyDatePicker').enabledDateRanges = null

            $w('#DailyDatePicker').enabledDateRanges = storedEnabledDates
            $w('#DailyDatePicker').disabledDateRanges = storedDisabledDates

            findAndFillWithData_Daily()
        }

        else {
            global_information_window_new_installation_chosen($w('#GlobalInformationWindow'))
            // Installation was never selected, thus never data gathered => Update the date ranges via http calls.
            // Up to now, only the Victron Solution calls for multiple installations per site.
            adjustDatesForOtherInstallations_VictronSolution_Daily(newID, oldID, $w('#DailyDatePicker'), $w('#ChartJsDaily')).then(results => {
                const [success, copyOfOldEnabledDateRanges, copyOfOldDisabledDateRanges] = results
                globalInstallationInformationObject['idOfCurrentlySelectedInstallation'] = newID
                globalInstallationInformationObject[`enabledDateRanges_ID_${oldID}`] = copyOfOldEnabledDateRanges
                globalInstallationInformationObject[`disabledDateRanges_ID_${oldID}`] = copyOfOldDisabledDateRanges
                findAndFillWithData_Daily()
            })
        }

    }
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
    $w("#ChartJsDaily").postMessage(["Clear any existing fits.", []])
}




export function InitializeWorkspaceWithIdButton_click(event) {

    show_loader($w('#Loader1'), isChromium)
    $w('#DailyDatePicker').maxDate = undefined
    $w('#DailyDatePicker').minDate = undefined
    $w('#DailyDatePicker').enabledDateRanges = null
    $w('#DailyDatePicker').disabledDateRanges = []
    const id = $w("#InputID").value // string
    // update global 'customerSolution' function
    globalCustomerSolution  = findWhichCustomerSolution(+id)

    const workspaceSolutions = [
        () => Promise.resolve(InitializeWorkspace_DemoSolution_Daily($w('#GlobalInformationWindow'), $w("#radioGroupInstallations"), $w("#DailyDatePicker"), $w("#NameDerSchule"), $w("#ChartJsDaily"), $w('#Loader1'), $w('#CheckmarkHTML1'), isChromium)),
        () => InitializeWorkspace_VictronSolution_Daily(id, $w('#Loader1'), $w('#CrossmarkHTML1'), $w('#CheckmarkHTML1'), $w('#GlobalInformationWindow'), $w("#radioGroupInstallations"), $w("#DailyDatePicker"), $w("#NameDerSchule"), $w("#ChartJsDaily"), isChromium),
        //() => InitializeWorkspace_UKMongoDBSolution_Daily('Implement Parameters here')
    ]

    const solutionNames = ['Demo', 'Victron', 'UKMongoDB']
    const indexOfFunctionToExecute = solutionNames.indexOf(globalCustomerSolution)

    // execute customer-specific initialization function
    // if the return type of the selected function is a promise, that call to grab the value of the datepicker and push the graph data of that day to the plotter
    // needs to be inside a '.then()' callback, in order for the correct enabled date range to have 'settled in'; Otherwise the synchronous code runs and the datepicker
    // value is called to soon! The 'InitializeWorkspace_DemoSolution_Daily' is a synchronous function, all others are async and return a promise that resolve to a string
    // (either 'success' or 'failure').

    workspaceSolutions[indexOfFunctionToExecute]().then(result => {
        if (result !=='failure' ){
            // for the default date, find the data and push it to chart.JS plotter
            findAndFillWithData_Daily()
            // Update the key on this object, so on installation change, we know what the old selected ID was
            globalInstallationInformationObject['idOfCurrentlySelectedInstallation'] =  $w('#radioGroupInstallations').value
        }
    })




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


export function ClearExistingFitsButton_click(event) {
    hide_consumption_fit_dials($w("#PolynomialDegreeSliderGeneration"), $w("#VerbrauchPolynomGradSliderBegleitText"),  $w("#TooltipTrigger2"),$w("#functionConsumptionFitTextHTML"), $w("#ParameterConsumptionCodeHTML"),$w("#functionLatexImageConsumption"))
    reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
    wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))
}




export function FunctionChoiceConsumptionDropdown_change(event) {
    const choice = $w("#FunctionChoiceConsumptionDropdown").selectedIndex
    if (choice===1){
        $w("#PolynomialDegreeSliderConsumption").show()
    }
}




/**
 * Event handler, that fires when a new generation function choice has been made.
 *
 * ** NOTE **
 * Already uses some refactored styling functions, but others are styles are implemented still by explicitly
 * calling the $w ui components directly.
 * I will leave this for now, so I can understand the implemented functionality
 * when I eventually refactor this.
 *
 * */
export function FunctionChoiceGenerationDropDown_change(event) {


    reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
    wipe_interface_clean( $w("#functionFitTextHTML"), $w("#functionConsumptionFitTextHTML"),$w("#ParameterGenCodeHTML"),$w("#ParameterConsumptionCodeHTML"),$w("#ChartJsDaily"))

    // enable fit Button
    $w('#RunScriptButton').setAttribute('deactivated', 'false')


    if ($w("#FunctionChoiceGenerationDropDown").value=="polynomialFunctionOfDegreeN"){
        $w("#PolynomialDegreeSliderGeneration").show()
        $w("#ErzeugungPolynomGradSliderBegleitText").show()
    }
    else {
        $w("#PolynomialDegreeSliderGeneration").hide()
        $w("#ErzeugungPolynomGradSliderBegleitText").hide()
    }
}

