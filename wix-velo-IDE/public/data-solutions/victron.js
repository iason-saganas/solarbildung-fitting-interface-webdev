import {
    checkmark,
    global_information_window_log_in_success_generic,
    global_information_window_log_in_failure,
    hide_loader,
    crossmark, global_information_window_log_in_success_victron, show_loader, reset_results_from_fit_and_hide_texts
} from "../graphs-element-manipulation-functions";

import {
    findBasicSchoolInformationFromID_VictronSolution,
    getAllEnabledDates_VictronSolution,
    returnTimeAndPowerArrays_VictronSolution_Daily
} from "../../backend/custom-http";

import {
    convert_string_to_unix_timestamp, convert_time_string_to_int, format_time, format_time_short, zip
} from "../graphs-custom-helper-functions";
import {
    createAndStoreCsvBlobInButton_GeneralSolution_Daily,
    postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily
} from "./demo";


const ALL = ['returnPowerData_VictronSolution', 'InitializeWorkspace_VictronSolution_Daily', 'constructStartEndArray_VictronSolution',
                    'findAndProcessData_VictronSolution_Daily']

/**
 * Converts a unix timestamp fetched from the Victron vrm api to a string representing the actual date.
 * E.g: format_time(1687387972) = 21 Jun 2023 22:52:52
 *
 * @param  {Number} date      :   The Unix Timestamp that is to be converted
 *
 * @return {String}                     :   The converted String that represents the actual date in format Day Month Year Hour:Minutes:Seconds
 *
 */
export function returnPowerData_VictronSolution(data){

}


/**
 * All 'InitializeWorkspace_<CustomerSolution>_Daily' functions have the appendix "Daily", because that is the standard selection when the fitting interface
 * is loaded.
 *
 * @param   {string}    siteID                     : The identifier associated with the site (number represented as string).
 * @param   {Element}   loader                     : Something like $w('#LoadingDots1')
 * @param   {Element}   crossmarkInstance          : Something like $w('#CrossmarkHTML1')
 * @param   {Element}   checkmarkInstance          : Something like $w('#CheckmarkHTML1')
 * @param   {Element}   globalInformationWindow    : Something like $w('#GlobalInformationWindow').
 * @param   {Element}   radioGroupInstallations    : Something like $w("#radioGroupInstallations").
 * @param   {Element}   dailyDatePicker            : Something like $w("#DailyDatePicker").
 * @param   {Element}   nameOfSchoolText           : Something like $w("#NameDerSchule").
 * @param   {Element}   dailyChartJSInstance       : Something like $w("#ChartJsDaily")
 * @param   {Boolean}   isChromium                 : Whether the currently in-used browser is chromium-based or not.
 *
 * @return {Promise<string>}    A promise that resolves to 'failure' or 'success'
 *
 */
export function InitializeWorkspace_VictronSolution_Daily(siteID,loader, crossmarkInstance,checkmarkInstance,  globalInformationWindow, radioGroupInstallations, dailyDatePicker, nameOfSchoolText, dailyChartJSInstance,isChromium) {

    return findBasicSchoolInformationFromID_VictronSolution(false , siteID).then(data =>{
        // hide the loading dots, then determine whether site associated with ID was found
        hide_loader(loader, isChromium)
        let listOfInstallationsOfSite = Object.keys(data)
        if (listOfInstallationsOfSite.length === 0){
            // handle error: "No Site found."
            crossmark(crossmarkInstance)
            global_information_window_log_in_failure(globalInformationWindow)
            return 'failure'
        }
        else {
            // handle success: "Site was found."
            checkmark(checkmarkInstance)
            global_information_window_log_in_success_victron(globalInformationWindow)

            // name of the school
            nameOfSchoolText.text = data[0].installationName.split(",")[0]+", "+ data[0].installationName.split(",")[1]

            // fill radio group with all installations found for the site
            radioGroupInstallations.enable()
            let radioOptions = []
            for (const i of listOfInstallationsOfSite){
                radioOptions.push({"label": data[i].installationName.split(",")[2], "value": data[i].installationID.toString()})
            }
            // if more than one installation on a site, let the user be able to choose sum of all installations. THIS IDEA WAS DEPRECATED BECAUSE NOT IMPLEMENTED (Fitting Interface v2.0)
            /* if (listOfInstallationsOfSite.length > 1){
                radioOptions.push({"label": "Summe (in Bearb.)", "value": "000000"})
            }
            */
            radioGroupInstallations.options = radioOptions

            // set the min and max date on the calendar
            const timestampCreationInstallation = convert_string_to_unix_timestamp(data[0].installationCreationDate)
            const datetimeObjectCreationInstallation = new Date(format_time(timestampCreationInstallation))
            let today = new Date()
            dailyDatePicker.minDate = datetimeObjectCreationInstallation
            dailyDatePicker.maxDate = today

            // now fill the calendar only with those dates on which data exists!
            const startEndArray = constructStartEndArray_VictronSolution(timestampCreationInstallation)
            return getAllEnabledDates_VictronSolution(siteID, startEndArray).then(results => {
                let enabledDates = []
                for (const enabledDateUnixTimestamp of results){
                    const enabledDateDatetimeObject = new Date(enabledDateUnixTimestamp * 1000)
                    enabledDates.push({
                        startDate: enabledDateDatetimeObject,
                        endDate: enabledDateDatetimeObject
                    })
                }
                dailyDatePicker.enabledDateRanges =  enabledDates
                // set the standard value to the day before the last day at which data was recorded (which is typically
                // today, so set the default value typically to yesterday)
                const lastIndex = enabledDates.length-2
                dailyDatePicker.value =  enabledDates[lastIndex]["startDate"]

                dailyChartJSInstance.postMessage(["Clear any existing fits.", []])

                // Fine tune the date ranges using an async function, synchronously return 'success' and let the function fine tune the date range 'in the background'
                fineTuneEnabledDateRanges_VictronSolution_Daily(dailyDatePicker, enabledDates, siteID)

                return 'success'
            })

        }
    })
}

/**
 * Adjusts the enabled dates for another installation than the default one upon its selection instead of calling
 * all of 'InitializeWorkspace_VictronSolution_Daily()' again.
 *
 * @param {string}  newSiteIDValue              The site ID of the freshly picked installation, in string representation.
 * @param {string}  oldSiteIDValue              The string representation of the site ID of the installation selected prior to the new selection. A copy of its enabled ranges is made and stored!
 * @param {Element} dailyDatePicker             The daily date picker grabbed as $w('DailyDatePicker').
 * @param {Element} dailyChartJSInstance       : Something like $w("#ChartJsDaily")
 *
 * */
export function adjustDatesForOtherInstallations_VictronSolution_Daily(newSiteIDValue, oldSiteIDValue, dailyDatePicker,dailyChartJSInstance){
    // While the 'minDate' and 'maxDate' attributes of the 'dailyDatePicker' element say the same, the enabled and disabled dates need to be updated!
    // Here, we make copies of the enabled and disabled ranges of the installation associated with the 'oldSiteIDValue' which will be returned and
    // stored as `enabledDateRanges_ID_${oldSiteIDValue}` and `disabledDateRanges_ID_${oldSiteIDValue}` keys to the main.js file global variable
    // 'globalInstallationInformationObject'.

    const copyOfOldEnabledDateRanges = dailyDatePicker.enabledDateRanges
    const copyOfOldDisabledDateRanges = dailyDatePicker.disabledDateRanges

    // clear ranges

    dailyDatePicker.enabledDateRanges = null
    dailyDatePicker.disabledDateRanges = []

    const creationInstallationDate = dailyDatePicker.minDate // because already set by the first run of 'InitializeWorkspace_VictronSolution_Daily()' and is the same for all installations
    const creationUnixTimestamp = Math.floor(creationInstallationDate.getTime()/1000)
    const startEndArray = constructStartEndArray_VictronSolution(creationUnixTimestamp)

    return getAllEnabledDates_VictronSolution(newSiteIDValue, startEndArray).then(results => {
        let enabledDates = []
        for (const enabledDateUnixTimestamp of results){
            const enabledDateDatetimeObject = new Date(enabledDateUnixTimestamp * 1000)
            enabledDates.push({
                startDate: enabledDateDatetimeObject,
                endDate: enabledDateDatetimeObject
            })
        }
        dailyDatePicker.enabledDateRanges =  enabledDates
        // Don't change the picked date value in case the user wants to compare with the other installation.


        dailyChartJSInstance.postMessage(["Clear any existing fits.", []])

        // Fine tune the date ranges using an async function, synchronously return 'success' and let the function fine tune the date range 'in the background'
        fineTuneEnabledDateRanges_VictronSolution_Daily(dailyDatePicker, enabledDates, newSiteIDValue)

        return ['success', copyOfOldEnabledDateRanges, copyOfOldDisabledDateRanges]
    })

}


/**
 * Constructs the 'startEndArray' object that is to be used inside the 'InitializeWorkspace_VictronSolution_Daily()' function (this file).
 * It is to be used in that file, because that is where 'findBasicSchoolInformationFromID_VictronSolution()' is called and in the '.then()' callback
 * of that function, there is access to the 'timestampCreationInstallation' constant, which is needed to properly construct this array.
 * This array is compatible with and gets passed as an argument to the 'getAllEnabledDates_VictronSolution()' function, from the file
 * 'custom-http.jsx'. The latter function is, again, called inside the 'findBasicSchoolInformationFromID_VictronSolution()' '.then()' callback.
 *
 * On the basis that victron allows to sample whether data was logged on a given day in the maximum time intervall of 365 days,
 * the by this function returned startEndArray is constructed as follows:
 *
 * Start with the datetime objects associated with 'timestampCreationInstallation' and 'today'. Calculate the distance between
 * those two dates and divide by 365. If the results is smaller than or equal to one, return an array containing one element,
 *
 *  [ ['timestampCreationInstallation', 'today'], ]
 *
 * corresponding to one http call in the 'custom-http.jsx/getAllEnabledDates_VictronSolution()' function.
 * If the result is bigger than one, add 365 days to 'timestampCreationInstallation'. Define this to be the
 * secondaryElement:
 *
 * secondaryElement := 365 + 'timestampCreationInstallation'
 *
 * Then, push the element
 *
 *  [ ['timestampCreationInstallation', 'secondaryElement'], ]
 *
 * into the array. Repeat until 'secondaryElement' > 'today', in which case finalize the array through
 *
 *  [ ['timestampCreationInstallation', 'secondaryElement1'], ..., ['secondaryElement2', 'lastBeforeSecondaryElement'],
 *  ['lastBeforeSecondaryElement', 'today'] ]
 *
 * @param   {number}    unixTimestampCreationInstallation  : The unix timestamp registered with the creation of an installation.
 *
 * @return {object} startEndArray
 *
 */
function constructStartEndArray_VictronSolution(unixTimestampCreationInstallation){
    const currentDateUnixTimestamp = Math.floor(new Date().getTime()/1000)
    const distance = currentDateUnixTimestamp - unixTimestampCreationInstallation
    let quotient = distance / 365
    let startEndArray = []
    if (quotient <= 1){
        const start = unixTimestampCreationInstallation
        const end = currentDateUnixTimestamp
        startEndArray.push([start, end])
    }
    else {
        let secondaryElementUnixTimestamp = unixTimestampCreationInstallation + 365 * 24 * 3600
        while (secondaryElementUnixTimestamp < currentDateUnixTimestamp){
            if (startEndArray.length === 0){
                // No elements in 'startEndArray' => First element should be 'unixTimestampCreationInstallation'
                startEndArray.push([unixTimestampCreationInstallation, secondaryElementUnixTimestamp])
            }
            else {
                // Elements in 'startEndArray' => First element should be the second element of the array that currently
                // sits as the last element in 'startEndArray'
                const helper = startEndArray[startEndArray.length-1]
                const start = helper[1]
                const end = secondaryElementUnixTimestamp
                startEndArray.push([start, end])
            }
            secondaryElementUnixTimestamp += 365 * 24 * 3600
        }
        // while loop finished => secondaryElementUnixTimestamp > currentDateUnixTimestamp => Append the second element
        // of the last array in 'startEndArray' together with 'today' to 'startEndArray'
        const helper = startEndArray[startEndArray.length-1]
        const start = helper[1]
        const end = currentDateUnixTimestamp
        startEndArray.push([start, end])
    }

    return startEndArray

}



/**
 * Encompasses the three functions 'custom-http.jsx/returnTimeAndPowerArrays_VictronSolution_Daily()', 'postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily()'
 * and 'createAndStoreCsvBlobInButton_GeneralSolution_Daily()' into one.
 *
 * @param  {object}     datePickerValue            : The datetime object representing the chosen date, value of the datepicker element.
 * @param  {string}     SiteID                     : The Victron's Site ID. Passed as e.g. '$w("#radioGroupInstallations").value'
 * @param  {Element}    chartJsInstance            : The chart js instance grabbed with '$w("...")'
 *
 * @return {Promise<object>}    : A promise that resolves to a dictionary object containing triples of x, y and z values (time, generation, consumption).
 *
 */
export function findAndProcessData_VictronSolution_Daily(datePickerValue,SiteID, chartJsInstance){
    return returnTimeAndPowerArrays_VictronSolution_Daily(false,SiteID, datePickerValue).then(result => {
        if (result !== undefined){
        const [XArray, YArray, ZArray, dictOfXYZ] = result
        postMessageToChartJsUpdateTimeArray_GeneralSolution_Daily(chartJsInstance, XArray)
        /*
        * If you compare this function with 'findAndProcessData_DemoSolution_Daily', you will see that the line of code
        * `createAndStoreCsvBlobInButton_GeneralSolution_Daily(CsvDownloadButtonElement,XArray, YArray, ZArray)`
        * is missing.
        * This is because the aforementioned function needs the ZArray (consumption) as an input, which,
        * with Victron data is NOT shipped, but rather calculated inside the 'chartJsInstance'
        * and then a message is sent from `chartJsInstance` to the main wix velo code, that saves the calculated
        * standard consumption samples into a variable `globalZArray`.
        * This is why the aforementioned line of code, in case of Victron data, is activated when onMessage from
        * the child element in the main wix velo code.
        * The relevant line of code there is:
        *
        *  if (command === "Update universal consumption array 'globalZArray'."){...}
        *
        * */
        return dictOfXYZ
        }
    })
}

/**
 * Gets the current victron enabled date ranges in the daily date picker and sifts through them one by one through calling
 * 'returnTimeAndPowerArrays_VictronSolution_Daily' to check for days for which:
 *
 * 1.)  The eigenconsumption of the data logger is equal to the by the PV plant produced power, leading to a continuous band of values
 *      alternating between e.g. 0 and -5. The function 'returnTimeAndPowerArrays_VictronSolution_Daily' subtracts this noise from the data,
 *      so here, the criterium is whether the max of the power array is smaller or equal, say e.g. 7.
 * 2.)  The length of the time array is not equal or smaller than 288. 288 is the number of data points that should have been registered
 *      in 24 hours, if the power is sampled every 5 minutes. The time array is smaller than 288, when the logger wasn't working the day before,
 *      and suddenly starts working and collecting date at e.g. noon of the day after.
 *
 * It then disables those dates.
 *
 * @param  {Element}    datePicker                : The daily date picker, grabbed as $w('#DailyDatePicker')
 * @param  {object}     enabledDateRanges         : The dictionary object corresponding to $w('#DailyDatePicker').enabledDates
 * @param  {string}     SiteID                    : The Victron's Site ID. Passed as e.g. '$w("#radioGroupInstallations").value'
 *
 * @return {void}
 *
 */
export function fineTuneEnabledDateRanges_VictronSolution_Daily(datePicker, enabledDateRanges, SiteID){

    let disabledDateRange = []
    for (const enabledDate of  enabledDateRanges){
        const date = enabledDate['startDate']
        returnTimeAndPowerArrays_VictronSolution_Daily(false, SiteID, date).then(result => {
            if (result === undefined){
                disabledDateRange.push({
                    startDate: date,
                    endDate: date
                }) // to disable one date, wix velo needs to have it passed two times (startDate, endDate arguments)
            }
            else{
                // data exists and is iterable
                const [XArray, YArray, ZArray, dictOfXYZ] = result
                const lengthOfPowerData = XArray.length
                const maxRegisteredPowerValue = Math.max(...YArray[0])
                if (lengthOfPowerData < 278 || maxRegisteredPowerValue < 30) {
                    disabledDateRange.push({
                        startDate: date,
                        endDate: date
                    }) // to disable one date, wix velo needs to have it passed two times (startDate, endDate arguments)
                }
            }
            datePicker.disabledDateRanges = disabledDateRange // Update => Disable dates one by one (inside the outer for loop)
        })
    }


}

/*
* DEPRECATION WARNING
* This function was a prototype for the sum of all installations radio button option.
* In the future, we could think about reimplementing this, but for right now, it we cannot be done for time's sake.
*
function findAndFillWithSumOfAllData_Daily(){
    show_loader($w('#Loader2Daily'), isChromium)
    const date = $w('#DailyDatePicker').value
    const radioOptions = $w('#radioGroupInstallations').options
    /* This code is commented out because the idea behind the sum of installations was deprecated. Do not delete this comment in case the idea wants to be reimplemented in the future.
    radioOptions.pop() // Removing last element since it corresponds to the sum of installation choice, which is a toy ID (000000)
     */
/*
    const numberOfRadioOptions = radioOptions.length
    console.log("numberOfRadioOptions ", numberOfRadioOptions , "radioOptions ", radioOptions)
    let arrayOfDicts = []
    for (const choice of radioOptions){
        returnPowerData(false, date, choice.value).then(dataDictionary => {
            arrayOfDicts.push(dataDictionary)
            // if the length of sumArray is equal to the 'numberOfRadioOptions', then all promises must have resolved.
            if (arrayOfDicts.length === numberOfRadioOptions){
                const sumOfDataDictionary = {}
                arrayOfDicts.forEach(dict => {
                    for (let key in dict){
                        if (dict.hasOwnProperty(key)){
                            sumOfDataDictionary[key] = (sumOfDataDictionary[key] || 0) + dict[key]
                        }
                    }
                })

                pushGraphDataToPlotter($w("#ChartJsDaily"), sumOfDataDictionary)
                reset_results_from_fit_and_hide_texts($w("#EnergieKontrollErgebnis"),$w("#AbweichungDesIntegrals"), $w("#Nullstellen"),$w("#GrenzenFitintervall"))
                $w("#ChartJsDaily").postMessage(["Clear any existing fits.", []])
                hide_loader($w('#Loader2Daily'), isChromium)
            }
        })
    }
}


*/